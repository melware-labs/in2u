package app.in2u.calendar.google;

import java.net.URI;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

import jakarta.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import app.in2u.config.In2uProperties;
import app.in2u.user.CurrentUser;

/**
 * Vincular el Google Calendar: /connect manda a la pantalla de permiso de Google y
 * Google vuelve a /callback con un código. Después la web vuelve a abrir con
 * ?google=vinculado (o cancelado, sin-permiso, error) para mostrar el resultado.
 */
@RestController
@RequestMapping("/api/google-calendar")
class GoogleCalendarController {

	private static final Logger log = LoggerFactory.getLogger(GoogleCalendarController.class);

	private static final String STATE_ATTRIBUTE = "googleCalendarState";

	private static final Duration MAX_RANGE = Duration.ofDays(62);

	private final SecureRandom random = new SecureRandom();

	private final GoogleCalendarService calendar;

	private final CurrentUser currentUser;

	private final String frontendUrl;

	GoogleCalendarController(GoogleCalendarService calendar, CurrentUser currentUser, In2uProperties props) {
		this.calendar = calendar;
		this.currentUser = currentUser;
		this.frontendUrl = props.frontendUrl();
	}

	@GetMapping
	GoogleCalendarService.Status status(@AuthenticationPrincipal OAuth2User principal) {
		return calendar.status(currentUser.of(principal));
	}

	@GetMapping("/connect")
	ResponseEntity<Void> connect(@AuthenticationPrincipal OAuth2User principal, HttpSession session) {
		if (!calendar.available()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La vinculación con Google Calendar no está activada.");
		}
		byte[] bytes = new byte[24];
		random.nextBytes(bytes);
		String state = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		session.setAttribute(STATE_ATTRIBUTE, state);
		return redirect(calendar.authorizationUrl(currentUser.of(principal), state));
	}

	@GetMapping("/callback")
	ResponseEntity<Void> callback(@AuthenticationPrincipal OAuth2User principal, HttpSession session,
			@RequestParam(required = false) String code, @RequestParam(required = false) String state,
			@RequestParam(required = false) String error) {
		Object expected = session.getAttribute(STATE_ATTRIBUTE);
		session.removeAttribute(STATE_ATTRIBUTE);
		if (error != null) {
			// access_denied: tocó "Cancelar" en la pantalla de Google.
			return back("access_denied".equals(error) ? "cancelado" : "error");
		}
		if (code == null || state == null || !state.equals(expected) || !calendar.available()) {
			log.warn("Vuelta de Google Calendar sin código o con un state que no coincide.");
			return back("error");
		}
		return back(switch (calendar.connect(currentUser.of(principal), code)) {
			case VINCULADO -> "vinculado";
			case SIN_PERMISO -> "sin-permiso";
			case ERROR -> "error";
		});
	}

	@DeleteMapping
	ResponseEntity<Void> disconnect(@AuthenticationPrincipal OAuth2User principal) {
		calendar.disconnect(currentUser.of(principal));
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/events")
	List<GoogleCalendarService.GoogleEvent> events(@AuthenticationPrincipal OAuth2User principal,
			@RequestParam Instant from, @RequestParam Instant to) {
		if (!to.isAfter(from) || Duration.between(from, to).compareTo(MAX_RANGE) > 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rango de fechas inválido.");
		}
		try {
			return calendar.importedEvents(currentUser.of(principal), from, to);
		}
		catch (Exception e) {
			log.warn("No se pudo leer Google Calendar ({}).", e.getMessage());
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo leer tu Google Calendar.");
		}
	}

	private ResponseEntity<Void> back(String result) {
		return redirect(frontendUrl + "/?google=" + result);
	}

	private static ResponseEntity<Void> redirect(String url) {
		return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
	}
}
