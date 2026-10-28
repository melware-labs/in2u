package app.in2u.security;

import java.io.IOException;
import java.time.Duration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

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
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.CookieSerializer.CookieValue;
import org.springframework.session.web.http.DefaultCookieSerializer;

import app.in2u.config.In2uProperties;

/**
 * Sesión con cookie persistente en Postgres (Spring Session JDBC) + CSRF en modo SPA:
 * el frontend lee la cookie XSRF-TOKEN y la manda en el header X-XSRF-TOKEN.
 * La cookie de sesión dura 90 días para que la cuenta se mantenga abierta al cerrar la app,
 * y se renueva cada vez que se abre la app (ver {@link #renewSessionCookie}).
 */
@Configuration
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, In2uProperties props) throws Exception {
		http
			.authorizeHttpRequests(auth -> auth
				.requestMatchers("/actuator/health", "/actuator/health/**", "/api/dev/login", "/api/push/public-key").permitAll()
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

	/**
	 * Spring Session solo manda la cookie al crear la sesión, así que vencería a los 90 días
	 * del login aunque se use todos los días. Al abrir la app (GET /api/me) se vuelve a mandar
	 * con otros 90 días: solo pide entrar de nuevo quien pasa 90 días sin abrirla.
	 */
	@Bean
	OncePerRequestFilter renewSessionCookie(CookieSerializer cookieSerializer) {
		return new OncePerRequestFilter() {
			@Override
			protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
					FilterChain chain) throws ServletException, IOException {
				var session = request.getSession(false);
				if (session != null && "GET".equals(request.getMethod()) && "/api/me".equals(request.getRequestURI())) {
					cookieSerializer.writeCookieValue(new CookieValue(request, response, session.getId()));
				}
				chain.doFilter(request, response);
			}
		};
	}
}
