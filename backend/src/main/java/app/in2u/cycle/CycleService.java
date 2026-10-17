package app.in2u.cycle;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.annotation.JsonInclude;

import app.in2u.couple.CoupleService;
import app.in2u.user.AppUser;

/**
 * Ciclo menstrual: dato sensible. La pareja nunca lee las tablas crudas: su
 * único canal es {@link #partnerSummary}, que calcula la fase acá y devuelve
 * solo el subconjunto que corresponde al nivel de privacidad elegido, y nunca
 * toca los síntomas diarios.
 */
@Service
public class CycleService {

	public static final Set<String> VISIBILITIES = Set.of("nada", "avisos", "fase_y_avisos");

	public static final Set<String> SYMPTOMS = Set.of("dolor", "sangrado", "sin_energia", "antojos", "insomnio");

	private static final int PERIODS_SHOWN = 24;

	private final CycleSettingsRepository settings;

	private final CyclePeriodRepository periods;

	private final CycleDailyLogRepository logs;

	private final CoupleService couples;

	private final Clock clock;

	public CycleService(CycleSettingsRepository settings, CyclePeriodRepository periods,
			CycleDailyLogRepository logs, CoupleService couples, Clock clock) {
		this.settings = settings;
		this.periods = periods;
		this.logs = logs;
		this.couples = couples;
		this.clock = clock;
	}

	/** Lo que ve la dueña de su propio ciclo. */
	public record OwnCycle(int cycleLengthDays, int periodLengthDays, String partnerVisibility,
			List<LocalDate> periodStarts, CyclePhaseCalculator.Result today, List<String> todaySymptoms) {
	}

	/** Lo que ve la pareja; los campos nulos no se serializan, así "avisos" no deja ni rastro de la fase. */
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record PartnerSummary(String visibility, Boolean hasData, Boolean careMode, String phase,
			Integer dayOfCycle, Integer cycleLength, LocalDate nextPeriodDate, Integer daysUntilNextPeriod) {
	}

	@Transactional(readOnly = true)
	public OwnCycle own(AppUser user) {
		CycleSettings s = settings.findById(user.getId()).orElse(new CycleSettings(user.getId()));
		List<LocalDate> starts = periods.findByUserIdOrderByStartDateDesc(user.getId(), PageRequest.of(0, PERIODS_SHOWN))
			.stream().map(CyclePeriod::getStartDate).toList();
		LocalDate today = user.today(clock);
		var phase = starts.isEmpty() ? null
				: CyclePhaseCalculator.compute(starts.get(0), s.getCycleLengthDays(), s.getPeriodLengthDays(), today);
		List<String> symptoms = logs.findByUserIdAndLogDate(user.getId(), today)
			.map(l -> List.of(l.getSymptoms())).orElse(List.of());
		return new OwnCycle(s.getCycleLengthDays(), s.getPeriodLengthDays(), s.getPartnerVisibility(), starts, phase,
				symptoms);
	}

	@Transactional
	public void updateSettings(AppUser user, int cycleLength, int periodLength, String visibility) {
		if (cycleLength < 20 || cycleLength > 45 || periodLength < 1 || periodLength > 10
				|| periodLength >= cycleLength || !VISIBILITIES.contains(visibility)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valores de ciclo inválidos.");
		}
		CycleSettings s = settings.findById(user.getId()).orElse(new CycleSettings(user.getId()));
		s.update(cycleLength, periodLength, visibility);
		settings.save(s);
	}

	/** Idempotente: marcar dos veces el mismo día no duplica. */
	@Transactional
	public void addPeriodStart(AppUser user, LocalDate date) {
		if (date.isAfter(user.today(clock))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes registrar un inicio en el futuro.");
		}
		if (periods.findByUserIdAndStartDate(user.getId(), date).isEmpty()) {
			periods.save(new CyclePeriod(user.getId(), date));
		}
	}

	@Transactional
	public void removePeriodStart(AppUser user, LocalDate date) {
		periods.deleteByUserIdAndStartDate(user.getId(), date);
	}

	@Transactional
	public List<String> setTodaySymptoms(AppUser user, List<String> symptoms) {
		if (!SYMPTOMS.containsAll(symptoms)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Síntoma desconocido.");
		}
		LocalDate today = user.today(clock);
		CycleDailyLog log = logs.findByUserIdAndLogDate(user.getId(), today)
			.orElseGet(() -> new CycleDailyLog(user.getId(), today));
		String[] distinct = symptoms.stream().distinct().toArray(String[]::new);
		log.setSymptoms(distinct);
		logs.save(log);
		return Arrays.asList(distinct);
	}

	/** El único canal hacia la pareja. */
	@Transactional(readOnly = true)
	public PartnerSummary partnerSummary(AppUser reader) {
		couples.requirePaired(reader);
		Optional<UUID> ownerId = couples.partnerId(reader);
		if (ownerId.isEmpty()) {
			return new PartnerSummary("nada", null, null, null, null, null, null, null);
		}
		Optional<CycleSettings> s = settings.findById(ownerId.get());
		if (s.isEmpty() || s.get().getPartnerVisibility().equals("nada")) {
			return new PartnerSummary("nada", null, null, null, null, null, null, null);
		}
		String level = s.get().getPartnerVisibility();
		var starts = periods.findByUserIdOrderByStartDateDesc(ownerId.get(), PageRequest.of(0, 1));
		if (starts.isEmpty()) {
			return new PartnerSummary(level, false, null, null, null, null, null, null);
		}
		// La fase se calcula con "hoy" de quien la tiene, no el de quien mira.
		LocalDate ownerToday = LocalDate.now(clock.withZone(couples.zoneOf(ownerId.get())));
		var phase = CyclePhaseCalculator.compute(starts.get(0).getStartDate(), s.get().getCycleLengthDays(),
				s.get().getPeriodLengthDays(), ownerToday);
		if (level.equals("avisos")) {
			boolean care = phase.phase() == CyclePhaseCalculator.Phase.MENSTRUAL
					|| phase.phase() == CyclePhaseCalculator.Phase.LUTEA;
			return new PartnerSummary(level, true, care, null, null, null, null, null);
		}
		return new PartnerSummary(level, true, null, phase.phase().wire(), phase.dayOfCycle(), phase.cycleLength(),
				phase.nextPeriodDate(), phase.daysUntilNextPeriod());
	}
}
