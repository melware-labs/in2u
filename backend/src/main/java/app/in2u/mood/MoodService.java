package app.in2u.mood;

import java.time.Clock;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import app.in2u.couple.Couple;
import app.in2u.couple.CoupleService;
import app.in2u.user.AppUser;

@Service
public class MoodService {

	private final MoodCheckinRepository checkins;

	private final CoupleService couples;

	private final MoodStream stream;

	private final ApplicationEventPublisher events;

	private final Clock clock;

	private final app.in2u.push.PushNotificationService pushNotifications;

	private final app.in2u.user.AppUserRepository users;

	public MoodService(MoodCheckinRepository checkins, CoupleService couples, MoodStream stream,
			ApplicationEventPublisher events, Clock clock, app.in2u.push.PushNotificationService pushNotifications,
			app.in2u.user.AppUserRepository users) {
		this.checkins = checkins;
		this.couples = couples;
		this.stream = stream;
		this.events = events;
		this.clock = clock;
		this.pushNotifications = pushNotifications;
		this.users = users;
	}

	/** Crea o reemplaza el check-in de hoy (uno por persona por día). */
	@Transactional
	public MoodCheckin saveToday(AppUser user, int mood, String note) {
		if (mood < 1 || mood > 6) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El ánimo va de 1 a 6.");
		}
		Couple couple = couples.requirePaired(user);
		var today = user.today(clock);
		MoodCheckin checkin = checkins.findByUserIdAndCheckinDate(user.getId(), today)
			.orElseGet(() -> new MoodCheckin(couple.getId(), user.getId(), today));
		checkin.update(mood, note);
		try {
			checkin = checkins.saveAndFlush(checkin);
		}
		catch (DataIntegrityViolationException doubleSubmit) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya se estaba guardando tu check-in.");
		}
		// El listener corre después del commit: la pareja nunca ve un ánimo
		// que no quedó guardado, y la IA lee el dato ya confirmado.
		events.publishEvent(new CheckinSaved(couple.getId(), user.getId(), checkin.getId()));
		return checkin;
	}

	@Transactional(readOnly = true)
	public List<MoodCheckin> lastWeek(AppUser user) {
		Couple couple = couples.requirePaired(user);
		return checkins.findByCoupleIdAndCheckinDateGreaterThanEqual(couple.getId(), user.today(clock).minusDays(6));
	}

	@Transactional(readOnly = true)
	public List<MoodCheckin> recentOf(java.util.UUID userId, int limit) {
		return checkins.findByUserIdOrderByCheckinDateDesc(userId, PageRequest.of(0, limit));
	}

	/** Avisa a la pareja por SSE y push, solo cuando el check-in ya quedó guardado. */
	@org.springframework.transaction.event.TransactionalEventListener(
			phase = org.springframework.transaction.event.TransactionPhase.AFTER_COMMIT)
	void notifyPartner(CheckinSaved event) {
		stream.publish(event.coupleId(), "mood");
		String authorName = users.findById(event.authorId())
				.map(app.in2u.user.AppUser::getDisplayName)
				.orElse("Tu pareja");
		pushNotifications.notifyPartner(event.coupleId(), event.authorId(), "in2u",
				authorName + " registró su ánimo de hoy", "/");
	}

	public MoodStream stream() {
		return stream;
	}

	public record CheckinSaved(java.util.UUID coupleId, java.util.UUID authorId, java.util.UUID checkinId) {
	}
}
