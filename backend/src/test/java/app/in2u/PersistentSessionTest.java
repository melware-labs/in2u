package app.in2u;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/** La sesión se guarda en Postgres y la cookie dura 90 días, renovándose al abrir la app. */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class PersistentSessionTest {

	static final String NINETY_DAYS = "Max-Age=" + 90 * 24 * 3600;

	@Container
	static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

	@DynamicPropertySource
	static void db(DynamicPropertyRegistry r) {
		r.add("spring.datasource.url", postgres::getJdbcUrl);
		r.add("spring.datasource.username", postgres::getUsername);
		r.add("spring.datasource.password", postgres::getPassword);
		r.add("in2u.dev-login", () -> "true");
	}

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcTemplate jdbc;

	@Test
	void sessionSurvivesInDatabaseAndCookieIsRenewed() throws Exception {
		var login = mvc.perform(post("/api/dev/login").with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"lu@example.com\",\"name\":\"Lu\"}"))
			.andExpect(status().isNoContent())
			.andReturn().getResponse();
		String setCookie = login.getHeaders("Set-Cookie").stream()
			.filter(h -> h.startsWith("JSESSIONID=")).findFirst().orElseThrow();
		assertThat(setCookie).contains(NINETY_DAYS).contains("HttpOnly").contains("SameSite=Lax");

		// Solo con la cookie (como el navegador al volver a abrir la app) sigue la sesión.
		var cookie = new Cookie("JSESSIONID", setCookie.substring("JSESSIONID=".length(), setCookie.indexOf(';')));
		var me = mvc.perform(get("/api/me").cookie(cookie))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value("lu@example.com"))
			.andReturn().getResponse();
		assertThat(me.getHeaders("Set-Cookie")).anyMatch(h -> h.startsWith("JSESSIONID=") && h.contains(NINETY_DAYS));

		Integer maxInactive = jdbc.queryForObject(
			"SELECT MAX(MAX_INACTIVE_INTERVAL) FROM SPRING_SESSION WHERE PRINCIPAL_NAME IS NOT NULL", Integer.class);
		assertThat(maxInactive).isEqualTo(90 * 24 * 3600);
	}
}
