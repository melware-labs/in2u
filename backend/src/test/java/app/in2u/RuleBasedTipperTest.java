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
		assertThat(s.tipKey()).isEqualTo("preguntar-antes-de-resolver");
	}

	@Test
	void severalTiredDays_suggestsPredictability() {
		var s = RuleBasedTipper.suggest("Ana", List.of(mood(3, 0), mood(3, 1), mood(3, 2)));
		assertThat(s.tipKey()).isEqualTo("avisar-cuando-volves");
	}

	@Test
	void recoveringAfterBadDay_suggestsRepair() {
		var s = RuleBasedTipper.suggest("Ana", List.of(mood(4, 0), mood(2, 1)));
		assertThat(s.tipKey()).isEqualTo("volver-rapido");
	}

	@Test
	void everySuggestionIsInTheCatalog() {
		for (int m = 1; m <= 6; m++) {
			assertThat(TipCatalog.isValid(RuleBasedTipper.suggest("Ana", List.of(mood(m, 0))).tipKey())).isTrue();
		}
	}
}
