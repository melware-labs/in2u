package app.in2u.calendar.google;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import tools.jackson.databind.JsonNode;

import app.in2u.config.In2uProperties;

/** Las llamadas HTTP a Google (OAuth y Calendar API v3), sin estado. */
@Component
class GoogleCalendarClient {

	static final String SCOPE = "https://www.googleapis.com/auth/calendar.events";

	private static final String AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

	private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";

	private static final String REVOKE_URL = "https://oauth2.googleapis.com/revoke";

	private static final String CALENDAR = "https://www.googleapis.com/calendar/v3/calendars/primary";

	/** Lo que devuelve Google al canjear el código o refrescar el token. */
	record Tokens(String accessToken, Instant expiresAt, String refreshToken, String scope) {

		boolean grantsCalendar() {
			return scope != null && List.of(scope.split(" ")).contains(SCOPE);
		}
	}

	/** El permiso ya no vale: la persona lo quitó desde su cuenta de Google o venció. */
	static class RevokedException extends RuntimeException {

		RevokedException() {
			super("Google revocó el permiso del calendario.");
		}
	}

	private final In2uProperties.GoogleCalendar config;

	private final RestClient http;

	GoogleCalendarClient(In2uProperties props) {
		this.config = props.googleCalendar();
		var factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(Duration.ofSeconds(5));
		factory.setReadTimeout(Duration.ofSeconds(15));
		this.http = RestClient.builder().requestFactory(factory).build();
	}

	/**
	 * offline + consent: así Google siempre entrega un refresh token y el calendario
	 * se puede seguir actualizando sin que la persona vuelva a dar permiso.
	 */
	String authorizationUrl(String state, String loginHint) {
		var url = UriComponentsBuilder.fromUriString(AUTH_URL)
			.queryParam("client_id", config.clientId())
			.queryParam("redirect_uri", config.redirectUri())
			.queryParam("response_type", "code")
			.queryParam("scope", SCOPE)
			.queryParam("access_type", "offline")
			.queryParam("prompt", "consent")
			.queryParam("state", state);
		if (loginHint != null && !loginHint.isBlank()) {
			url.queryParam("login_hint", loginHint);
		}
		return url.encode().toUriString();
	}

	Tokens exchangeCode(String code) {
		var form = new LinkedMultiValueMap<String, String>();
		form.add("code", code);
		form.add("client_id", config.clientId());
		form.add("client_secret", config.clientSecret());
		form.add("redirect_uri", config.redirectUri());
		form.add("grant_type", "authorization_code");
		return tokens(form);
	}

	Tokens refresh(String refreshToken) {
		var form = new LinkedMultiValueMap<String, String>();
		form.add("refresh_token", refreshToken);
		form.add("client_id", config.clientId());
		form.add("client_secret", config.clientSecret());
		form.add("grant_type", "refresh_token");
		try {
			return tokens(form);
		}
		catch (HttpClientErrorException e) {
			if (e.getStatusCode() == HttpStatus.BAD_REQUEST && e.getResponseBodyAsString().contains("invalid_grant")) {
				throw new RevokedException();
			}
			throw e;
		}
	}

	void revoke(String token) {
		var form = new LinkedMultiValueMap<String, String>();
		form.add("token", token);
		http.post().uri(REVOKE_URL).contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().toBodilessEntity();
	}

	/** El id del calendario principal es el correo de la cuenta de Google. */
	String primaryCalendarEmail(String accessToken) {
		JsonNode cal = http.get().uri(CALENDAR).headers(h -> h.setBearerAuth(accessToken)).retrieve().body(JsonNode.class);
		return cal == null ? null : cal.path("id").asString(null);
	}

	String insertEvent(String accessToken, Map<String, Object> event) {
		JsonNode created = http.post()
			.uri(CALENDAR + "/events")
			.headers(h -> h.setBearerAuth(accessToken))
			.contentType(MediaType.APPLICATION_JSON)
			.body(event)
			.retrieve()
			.body(JsonNode.class);
		return created.path("id").asString();
	}

	/** Si en Google ya no existe (la persona la borró allí), no es un error. */
	void deleteEvent(String accessToken, String googleEventId) {
		try {
			http.delete()
				.uri(CALENDAR + "/events/{id}", googleEventId)
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.toBodilessEntity();
		}
		catch (HttpClientErrorException.NotFound | HttpClientErrorException.Gone alreadyGone) {
			// nada que borrar
		}
	}

	/** Eventos del calendario principal, con las repeticiones ya expandidas. */
	List<JsonNode> listEvents(String accessToken, Instant from, Instant to) {
		JsonNode page = http.get()
			.uri(UriComponentsBuilder.fromUriString(CALENDAR + "/events")
				.queryParam("timeMin", from.toString())
				.queryParam("timeMax", to.toString())
				.queryParam("singleEvents", true)
				.queryParam("orderBy", "startTime")
				.queryParam("maxResults", 250)
				.encode()
				.build()
				.toUri())
			.headers(h -> h.setBearerAuth(accessToken))
			.retrieve()
			.body(JsonNode.class);
		var items = new ArrayList<JsonNode>();
		if (page != null) {
			page.path("items").forEach(items::add);
		}
		return items;
	}

	private Tokens tokens(LinkedMultiValueMap<String, String> form) {
		JsonNode res = http.post()
			.uri(TOKEN_URL)
			.contentType(MediaType.APPLICATION_FORM_URLENCODED)
			.body(form)
			.retrieve()
			.body(JsonNode.class);
		return new Tokens(res.path("access_token").asString(),
				Instant.now().plusSeconds(res.path("expires_in").asLong(3600)),
				res.path("refresh_token").asString(null), res.path("scope").asString(null));
	}
}
