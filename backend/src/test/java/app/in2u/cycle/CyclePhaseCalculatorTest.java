package app.in2u.cycle;

import static app.in2u.cycle.CyclePhaseCalculator.Phase.FOLICULAR;
import static app.in2u.cycle.CyclePhaseCalculator.Phase.LUTEA;
import static app.in2u.cycle.CyclePhaseCalculator.Phase.MENSTRUAL;
import static app.in2u.cycle.CyclePhaseCalculator.Phase.OVULACION;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

class CyclePhaseCalculatorTest {

	private static final LocalDate START = LocalDate.of(2026, 10, 1);

	private static CyclePhaseCalculator.Result on(int daysAfterStart) {
		return CyclePhaseCalculator.compute(START, 29, 5, START.plusDays(daysAfterStart));
	}

	@Test
	void bucketsMatchTheMockProportionsForA29DayCycle() {
		var b = CyclePhaseCalculator.buckets(29, 5);
		assertThat(b.folicularDays()).isEqualTo(8);
		assertThat(b.ovulacionDays()).isEqualTo(4);
	}

	@Test
	void phaseBoundariesFor29DayCycleWith5DayPeriod() {
		assertThat(on(0).phase()).isEqualTo(MENSTRUAL);
		assertThat(on(4).phase()).isEqualTo(MENSTRUAL);
		assertThat(on(5).phase()).isEqualTo(FOLICULAR);
		assertThat(on(12).phase()).isEqualTo(FOLICULAR);
		assertThat(on(13).phase()).isEqualTo(OVULACION);
		assertThat(on(16).phase()).isEqualTo(OVULACION);
		assertThat(on(17).phase()).isEqualTo(LUTEA);
		assertThat(on(28).phase()).isEqualTo(LUTEA);
	}

	@Test
	void cycleWrapsAroundAndCountsDays() {
		var firstDay = on(0);
		assertThat(firstDay.dayOfCycle()).isEqualTo(1);
		assertThat(firstDay.daysUntilNextPeriod()).isEqualTo(29);
		assertThat(firstDay.nextPeriodDate()).isEqualTo(START.plusDays(29));

		var wrapped = on(29);
		assertThat(wrapped.phase()).isEqualTo(MENSTRUAL);
		assertThat(wrapped.dayOfCycle()).isEqualTo(1);
		assertThat(wrapped.nextPeriodDate()).isEqualTo(START.plusDays(58));

		assertThat(on(28).daysUntilNextPeriod()).isEqualTo(1);
	}

	@Test
	void fertileWindowFollowsTheFollicularPhase() {
		var r = on(0);
		assertThat(r.fertileWindowStart()).isEqualTo(START.plusDays(13));
		assertThat(r.fertileWindowEnd()).isEqualTo(START.plusDays(17));
	}

	@Test
	void dateBeforeTheAnchorStillLandsInsideTheCycle() {
		var r = on(-1);
		assertThat(r.dayOfCycle()).isEqualTo(29);
		assertThat(r.phase()).isEqualTo(LUTEA);
		assertThat(r.nextPeriodDate()).isEqualTo(START);
	}

	@Test
	void otherCycleLengthsScaleTheBuckets() {
		var b = CyclePhaseCalculator.buckets(35, 6); // resto 29 -> 9.67 / 4.83
		assertThat(b.folicularDays()).isEqualTo(10);
		assertThat(b.ovulacionDays()).isEqualTo(5);
	}
}
