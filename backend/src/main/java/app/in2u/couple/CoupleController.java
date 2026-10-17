package app.in2u.couple;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.in2u.user.AppUser;
import app.in2u.user.AppUserRepository;
import app.in2u.user.CurrentUser;

@RestController
@RequestMapping("/api")
class CoupleController {

	record Person(String name, String avatarUrl) {
	}

	/** state: "none" (sin código), "waiting" (esperando a la pareja) o "paired". */
	record MeResponse(String name, String email, String avatarUrl, String timezone, String state, String inviteCode,
			Person partner) {
	}

	record JoinRequest(@NotBlank String code) {
	}

	record TimezoneRequest(@NotBlank String timezone) {
	}

	private final CoupleService couples;

	private final CurrentUser currentUser;

	private final AppUserRepository users;

	CoupleController(CoupleService couples, CurrentUser currentUser, AppUserRepository users) {
		this.couples = couples;
		this.currentUser = currentUser;
		this.users = users;
	}

	@GetMapping("/me")
	MeResponse me(@AuthenticationPrincipal OAuth2User principal) {
		return build(currentUser.of(principal));
	}

	@PostMapping("/couple")
	MeResponse create(@AuthenticationPrincipal OAuth2User principal) {
		var user = currentUser.of(principal);
		couples.create(user);
		return build(user);
	}

	@PostMapping("/couple/join")
	MeResponse join(@AuthenticationPrincipal OAuth2User principal, @Valid @RequestBody JoinRequest body) {
		var user = currentUser.of(principal);
		couples.join(user, body.code());
		return build(user);
	}

	/** El navegador manda su zona horaria para que "hoy" sea el día de cada quien. */
	@org.springframework.web.bind.annotation.PutMapping("/me/timezone")
	MeResponse timezone(@AuthenticationPrincipal OAuth2User principal, @Valid @RequestBody TimezoneRequest body) {
		var user = currentUser.of(principal);
		try {
			java.time.ZoneId.of(body.timezone());
		}
		catch (java.time.DateTimeException e) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST, "Zona horaria inválida.");
		}
		user.setTimezone(body.timezone());
		users.save(user);
		return build(user);
	}

	private MeResponse build(AppUser user) {
		var couple = couples.findFor(user);
		String state = couple.isEmpty() ? "none" : couple.get().isPaired() ? "paired" : "waiting";
		Person partner = couple.flatMap(c -> c.partnerOf(user.getId())).flatMap(users::findById)
			.map(p -> new Person(p.getDisplayName(), p.getAvatarUrl()))
			.orElse(null);
		return new MeResponse(user.getDisplayName(), user.getEmail(), user.getAvatarUrl(), user.getTimezone(), state,
				couple.map(Couple::getInviteCode).orElse(null), partner);
	}
}
