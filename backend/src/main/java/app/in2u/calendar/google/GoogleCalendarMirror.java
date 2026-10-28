package app.in2u.calendar.google;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import app.in2u.calendar.CoupleEvent;
import app.in2u.calendar.CoupleEventRepository;
import app.in2u.calendar.EventChanges;
import app.in2u.config.In2uProperties;
import app.in2u.couple.CoupleRepository;
import app.in2u.user.AppUserRepository;

/**
 * Copia los eventos de in2u al Google Calendar de cada persona que los ve: quien
 * lo creó y, si es "Los dos", también su pareja. Nunca un "Solo yo" ajeno.
 * Todo corre en segundo plano y después de guardar: si Google falla, el evento
 * en in2u queda igual.
 */
@Component
class GoogleCalendarMirror {

	private static final Logger log = LoggerFactory.getLogger(GoogleCalendarMirror.class);

	/** Marca privada en la copia de Google: así no se muestra dos veces al importar. */
	static final String IN2U_ID = "in2uEventId";

	/** Al vincular se copian los planes desde ayer hasta dentro de un año. */
	private static final Duration BACKFILL_AHEAD = Duration.ofDays(365);

	private final GoogleCalendarService calendar;

	private final GoogleCalendarClient client;

	private final GoogleEventCopyRepository copies;

	private final CoupleEventRepository events;

	private final CoupleRepository couples;

	private final AppUserRepository users;

	private final String frontendUrl;

	GoogleCalendarMirror(GoogleCalendarService calendar, GoogleCalendarClient client, GoogleEventCopyRepository copies,
			CoupleEventRepository events, CoupleRepository couples, AppUserRepository users, In2uProperties props) {
		this.calendar = calendar;
		this.client = client;
		this.copies = copies;
		this.events = events;
		this.couples = couples;
		this.users = users;
		this.frontendUrl = props.frontendUrl();
	}

	@Async
	@TransactionalEventListener
	void onCreated(EventChanges.Created created) {
		if (!calendar.available()) {
			return;
		}
		events.findById(created.eventId()).ifPresent(e -> viewersOf(e).forEach(userId -> copy(e, userId)));
	}

	@Async
	@TransactionalEventListener
	void onDeleted(EventChanges.Deleted deleted) {
		for (var copy : copies.findByEventId(deleted.eventId())) {
			try {
				calendar.accessToken(copy.getUserId()).ifPresent(token -> client.deleteEvent(token, copy.getGoogleEventId()));
			}
			catch (Exception e) {
				log.warn("No se pudo borrar la copia en Google Calendar ({}).", e.getMessage());
			}
			copies.delete(copy);
		}
	}

	@Async
	@TransactionalEventListener
	void onConnected(GoogleCalendarService.Connected connected) {
		var user = users.findById(connected.userId()).orElse(null);
		var couple = user == null ? null : couples.findByMember(user.getId()).orElse(null);
		if (couple == null) {
			return;
		}
		Instant from = Instant.now().minus(Duration.ofDays(1));
		for (var e : events.visibleInRange(couple.getId(), user.getId(), from, from.plus(BACKFILL_AHEAD))) {
			copy(e, user.getId());
		}
	}

	private List<UUID> viewersOf(CoupleEvent e) {
		var viewers = new ArrayList<UUID>(List.of(e.getOwnerId()));
		if ("los_dos".equals(e.getVisibility())) {
			couples.findById(e.coupleId()).flatMap(c -> c.partnerOf(e.getOwnerId())).ifPresent(viewers::add);
		}
		return viewers;
	}

	private void copy(CoupleEvent e, UUID userId) {
		if (!calendar.isConnected(userId) || copies.existsByEventIdAndUserId(e.getId(), userId)) {
			return;
		}
		try {
			calendar.accessToken(userId).ifPresent(token -> {
				String zone = users.findById(userId).map(u -> u.getTimezone()).orElse("UTC");
				String googleId = client.insertEvent(token, googleBody(e, zone, frontendUrl));
				copies.save(new GoogleEventCopy(e.getId(), userId, googleId));
			});
		}
		catch (Exception ex) {
			log.warn("No se pudo copiar el evento a Google Calendar ({}).", ex.getMessage());
		}
	}

	static Map<String, Object> googleBody(CoupleEvent e, String zone, String frontendUrl) {
		var body = new LinkedHashMap<String, Object>();
		body.put("summary", e.getTitle());
		body.put("description", ("los_dos".equals(e.getVisibility()) ? "Plan de los dos en in2u." : "Evento de in2u.")
				+ (frontendUrl == null ? "" : "\n" + frontendUrl));
		body.put("start", Map.of("dateTime", e.getStartsAt().toString(), "timeZone", zone));
		body.put("end", Map.of("dateTime", e.getEndsAt().toString(), "timeZone", zone));
		body.put("extendedProperties", Map.of("private", Map.of(IN2U_ID, String.valueOf(e.getId()))));
		return body;
	}
}
