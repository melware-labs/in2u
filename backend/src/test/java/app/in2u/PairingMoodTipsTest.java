package app.in2u;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.concurrent.TimeUnit;

import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.OAuth2LoginRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class PairingMoodTipsTest {

	@Container
	static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

	@DynamicPropertySource
	static void db(DynamicPropertyRegistry r) {
		r.add("spring.datasource.url", postgres::getJdbcUrl);
		r.add("spring.datasource.username", postgres::getUsername);
		r.add("spring.datasource.password", postgres::getPassword);
		r.add("in2u.gemini.api-key", () -> ""); // sin IA: ejercita el respaldo por reglas
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

	@Test
	void apiRequiresLogin() throws Exception {
		mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
	}

	@Test
	void fullFlow_pairing_mood_and_tip_for_partner() throws Exception {
		// Ana crea el código, Raúl se une con él.
		String code = JsonPath.read(mvc.perform(post("/api/couple").with(as("ana")).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.state").value("waiting"))
			.andReturn().getResponse().getContentAsString(), "$.inviteCode");

		mvc.perform(post("/api/couple/join").with(as("raul")).with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"" + code.toLowerCase() + "\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.state").value("paired"))
			.andExpect(jsonPath("$.partner.name").value("ana"));

		// Un tercero no puede usar un código ya usado.
		mvc.perform(post("/api/couple/join").with(as("intruso")).with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"" + code + "\"}"))
			.andExpect(status().isBadRequest());

		// Ana registra un mal día; Raúl lo ve y recibe un consejo.
		mvc.perform(put("/api/mood/today").with(as("ana")).with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"mood\":1,\"note\":\"día pesado\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.mood").value(1));

		mvc.perform(get("/api/mood/week").with(as("raul")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].mine").value(false));

		Awaitility.await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
			String body = mvc.perform(get("/api/tips/today").with(as("raul")))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
			assertThat(JsonPath.<String>read(body, "$.tipKey")).isEqualTo("preguntar-antes-de-resolver");
			assertThat(JsonPath.<String>read(body, "$.source")).isEqualTo("reglas");
		});

		// Ana no recibe consejo de su propio ánimo.
		mvc.perform(get("/api/tips/today").with(as("ana"))).andExpect(status().isNoContent());

		// Cambiar el ánimo del mismo día reemplaza el check-in (uno por día).
		mvc.perform(put("/api/mood/today").with(as("ana")).with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"mood\":6}"))
			.andExpect(status().isOk());
		mvc.perform(get("/api/mood/week").with(as("ana")))
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].mood").value(6));
	}

	@Test
	void moodWithoutCouple_isRejected_andOutOfRangeMoodIs400() throws Exception {
		mvc.perform(put("/api/mood/today").with(as("solo")).with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"mood\":4}"))
			.andExpect(status().isConflict());
		mvc.perform(put("/api/mood/today").with(as("solo")).with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"mood\":9}"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void writesWithoutCsrfAreRejected() throws Exception {
		mvc.perform(post("/api/couple").with(as("sincsrf"))).andExpect(status().isForbidden());
	}

	@Test
	void guessingInviteCodesIsRateLimited() throws Exception {
		for (int i = 0; i < 8; i++) {
			mvc.perform(post("/api/couple/join").with(as("adivino")).with(csrf())
				.contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"AAAAA" + i + "\"}"))
				.andExpect(status().isBadRequest());
		}
		mvc.perform(post("/api/couple/join").with(as("adivino")).with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"ZZZZZZ\"}"))
			.andExpect(status().isTooManyRequests());
	}

	@Test
	void devLoginEndpointDoesNotExistByDefault() throws Exception {
		mvc.perform(post("/api/dev/login").with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"a@b.com\"}"))
			.andExpect(status().isNotFound());
	}
}
