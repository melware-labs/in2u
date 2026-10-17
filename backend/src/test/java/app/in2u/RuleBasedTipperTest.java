package app.in2u;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import app.in2u.mood.MoodCheckin;
import app.in2u.tips.RuleBasedTipper;
import app.in2u.tips.TipCatalog;

class RuleBasedTipperTest {

	private static MoodCheckin mood(int value, int daysAgo) {
		var c = new MoodCheckin(UUID.randomUUID(), UUID.randomUUID(), LocalDate.now().minusDays(daysAgo));
		c.update(value, null);
		return c;
	}

	@Test
	void veryLowMood_suggestsListening() {
		var s = RuleBasedTipper.suggest("Ana", List.of(mood(1, 0)));
		assertThat(s.tipKey()).isIn("preguntar-antes-de-resolver", "ofrecer-compania", "quitar-una-tarea",
				"mensaje-sin-pregunta");
	}

	@Test
	void severalTiredDays_suggestsPredictability() {
		var s = RuleBasedTipper.suggest("Ana", List.of(mood(3, 0), mood(3, 1), mood(3, 2)));
		assertThat(s.tipKey()).isIn("avisar-cuando-volves", "plan-sencillo", "preguntar-como-esta-de-verdad");
	}

	@Test
	void recoveringAfterBadDay_suggestsRepair() {
		var s = RuleBasedTipper.suggest("Ana", List.of(mood(4, 0), mood(2, 1)));
		assertThat(s.tipKey()).isIn("volver-rapido", "celebrar-mejoria");
	}

	@Test
	void everySuggestionIsInTheCatalog() {
		for (int m = 1; m <= 6; m++) {
			assertThat(TipCatalog.isValid(RuleBasedTipper.suggest("Ana", List.of(mood(m, 0))).tipKey())).isTrue();
		}
	}

	@Test
	void sameMoodOnDifferentDays_rotatesTheTip() {
		var keys = java.util.stream.IntStream.range(0, 4)
			.mapToObj(d -> RuleBasedTipper.suggest("Ana", List.of(mood(3, d))).tipKey())
			.collect(java.util.stream.Collectors.toSet());
		assertThat(keys.size()).isGreaterThan(1);
	}

	@Test
	void everyOptionIsInTheCatalog() {
		for (var options : List.of(RuleBasedTipper.HEAVY_DAY, RuleBasedTipper.LOW_ENERGY_STREAK,
				RuleBasedTipper.RECOVERING, RuleBasedTipper.GOOD_DAY, RuleBasedTipper.NORMAL_DAY)) {
			options.forEach(o -> assertThat(TipCatalog.isValid(o.key())).isTrue());
		}
	}
}
