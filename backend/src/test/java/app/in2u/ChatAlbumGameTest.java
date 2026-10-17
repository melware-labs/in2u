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
class ChatAlbumGameTest {

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
	void chatIsPrivateToTheCouple() throws Exception {
		pair("ana", "beto");
		pair("caro", "dani");
		json(as("ana"), "POST", "/api/chat", "{\"body\":\"  Hola amor  \"}");
		json(as("beto"), "POST", "/api/chat", "{\"body\":\"Hola!\"}");

		mvc.perform(get("/api/chat").with(as("beto")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(2))
			.andExpect(jsonPath("$[0].body").value("Hola amor"))
			.andExpect(jsonPath("$[0].mine").value(false))
			.andExpect(jsonPath("$[1].mine").value(true));
		// Otra pareja no ve nada.
		mvc.perform(get("/api/chat").with(as("caro"))).andExpect(jsonPath("$.length()").value(0));

		mvc.perform(post("/api/chat").with(as("ana")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"body\":\"   \"}")).andExpect(status().isBadRequest());
		mvc.perform(get("/api/chat").with(as("sin-pareja"))).andExpect(status().isConflict());
	}

	@Test
	void albumPhotosBelongToTheCouple() throws Exception {
		pair("eva", "fede");
		pair("gabi", "hugo");
		byte[] jpeg = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x01, 0x02 };
		String id = JsonPath.read(mvc.perform(post("/api/album").param("title", "Playa").param("description", "Nuestro primer viaje").with(as("eva")).with(csrf())
			.contentType(MediaType.IMAGE_JPEG).content(jpeg))
			.andExpect(status().isOk())
			.andReturn().getResponse().getContentAsString(), "$.id");

		mvc.perform(get("/api/album").with(as("fede")))
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].title").value("Playa"))
			.andExpect(jsonPath("$[0].description").value("Nuestro primer viaje"))
			.andExpect(jsonPath("$[0].mine").value(false));
		byte[] back = mvc.perform(get("/api/album/" + id + "/image").with(as("fede")))
			.andExpect(status().isOk())
			.andReturn().getResponse().getContentAsByteArray();
		assertThat(back).isEqualTo(jpeg);

		mvc.perform(put("/api/album/" + id).with(as("fede")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"title\":\"Mar\",\"description\":\"\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.title").value("Mar"))
			.andExpect(jsonPath("$.description").doesNotExist());

		// Otra pareja: ni la lista ni la imagen ni borrarla.
		mvc.perform(get("/api/album").with(as("gabi"))).andExpect(jsonPath("$.length()").value(0));
		mvc.perform(get("/api/album/" + id + "/image").with(as("gabi"))).andExpect(status().isNotFound());
		mvc.perform(delete("/api/album/" + id).with(as("gabi")).with(csrf())).andExpect(status().isNotFound());

		mvc.perform(post("/api/album").with(as("eva")).with(csrf()).contentType(MediaType.TEXT_PLAIN).content("x"))
			.andExpect(status().isUnsupportedMediaType());

		mvc.perform(delete("/api/album/" + id).with(as("fede")).with(csrf())).andExpect(status().isNoContent());
		mvc.perform(get("/api/album").with(as("eva"))).andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void gameRevealsAnswersOnlyAfterAnsweringAndScores() throws Exception {
		pair("ines", "juan");
		json(as("ines"), "POST", "/api/game/answers", "{\"questionKey\":\"comida\",\"self\":2,\"guess\":1}");

		// Juan ve que Ines respondió, pero no qué.
		mvc.perform(get("/api/game").with(as("juan")))
			.andExpect(jsonPath("$.questions[0].partnerAnswered").value(true))
			.andExpect(jsonPath("$.questions[0].partnerSelf").doesNotExist())
			.andExpect(jsonPath("$.rounds").value(0));

		// Juan responde: adivina bien (2) y su respuesta (3) no coincide con lo que adivinó Ines (1).
		mvc.perform(post("/api/game/answers").with(as("juan")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"questionKey\":\"comida\",\"self\":3,\"guess\":2}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.questions[0].partnerSelf").value(2))
			.andExpect(jsonPath("$.myScore").value(1))
			.andExpect(jsonPath("$.partnerScore").value(0))
			.andExpect(jsonPath("$.rounds").value(1));

		// No se puede cambiar la respuesta después.
		mvc.perform(post("/api/game/answers").with(as("juan")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"questionKey\":\"comida\",\"self\":2,\"guess\":2}"))
			.andExpect(status().isConflict());
		mvc.perform(post("/api/game/answers").with(as("juan")).with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"questionKey\":\"otra\",\"self\":4,\"guess\":0}"))
			.andExpect(status().isBadRequest());
	}
}
