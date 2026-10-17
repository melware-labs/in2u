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

	/**
	 * state: "none" (sin código), "waiting" (esperando a la pareja) o "paired".
	 * profileComplete: false mientras falte el formulario de bienvenida.
	 */
	record MeResponse(String name, String email, String avatarUrl, String timezone, String state, String inviteCode,
			Person partner, String gender, java.time.LocalDate birthDate, Integer age,
			java.time.LocalDate togetherSince, boolean profileComplete) {
	}

	record ProfileRequest(@NotBlank @jakarta.validation.constraints.Size(max = 60) String name,
			@NotBlank @jakarta.validation.constraints.Pattern(regexp = "mujer|hombre|otro") String gender,
			@jakarta.validation.constraints.NotNull @jakarta.validation.constraints.Past java.time.LocalDate birthDate,
			@jakarta.validation.constraints.NotNull java.time.LocalDate togetherSince) {
	}

	record JoinRequest(@NotBlank String code) {
	}

	record TimezoneRequest(@NotBlank String timezone) {
	}

	private final CoupleService couples;

	private final CurrentUser currentUser;

	private final AppUserRepository users;

	private final java.time.Clock clock;

	CoupleController(CoupleService couples, CurrentUser currentUser, AppUserRepository users, java.time.Clock clock) {
		this.couples = couples;
		this.currentUser = currentUser;
		this.users = users;
		this.clock = clock;
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

	@org.springframework.web.bind.annotation.PutMapping("/me/profile")
	MeResponse profile(@AuthenticationPrincipal OAuth2User principal, @Valid @RequestBody ProfileRequest body) {
		var user = currentUser.of(principal);
		if (body.birthDate().isBefore(java.time.LocalDate.of(1900, 1, 1))
				|| body.togetherSince().isBefore(body.birthDate())
				|| body.togetherSince().isAfter(user.today(clock))) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST, "Revisá las fechas.");
		}
		couples.updateProfile(user, body.name(), body.gender(), body.birthDate(), body.togetherSince());
		return build(user);
	}

	private MeResponse build(AppUser user) {
		var couple = couples.findFor(user);
		String state = couple.isEmpty() ? "none" : couple.get().isPaired() ? "paired" : "waiting";
		Person partner = couple.flatMap(c -> c.partnerOf(user.getId())).flatMap(users::findById)
			.map(p -> new Person(p.getDisplayName(), p.getAvatarUrl()))
			.orElse(null);
		Integer age = user.getBirthDate() == null ? null
				: java.time.Period.between(user.getBirthDate(), user.today(clock)).getYears();
		var togetherSince = couple.map(Couple::getTogetherSince).orElse(user.getTogetherSince());
		return new MeResponse(user.getDisplayName(), user.getEmail(), user.getAvatarUrl(), user.getTimezone(), state,
				couple.map(Couple::getInviteCode).orElse(null), partner, user.getGender(), user.getBirthDate(), age,
				togetherSince, user.hasProfile() && togetherSince != null);
	}
}
