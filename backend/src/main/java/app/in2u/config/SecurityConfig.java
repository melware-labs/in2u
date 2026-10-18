package app.in2u.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

/**
 * Sesión con cookie persistente en Postgres (Spring Session JDBC) + CSRF en modo SPA:
 * el frontend lee la cookie XSRF-TOKEN y la manda en el header X-XSRF-TOKEN.
 * La cookie de sesión dura 90 días para que la cuenta se mantenga abierta al cerrar la app.
 */
@Configuration
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, In2uProperties props) throws Exception {
		http
			.authorizeHttpRequests(auth -> auth
				.requestMatchers("/actuator/health", "/api/dev/login", "/api/push/public-key").permitAll()
				.requestMatchers("/api/**").authenticated()
				.anyRequest().permitAll())
			.oauth2Login(login -> login.defaultSuccessUrl(props.frontendUrl(), true))
			.exceptionHandling(ex -> ex.defaultAuthenticationEntryPointFor(
				new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
				PathPatternRequestMatcher.withDefaults().matcher("/api/**")))
			.logout(logout -> logout
				.logoutUrl("/api/logout")
				.logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler()))
			.csrf(csrf -> csrf.spa());
		return http.build();
	}

	@Bean
	SecurityContextRepository securityContextRepository() {
		return new HttpSessionSecurityContextRepository();
	}

	@Bean
	CookieSerializer cookieSerializer(@Value("${server.servlet.session.cookie.secure:false}") boolean secure) {
		var serializer = new DefaultCookieSerializer();
		serializer.setCookieName("JSESSIONID");
		serializer.setCookieMaxAge((int) Duration.ofDays(90).toSeconds());
		serializer.setSameSite("Lax");
		serializer.setUseSecureCookie(secure);
		serializer.setUseHttpOnlyCookie(true);
		return serializer;
	}
}
