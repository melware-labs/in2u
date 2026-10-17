package app.in2u.cycle;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.in2u.user.CurrentUser;

@RestController
@RequestMapping("/api/cycle")
class CycleController {

	record SettingsRequest(int cycleLengthDays, int periodLengthDays, @NotNull String partnerVisibility) {
	}

	record PeriodRequest(@NotNull LocalDate date) {
	}

	record SymptomsRequest(@NotNull List<String> symptoms) {
	}

	private final CycleService cycle;

	private final CurrentUser currentUser;

	CycleController(CycleService cycle, CurrentUser currentUser) {
		this.cycle = cycle;
		this.currentUser = currentUser;
	}

	/**
	 * El ciclo propio es para quien eligió "mujer" u "otro" en su perfil; con
	 * "hombre" solo se ve lo que la pareja comparte (GET /partner).
	 */
	private app.in2u.user.AppUser tracker(OAuth2User principal) {
		var user = currentUser.of(principal);
		if ("hombre".equals(user.getGender())) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.FORBIDDEN, "Aquí ves solo lo que tu pareja elige compartir.");
		}
		return user;
	}

	@GetMapping
	CycleService.OwnCycle own(@AuthenticationPrincipal OAuth2User principal) {
		return cycle.own(tracker(principal));
	}

	@PutMapping("/settings")
	CycleService.OwnCycle settings(@AuthenticationPrincipal OAuth2User principal,
			@Valid @RequestBody SettingsRequest body) {
		var user = tracker(principal);
		cycle.updateSettings(user, body.cycleLengthDays(), body.periodLengthDays(), body.partnerVisibility());
		return cycle.own(user);
	}

	@PostMapping("/periods")
	CycleService.OwnCycle addPeriod(@AuthenticationPrincipal OAuth2User principal,
			@Valid @RequestBody PeriodRequest body) {
		var user = tracker(principal);
		cycle.addPeriodStart(user, body.date());
		return cycle.own(user);
	}

	@DeleteMapping("/periods/{date}")
	CycleService.OwnCycle removePeriod(@AuthenticationPrincipal OAuth2User principal, @PathVariable LocalDate date) {
		var user = tracker(principal);
		cycle.removePeriodStart(user, date);
		return cycle.own(user);
	}

	@PutMapping("/symptoms")
	CycleService.OwnCycle symptoms(@AuthenticationPrincipal OAuth2User principal,
			@Valid @RequestBody SymptomsRequest body) {
		var user = tracker(principal);
		cycle.setTodaySymptoms(user, body.symptoms());
		return cycle.own(user);
	}

	/** Resumen recortado del ciclo de tu pareja, según lo que ella eligió compartir. */
	@GetMapping("/partner")
	CycleService.PartnerSummary partner(@AuthenticationPrincipal OAuth2User principal) {
		return cycle.partnerSummary(currentUser.of(principal));
	}
}
