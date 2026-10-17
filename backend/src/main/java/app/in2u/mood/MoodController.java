package app.in2u.mood;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import app.in2u.couple.CoupleService;
import app.in2u.user.CurrentUser;

@RestController
@RequestMapping("/api/mood")
class MoodController {

	record CheckinRequest(@Min(1) @Max(6) int mood, @Size(max = 500) String note) {
	}

	record CheckinResponse(UUID id, UUID userId, int mood, String note, String date, boolean mine) {
	}

	private final MoodService moods;

	private final CoupleService couples;

	private final CurrentUser currentUser;

	MoodController(MoodService moods, CoupleService couples, CurrentUser currentUser) {
		this.moods = moods;
		this.couples = couples;
		this.currentUser = currentUser;
	}

	@PutMapping("/today")
	CheckinResponse saveToday(@AuthenticationPrincipal OAuth2User principal, @Valid @RequestBody CheckinRequest body) {
		var user = currentUser.of(principal);
		return toResponse(moods.saveToday(user, body.mood(), body.note()), user.getId());
	}

	/** Check-ins de los dos de los últimos 7 días (para la grilla semanal). */
	@GetMapping("/week")
	List<CheckinResponse> week(@AuthenticationPrincipal OAuth2User principal) {
		var user = currentUser.of(principal);
		return moods.lastWeek(user).stream().map(c -> toResponse(c, user.getId())).toList();
	}

	/** Tiempo real: avisa cuando cambia un check-in o llega un consejo nuevo. */
	@GetMapping("/stream")
	SseEmitter stream(@AuthenticationPrincipal OAuth2User principal) {
		var couple = couples.requirePaired(currentUser.of(principal));
		return moods.stream().subscribe(couple.getId());
	}

	private static CheckinResponse toResponse(MoodCheckin c, UUID me) {
		return new CheckinResponse(c.getId(), c.getUserId(), c.getMood(), c.getNote(), c.getCheckinDate().toString(),
				c.getUserId().equals(me));
	}
}
