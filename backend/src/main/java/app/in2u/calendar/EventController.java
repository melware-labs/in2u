package app.in2u.calendar;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import app.in2u.user.CurrentUser;

@RestController
@RequestMapping("/api/events")
class EventController {

	record EventRequest(@NotNull String title, @NotNull Instant startsAt, @NotNull Instant endsAt,
			@NotNull String visibility, Boolean googleSyncEnabled) {
	}

	record EventResponse(UUID id, String title, Instant startsAt, Instant endsAt, String visibility, boolean mine,
			boolean googleSyncEnabled) {
	}

	private final EventService events;

	private final CurrentUser currentUser;

	EventController(EventService events, CurrentUser currentUser) {
		this.events = events;
		this.currentUser = currentUser;
	}

	@GetMapping
	List<EventResponse> list(@AuthenticationPrincipal OAuth2User principal, @RequestParam Instant from,
			@RequestParam Instant to) {
		var user = currentUser.of(principal);
		return events.inRange(user, from, to).stream().map(e -> toResponse(e, user.getId())).toList();
	}

	@PostMapping
	EventResponse create(@AuthenticationPrincipal OAuth2User principal, @Valid @RequestBody EventRequest body) {
		var user = currentUser.of(principal);
		return toResponse(events.create(user, body.title(), body.startsAt(), body.endsAt(), body.visibility(),
				Boolean.TRUE.equals(body.googleSyncEnabled())), user.getId());
	}

	@DeleteMapping("/{id}")
	ResponseEntity<Void> delete(@AuthenticationPrincipal OAuth2User principal, @PathVariable UUID id) {
		events.delete(currentUser.of(principal), id);
		return ResponseEntity.noContent().build();
	}

	private static EventResponse toResponse(CoupleEvent e, UUID me) {
		return new EventResponse(e.getId(), e.getTitle(), e.getStartsAt(), e.getEndsAt(), e.getVisibility(),
				e.getOwnerId().equals(me), e.isGoogleSyncEnabled());
	}
}
