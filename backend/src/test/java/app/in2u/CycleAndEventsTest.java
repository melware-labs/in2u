package app.in2u;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.OAuth2LoginRequestPostProcessor;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class CycleAndEventsTest {

	@Container
	static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

	@DynamicPropertySource
	static void db(DynamicPropertyRegistry r) {
		r.add("spring.datasource.url", postgres::getJdbcUrl);
		r.add("spring.datasource.username", postgres::getUsername);
		r.add("spring.datasource.password", postgres::getPassword);
		r.add("in2u.gemini.api-key", () -> "");
	}

	@Autowired
	MockMvc mvc;

	static OAuth2LoginRequestPostProcessor as(String who) {
		return oauth2Login().attributes(a -> {
			a.put("sub", "test:" + who);
			a.put("email", who + "@example.com");
			a.put("name", who);
		});
	}

	String json(OAuth2LoginRequestPostProcessor who, String method, String path, String body) throws Exception {
		var builder = switch (method) {
			case "POST" -> post(path);
			case "PUT" -> put(path);
			case "DELETE" -> delete(path);
			default -> get(path);
		};
		builder.with(who).with(csrf());
		if (body != null) {
			builder.contentType(MediaType.APPLICATION_JSON).content(body);
		}
		return mvc.perform(builder).andReturn().getResponse().getContentAsString();
	}

	/** Deja a las dos personas vinculadas. */
	void pair(String a, String b) throws Exception {
		String code = JsonPath.read(json(as(a), "POST", "/api/couple", null), "$.inviteCode");
		mvc.perform(post("/api/couple/join").with(as(b)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"code\":\"" + code + "\"}")).andExpect(status().isOk());
	}

	@Test
	void partnerOnlySeesWhatTheOwnerChoseToShare() throws Exception {
		pair("laura", "diego");
		var laura = as("laura");
		var diego = as("diego");
		String today = LocalDate.now().toString();

		// Sin configurar: la pareja no ve nada, aunque haya datos.
		mvc.perform(post("/api/cycle/periods").with(laura).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"date\":\"" + today + "\"}")).andExpect(status().isOk());
		mvc.perform(put("/api/cycle/symptoms").with(laura).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"symptoms\":[\"dolor\",\"insomnio\"]}")).andExpect(status().isOk());
		mvc.perform(get("/api/cycle/partner").with(diego))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.visibility").value("nada"))
			.andExpect(jsonPath("$.phase").doesNotExist())
			.andExpect(jsonPath("$.hasData").doesNotExist());

		// "avisos": solo una señal genérica, ni fase ni fechas ni día del ciclo.
		mvc.perform(put("/api/cycle/settings").with(laura).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"cycleLengthDays\":29,\"periodLengthDays\":5,\"partnerVisibility\":\"avisos\"}"))
			.andExpect(status().isOk());
		String avisos = mvc.perform(get("/api/cycle/partner").with(diego))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.visibility").value("avisos"))
			.andExpect(jsonPath("$.hasData").value(true))
			.andExpect(jsonPath("$.careMode").value(true)) // día 1 = menstrual
			.andExpect(jsonPath("$.phase").doesNotExist())
			.andExpect(jsonPath("$.dayOfCycle").doesNotExist())
			.andExpect(jsonPath("$.nextPeriodDate").doesNotExist())
			.andReturn().getResponse().getContentAsString();
		assertThat(avisos).doesNotContain(today).doesNotContain("dolor");

		// "fase_y_avisos": fase y día, pero nunca los síntomas.
		mvc.perform(put("/api/cycle/settings").with(laura).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"cycleLengthDays\":29,\"periodLengthDays\":5,\"partnerVisibility\":\"fase_y_avisos\"}"))
			.andExpect(status().isOk());
		String fase = mvc.perform(get("/api/cycle/partner").with(diego))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.phase").value("menstrual"))
			.andExpect(jsonPath("$.dayOfCycle").value(1))
			.andExpect(jsonPath("$.daysUntilNextPeriod").value(29))
			.andReturn().getResponse().getContentAsString();
		assertThat(fase).doesNotContain("dolor").doesNotContain("insomnio").doesNotContain("symptoms");

		// Diego no puede leer ni cambiar el ciclo de Laura por la API propia: /api/cycle es solo suyo.
		mvc.perform(get("/api/cycle").with(diego))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.periodStarts.length()").value(0))
			.andExpect(jsonPath("$.todaySymptoms.length()").value(0));
	}

	@Test
	void cycleInputIsValidated() throws Exception {
		pair("vero", "tomas");
		mvc.perform(put("/api/cycle/settings").with(as("vero")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"cycleLengthDays\":29,\"periodLengthDays\":5,\"partnerVisibility\":\"todo\"}"))
			.andExpect(status().isBadRequest());
		mvc.perform(put("/api/cycle/settings").with(as("vero")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"cycleLengthDays\":10,\"periodLengthDays\":5,\"partnerVisibility\":\"nada\"}"))
			.andExpect(status().isBadRequest());
		mvc.perform(post("/api/cycle/periods").with(as("vero")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"date\":\"" + LocalDate.now().plusDays(3) + "\"}"))
			.andExpect(status().isBadRequest());
		mvc.perform(put("/api/cycle/symptoms").with(as("vero")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"symptoms\":[\"inventado\"]}"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void periodStartsAreIdempotentAndRemovable() throws Exception {
		pair("rosa", "pablo");
		var rosa = as("rosa");
		String d = LocalDate.now().minusDays(2).toString();
		for (int i = 0; i < 2; i++) {
			mvc.perform(post("/api/cycle/periods").with(rosa).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content("{\"date\":\"" + d + "\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.periodStarts.length()").value(1));
		}
		mvc.perform(delete("/api/cycle/periods/" + d).with(rosa).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.periodStarts.length()").value(0))
			.andExpect(jsonPath("$.today").doesNotExist());
	}

	@Test
	void eventVisibilityAndOwnership() throws Exception {
		pair("marta", "eli");
		var marta = as("marta");
		var eli = as("eli");
		String from = "2026-11-01T00:00:00Z";
		String to = "2026-12-01T00:00:00Z";

		String privateId = JsonPath.read(json(marta, "POST", "/api/events",
				"{\"title\":\"Sorpresa\",\"startsAt\":\"2026-11-10T15:00:00Z\",\"endsAt\":\"2026-11-10T16:00:00Z\",\"visibility\":\"solo_yo\"}"),
				"$.id");
		String sharedId = JsonPath.read(json(marta, "POST", "/api/events",
				"{\"title\":\"Cena\",\"startsAt\":\"2026-11-12T20:00:00Z\",\"endsAt\":\"2026-11-12T22:00:00Z\",\"visibility\":\"los_dos\"}"),
				"$.id");

		// Marta ve los dos; Eli solo el compartido.
		mvc.perform(get("/api/events").param("from", from).param("to", to).with(marta))
			.andExpect(jsonPath("$.length()").value(2));
		mvc.perform(get("/api/events").param("from", from).param("to", to).with(eli))
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].title").value("Cena"))
			.andExpect(jsonPath("$[0].mine").value(false));

		// Eli no puede borrar el evento de Marta (403) y el privado "no existe" para él (404).
		mvc.perform(delete("/api/events/" + sharedId).with(eli).with(csrf())).andExpect(status().isForbidden());
		mvc.perform(delete("/api/events/" + privateId).with(eli).with(csrf())).andExpect(status().isNotFound());

		mvc.perform(delete("/api/events/" + privateId).with(marta).with(csrf())).andExpect(status().isNoContent());
		mvc.perform(get("/api/events").param("from", from).param("to", to).with(marta))
			.andExpect(jsonPath("$.length()").value(1));
	}

	@Test
	void eventInputIsValidated_andRequiresACouple() throws Exception {
		mvc.perform(post("/api/events").with(as("sola")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"title\":\"X\",\"startsAt\":\"2026-11-10T15:00:00Z\",\"endsAt\":\"2026-11-10T16:00:00Z\",\"visibility\":\"los_dos\"}"))
			.andExpect(status().isConflict());

		pair("nico", "ana2");
		var nico = as("nico");
		mvc.perform(post("/api/events").with(nico).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"title\":\"  \",\"startsAt\":\"2026-11-10T15:00:00Z\",\"endsAt\":\"2026-11-10T16:00:00Z\",\"visibility\":\"los_dos\"}"))
			.andExpect(status().isBadRequest());
		mvc.perform(post("/api/events").with(nico).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"title\":\"X\",\"startsAt\":\"2026-11-10T16:00:00Z\",\"endsAt\":\"2026-11-10T15:00:00Z\",\"visibility\":\"los_dos\"}"))
			.andExpect(status().isBadRequest());
		mvc.perform(get("/api/events").param("from", "2026-01-01T00:00:00Z").param("to", "2027-01-01T00:00:00Z")
			.with(nico)).andExpect(status().isBadRequest());
	}
}
