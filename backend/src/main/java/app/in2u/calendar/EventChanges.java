package app.in2u.calendar;

import java.util.UUID;

/** Avisos que publica {@link EventService} para quien quiera reaccionar (p. ej. Google Calendar). */
public final class EventChanges {

	public record Created(UUID eventId) {
	}

	public record Deleted(UUID eventId) {
	}

	private EventChanges() {
	}
}
