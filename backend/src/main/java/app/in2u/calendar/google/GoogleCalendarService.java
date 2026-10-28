package app.in2u.calendar.google;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.JsonNode;

import app.in2u.config.In2uProperties;
import app.in2u.user.AppUser;

/**
 * Vinculación opcional con el Google Calendar de cada persona: guarda los tokens
 * cifrados, los refresca cuando vencen y lee sus eventos de Google. La copia de los
 * eventos de in2u hacia Google la hace {@link GoogleCalendarMirror}.
 */
@Service
public class GoogleCalendarService {

	private static final Logger log = LoggerFactory.getLogger(GoogleCalendarService.class);

	/** Se refresca un poco antes de que venza, para no usar un token que muere en el camino. */
	private static final long EXPIRY_MARGIN_SECONDS = 60;

	record Status(boolean available, boolean connected, String email) {
	}

	/** Un evento del Google Calendar de la persona, solo para mostrarlo (no se guarda). */
	record GoogleEvent(String id, String title, Instant startsAt, Instant endsAt, boolean allDay, String link) {
	}

	/** Se acaba de vincular: hay que copiar a Google los eventos que ya existían. */
	record Connected(UUID userId) {
	}

	enum ConnectResult {
		VINCULADO, SIN_PERMISO, ERROR
	}

	private final In2uProperties.GoogleCalendar config;

	private final GoogleCalendarClient client;

	private final TokenCipher cipher;

	private final GoogleCalendarLinkRepository links;

	private final GoogleEventCopyRepository copies;

	private final ApplicationEventPublisher publisher;

	GoogleCalendarService(In2uProperties props, GoogleCalendarClient client, TokenCipher cipher,
			GoogleCalendarLinkRepository links, GoogleEventCopyRepository copies, ApplicationEventPublisher publisher) {
		this.config = props.googleCalendar();
		this.client = client;
		this.cipher = cipher;
		this.links = links;
		this.copies = copies;
		this.publisher = publisher;
	}

	public boolean available() {
		return config != null && config.configured();
	}

	@Transactional(readOnly = true)
	public Status status(AppUser user) {
		if (!available()) {
			return new Status(false, false, null);
		}
		return links.findById(user.getId())
			.map(l -> new Status(true, true, l.getGoogleEmail()))
			.orElse(new Status(true, false, null));
	}

	String authorizationUrl(AppUser user, String state) {
		return client.authorizationUrl(state, user.getEmail());
	}

	@Transactional
	public ConnectResult connect(AppUser user, String code) {
		GoogleCalendarClient.Tokens tokens;
		try {
			tokens = client.exchangeCode(code);
		}
		catch (Exception e) {
			log.warn("Google no aceptó el código del calendario ({}).", e.getMessage());
			return ConnectResult.ERROR;
		}
		// En la pantalla de Google se puede destildar el permiso del calendario.
		if (!tokens.grantsCalendar() || tokens.refreshToken() == null) {
			revokeQuietly(tokens.refreshToken() != null ? tokens.refreshToken() : tokens.accessToken());
			return ConnectResult.SIN_PERMISO;
		}
		var link = links.findById(user.getId()).orElseGet(() -> new GoogleCalendarLink(user.getId(), ""));
		link.setRefreshTokenEnc(cipher.encrypt(tokens.refreshToken()));
		link.setAccessToken(cipher.encrypt(tokens.accessToken()), tokens.expiresAt());
		try {
			link.setGoogleEmail(client.primaryCalendarEmail(tokens.accessToken()));
		}
		catch (Exception e) {
			log.warn("No se pudo leer el correo del calendario ({}).", e.getMessage());
		}
		links.save(link);
		publisher.publishEvent(new Connected(user.getId()));
		return ConnectResult.VINCULADO;
	}

	/** Quita el permiso en Google y olvida los tokens. Las copias ya hechas quedan en su calendario. */
	@Transactional
	public void disconnect(AppUser user) {
		links.findById(user.getId()).ifPresent(link -> {
			revokeQuietly(cipher.decrypt(link.getRefreshTokenEnc()));
			forget(user.getId());
		});
	}

	public boolean isConnected(UUID userId) {
		return available() && links.existsById(userId);
	}

	/**
	 * Un access token vigente, refrescándolo si hace falta. Vacío si la persona no vinculó
	 * su calendario o quitó el permiso desde Google (en ese caso se desvincula sola).
	 */
	@Transactional
	public Optional<String> accessToken(UUID userId) {
		if (!available()) {
			return Optional.empty();
		}
		var link = links.findById(userId).orElse(null);
		if (link == null) {
			return Optional.empty();
		}
		if (link.getAccessTokenEnc() != null && link.getAccessTokenExpiresAt() != null
				&& link.getAccessTokenExpiresAt().isAfter(Instant.now().plusSeconds(EXPIRY_MARGIN_SECONDS))) {
			return Optional.of(cipher.decrypt(link.getAccessTokenEnc()));
		}
		try {
			var tokens = client.refresh(cipher.decrypt(link.getRefreshTokenEnc()));
			link.setAccessToken(cipher.encrypt(tokens.accessToken()), tokens.expiresAt());
			if (tokens.refreshToken() != null) {
				link.setRefreshTokenEnc(cipher.encrypt(tokens.refreshToken()));
			}
			links.save(link);
			return Optional.of(tokens.accessToken());
		}
		catch (GoogleCalendarClient.RevokedException revoked) {
			log.info("El permiso de Google Calendar de {} ya no vale; se desvincula.", userId);
			forget(userId);
			return Optional.empty();
		}
	}

	/** Eventos propios de Google (no los que copió in2u), solo para quien los tiene. */
	@Transactional
	public List<GoogleEvent> importedEvents(AppUser user, Instant from, Instant to) {
		return accessToken(user.getId())
			.map(token -> client.listEvents(token, from, to).stream()
				.map(item -> toGoogleEvent(item, user.zone()))
				.filter(Objects::nonNull)
				.toList())
			.orElse(List.of());
	}

	static GoogleEvent toGoogleEvent(JsonNode item, ZoneId zone) {
		if ("cancelled".equals(item.path("status").asString(""))
				|| item.path("extendedProperties").path("private").has(GoogleCalendarMirror.IN2U_ID)) {
			return null;
		}
		JsonNode start = item.path("start");
		JsonNode end = item.path("end");
		boolean allDay = !start.has("dateTime");
		Instant startsAt = instant(start, zone);
		Instant endsAt = end.isMissingNode() ? startsAt : instant(end, zone);
		if (startsAt == null) {
			return null;
		}
		String title = item.path("summary").asString("").trim();
		return new GoogleEvent(item.path("id").asString(), title.isEmpty() ? null : title, startsAt,
				endsAt == null ? startsAt : endsAt, allDay, item.path("htmlLink").asString(null));
	}

	/** dateTime trae su propia zona; date (todo el día) se toma desde el inicio del día de la persona. */
	private static Instant instant(JsonNode when, ZoneId zone) {
		if (when.has("dateTime")) {
			return OffsetDateTime.parse(when.path("dateTime").asString()).toInstant();
		}
		if (when.has("date")) {
			return LocalDate.parse(when.path("date").asString()).atStartOfDay(zone).toInstant();
		}
		return null;
	}

	private void forget(UUID userId) {
		copies.deleteByUserId(userId);
		links.deleteById(userId);
	}

	private void revokeQuietly(String token) {
		if (token == null) {
			return;
		}
		try {
			client.revoke(token);
		}
		catch (Exception e) {
			log.warn("No se pudo revocar el token de Google ({}).", e.getMessage());
		}
	}
}
