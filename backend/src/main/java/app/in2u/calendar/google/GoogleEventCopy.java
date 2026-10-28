package app.in2u.calendar.google;

import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/** El id que Google le dio a la copia de un evento de in2u en el calendario de una persona. */
@Entity
@Table(name = "google_event_copies")
@IdClass(GoogleEventCopy.Key.class)
class GoogleEventCopy {

	record Key(UUID eventId, UUID userId) implements Serializable {
	}

	@Id
	private UUID eventId;

	@Id
	private UUID userId;

	@Column(nullable = false)
	private String googleEventId;

	protected GoogleEventCopy() {
	}

	GoogleEventCopy(UUID eventId, UUID userId, String googleEventId) {
		this.eventId = eventId;
		this.userId = userId;
		this.googleEventId = googleEventId;
	}

	UUID getEventId() {
		return eventId;
	}

	UUID getUserId() {
		return userId;
	}

	String getGoogleEventId() {
		return googleEventId;
	}
}
