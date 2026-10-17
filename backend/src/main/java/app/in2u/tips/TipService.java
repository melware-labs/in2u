package app.in2u.tips;

import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import app.in2u.couple.CoupleService;
import app.in2u.mood.MoodCheckin;
import app.in2u.mood.MoodService;
import app.in2u.mood.MoodStream;
import app.in2u.user.AppUser;
import app.in2u.user.AppUserRepository;

/**
 * Cada vez que alguien guarda su ánimo, su pareja recibe un consejo del día
 * ajustado a ese ánimo. Si esa persona vuelve a cambiar su check-in, el
 * consejo se recalcula (upsert por pareja + día).
 */
@Service
public class TipService {

	private static final Logger log = LoggerFactory.getLogger(TipService.class);

	private final DailyTipRepository tips;

	private final AppUserRepository users;

	private final CoupleService couples;

	private final MoodService moods;

	private final MoodStream stream;

	private final GeminiClient gemini;

	private final Clock clock;

	public TipService(DailyTipRepository tips, AppUserRepository users, CoupleService couples, MoodService moods,
			MoodStream stream, GeminiClient gemini, Clock clock) {
		this.tips = tips;
		this.users = users;
		this.couples = couples;
		this.moods = moods;
		this.stream = stream;
		this.gemini = gemini;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public Optional<DailyTip> todayFor(AppUser reader) {
		return tips.findByForUserIdAndTipDate(reader.getId(), reader.today(clock));
	}

	/**
	 * Corre en otro hilo y solo después del commit: guardar el check-in nunca
	 * espera a la IA ni falla por ella (mismo contrato que la Edge Function).
	 */
	@Async
	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void onCheckinSaved(MoodService.CheckinSaved event) {
		try {
			generateFor(event.authorId());
		}
		catch (Exception e) {
			log.error("No se pudo generar el consejo del día", e);
		}
	}

	void generateFor(UUID authorId) {
		AppUser author = users.findById(authorId).orElse(null);
		if (author == null) {
			return;
		}
		Optional<UUID> partnerId = couples.partnerId(author);
		if (partnerId.isEmpty()) {
			return;
		}
		AppUser partner = users.findById(partnerId.get()).orElseThrow();
		List<MoodCheckin> recent = moods.recentOf(authorId, 5);
		if (recent.isEmpty()) {
			return;
		}
		String name = firstName(author);
		TipSuggestion suggestion = gemini.suggest(name, recent).orElseGet(() -> RuleBasedTipper.suggest(name, recent));
		save(author, partner, suggestion);
	}

	void save(AppUser author, AppUser partner, TipSuggestion suggestion) {
		var coupleId = couples.findFor(author).orElseThrow().getId();
		var today = partner.today(clock);
		DailyTip tip = tips.findByForUserIdAndTipDate(partner.getId(), today)
			.orElseGet(() -> new DailyTip(coupleId, partner.getId(), author.getId(), today));
		tip.apply(suggestion);
		tips.save(tip);
		stream.publish(coupleId, "tip");
	}

	private static String firstName(AppUser u) {
		String n = u.getDisplayName();
		return n == null || n.isBlank() ? "Tu pareja" : n.strip().split("\\s+")[0];
	}
}
