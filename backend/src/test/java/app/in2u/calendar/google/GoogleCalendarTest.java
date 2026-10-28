package app.in2u.calendar.google;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.time.ZoneId;
import java.util.Base64;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.ObjectMapper;

import app.in2u.calendar.CoupleEvent;

class GoogleCalendarTest {

	private static final ObjectMapper JSON = new ObjectMapper();

	private static String key() {
		return Base64.getEncoder().encodeToString(new byte[32]);
	}

	@Test
	void tokenCipherRoundTrips_andNeverStoresPlainText() {
		var cipher = new TokenCipher(key());
		String sealed = cipher.encrypt("1//refresh-token");
		assertThat(sealed).doesNotContain("refresh-token");
		assertThat(cipher.decrypt(sealed)).isEqualTo("1//refresh-token");
		// IV aleatorio: dos cifrados del mismo texto no coinciden.
		assertThat(cipher.encrypt("1//refresh-token")).isNotEqualTo(sealed);
	}

	@Test
	void tokenCipherRejectsTamperingAndBadKeys() {
		var cipher = new TokenCipher(key());
		byte[] raw = Base64.getDecoder().decode(cipher.encrypt("secreto"));
		raw[raw.length - 1] ^= 1;
		String tampered = Base64.getEncoder().encodeToString(raw);
		assertThatThrownBy(() -> cipher.decrypt(tampered)).isInstanceOf(IllegalStateException.class);
		assertThatThrownBy(() -> new TokenCipher(Base64.getEncoder().encodeToString(new byte[16])))
			.isInstanceOf(IllegalStateException.class);
		assertThatThrownBy(() -> new TokenCipher((String) null).encrypt("x")).isInstanceOf(IllegalStateException.class);
	}

	@Test
	void googleEvents_timedAllDayAndOwnCopies() throws Exception {
		var zone = ZoneId.of("America/Argentina/Buenos_Aires");
		var timed = GoogleCalendarService.toGoogleEvent(JSON.readTree("""
				{"id":"a","summary":"Dentista","start":{"dateTime":"2026-11-02T10:00:00-03:00"},
				 "end":{"dateTime":"2026-11-02T11:00:00-03:00"},"htmlLink":"https://g/x"}"""), zone);
		assertThat(timed.startsAt()).isEqualTo(Instant.parse("2026-11-02T13:00:00Z"));
		assertThat(timed.allDay()).isFalse();

		var allDay = GoogleCalendarService.toGoogleEvent(JSON.readTree("""
				{"id":"b","start":{"date":"2026-11-03"},"end":{"date":"2026-11-04"}}"""), zone);
		assertThat(allDay.allDay()).isTrue();
		assertThat(allDay.title()).isNull();
		assertThat(allDay.startsAt()).isEqualTo(Instant.parse("2026-11-03T03:00:00Z"));

		// La copia que hizo in2u no se muestra dos veces; la cancelada tampoco.
		assertThat(GoogleCalendarService.toGoogleEvent(JSON.readTree("""
				{"id":"c","start":{"dateTime":"2026-11-02T10:00:00Z"},
				 "extendedProperties":{"private":{"in2uEventId":"x"}}}"""), zone)).isNull();
		assertThat(GoogleCalendarService.toGoogleEvent(JSON.readTree("""
				{"id":"d","status":"cancelled"}"""), zone)).isNull();
	}

	@Test
	void mirroredEventCarriesTheIn2uIdAndZone() {
		var id = java.util.UUID.randomUUID();
		var event = new CoupleEvent(id, id, "Cena", Instant.parse("2026-11-02T22:00:00Z"),
				Instant.parse("2026-11-03T00:00:00Z"), "los_dos", false);
		var body = GoogleCalendarMirror.googleBody(event, "Europe/Madrid", "https://in2u.vercel.app");
		assertThat(body.get("summary")).isEqualTo("Cena");
		assertThat(body.toString()).contains("Europe/Madrid").contains("in2uEventId");
	}
}
