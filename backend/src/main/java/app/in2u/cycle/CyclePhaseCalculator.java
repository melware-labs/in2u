package app.in2u.cycle;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Fórmula de fase del ciclo, portada de compute_cycle_phase() (SQL) y
 * computeCyclePhase() (TS) de la versión anterior; ahora existe una sola
 * copia. Proporciones del mock (menstrual:folicular:ovulación:lútea =
 * 5:8:4:12 sobre 29 días) escaladas a la duración configurada.
 */
public final class CyclePhaseCalculator {

	public enum Phase {

		MENSTRUAL("menstrual"), FOLICULAR("folicular"), OVULACION("ovulacion"), LUTEA("lutea");

		private final String wire;

		Phase(String wire) {
			this.wire = wire;
		}

		@com.fasterxml.jackson.annotation.JsonValue
		public String wire() {
			return wire;
		}
	}

	public record Result(int dayOfCycle, int cycleLength, Phase phase, LocalDate nextPeriodDate,
			int daysUntilNextPeriod, LocalDate fertileWindowStart, LocalDate fertileWindowEnd) {
	}

	public record Buckets(int folicularDays, int ovulacionDays) {
	}

	public static Buckets buckets(int cycleLength, int periodLength) {
		int remaining = Math.max(cycleLength - periodLength, 1);
		// Math.round redondea .5 hacia arriba, igual que round() de Postgres y de JS para positivos.
		return new Buckets((int) Math.round(remaining * 8.0 / 24), (int) Math.round(remaining * 4.0 / 24));
	}

	/** @param dayOfCycle0 0-indexado desde el inicio del período (día de sangrado = 0). */
	public static Phase phaseForOffset(int dayOfCycle0, int cycleLength, int periodLength) {
		Buckets b = buckets(cycleLength, periodLength);
		if (dayOfCycle0 < periodLength) {
			return Phase.MENSTRUAL;
		}
		if (dayOfCycle0 < periodLength + b.folicularDays()) {
			return Phase.FOLICULAR;
		}
		if (dayOfCycle0 < periodLength + b.folicularDays() + b.ovulacionDays()) {
			return Phase.OVULACION;
		}
		return Phase.LUTEA;
	}

	public static Result compute(LocalDate lastPeriodStart, int cycleLength, int periodLength, LocalDate asOf) {
		long daysSinceStart = ChronoUnit.DAYS.between(lastPeriodStart, asOf);
		int dayOfCycle0 = (int) Math.floorMod(daysSinceStart, (long) cycleLength);
		Buckets b = buckets(cycleLength, periodLength);
		long cyclesElapsed = Math.floorDiv(daysSinceStart, (long) cycleLength);
		return new Result(dayOfCycle0 + 1, cycleLength, phaseForOffset(dayOfCycle0, cycleLength, periodLength),
				lastPeriodStart.plusDays((cyclesElapsed + 1) * cycleLength), cycleLength - dayOfCycle0,
				lastPeriodStart.plusDays(periodLength + b.folicularDays()),
				lastPeriodStart.plusDays(periodLength + b.folicularDays() + b.ovulacionDays()));
	}

	private CyclePhaseCalculator() {
	}
}
