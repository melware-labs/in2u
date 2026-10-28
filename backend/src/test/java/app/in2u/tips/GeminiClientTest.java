package app.in2u.tips;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

import app.in2u.config.In2uProperties;

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

	private static final String OK = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"ok\\\":true}\"}]}}]}";

	private static HttpServer server(AtomicInteger calls, int failures, String contentType) throws Exception {
		var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/", ex -> {
			boolean fail = calls.incrementAndGet() <= failures;
			byte[] body = (fail ? "{\"error\":{\"message\":\"high demand\"}}" : OK).getBytes();
			if (contentType != null) {
				ex.getResponseHeaders().add("Content-Type", contentType);
			}
			ex.sendResponseHeaders(fail ? 503 : 200, body.length);
			ex.getResponseBody().write(body);
			ex.close();
		});
		server.start();
		return server;
	}

	private static GeminiClient client(HttpServer server) {
		var props = new In2uProperties("", false, new In2uProperties.Gemini("key", "m", false), null, null);
		return new GeminiClient(props, "http://127.0.0.1:" + server.getAddress().getPort());
	}

	@Test
	void readsTheResponseEvenWithoutJsonContentType() throws Exception {
		var calls = new AtomicInteger();
		var server = server(calls, 0, "application/octet-stream");
		try {
			var json = client(server).generateJson("hola", java.util.Map.of("type", "OBJECT"));
			assertThat(json).isPresent();
			assertThat(json.get().path("ok").asBoolean()).isTrue();
		}
		finally {
			server.stop(0);
		}
	}

	@Test
	void retriesWhenGoogleIsOverloaded() throws Exception {
		var calls = new AtomicInteger();
		var server = server(calls, 1, "application/json");
		try {
			var json = client(server).generateJson("hola", java.util.Map.of("type", "OBJECT"));
			assertThat(json).isPresent();
			assertThat(calls.get()).isEqualTo(2);
		}
		finally {
			server.stop(0);
		}
	}
}
