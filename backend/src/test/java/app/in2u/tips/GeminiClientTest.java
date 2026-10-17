package app.in2u.tips;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import app.in2u.mood.MoodCheckin;
import tools.jackson.databind.ObjectMapper;

class GeminiClientTest {

	private static MoodCheckin mood(int value, String note) {
		var c = new MoodCheckin(UUID.randomUUID(), UUID.randomUUID(), LocalDate.now());
		c.update(value, note);
		return c;
	}

	@Test
	void notesAreNotSentUnlessOptedIn() {
		var checkins = List.of(mood(2, "discutimos por dinero"));
		assertThat(GeminiClient.requestBody("Ana", checkins, false).toString()).doesNotContain("discutimos");
		assertThat(GeminiClient.requestBody("Ana", checkins, true).toString()).contains("discutimos");
	}

	@Test
	void parsesValidResponse_andRejectsUnknownTipKeys() throws Exception {
		var json = new ObjectMapper();
		String ok = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"tip_key\\\":\\\"volver-rapido\\\",\\\"kicker\\\":\\\"Ana viene mal\\\",\\\"advice\\\":\\\"Escríbele hoy.\\\"}\"}]}}]}";
		var parsed = GeminiClient.parse(json.readTree(ok), "Ana");
		assertThat(parsed).isPresent();
		assertThat(parsed.get().source()).isEqualTo("gemini");

		String badKey = ok.replace("volver-rapido", "inventado");
		assertThat(GeminiClient.parse(json.readTree(badKey), "Ana")).isEmpty();
		assertThat(GeminiClient.parse(json.readTree("{}"), "Ana")).isEmpty();
	}
}
