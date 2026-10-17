package app.in2u.couple;

import java.security.SecureRandom;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import app.in2u.user.AppUser;
import app.in2u.user.AppUserRepository;

@Service
public class CoupleService {

	// Sin 0/O ni 1/I/L: el código se dicta en voz alta o se copia a mano.
	private static final String ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

	private static final int CODE_LENGTH = 6;

	private final CoupleRepository couples;

	private final JoinAttemptLimiter limiter;

	private final AppUserRepository users;

	private final SecureRandom random = new SecureRandom();

	public CoupleService(CoupleRepository couples, JoinAttemptLimiter limiter, AppUserRepository users) {
		this.couples = couples;
		this.limiter = limiter;
		this.users = users;
	}

	@Transactional(readOnly = true)
	public Optional<Couple> findFor(AppUser user) {
		return couples.findByMember(user.getId());
	}

	/** La pareja ya vinculada de esta persona, o 409 si todavía no tiene. */
	@Transactional(readOnly = true)
	public Couple requirePaired(AppUser user) {
		return findFor(user).filter(Couple::isPaired)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
					"Primero vinculate con tu pareja."));
	}

	/** Crea el código de invitación; si ya hay uno pendiente, devuelve ese. */
	@Transactional
	public Couple create(AppUser user) {
		Optional<Couple> existing = findFor(user);
		if (existing.isPresent()) {
			if (existing.get().isPaired()) {
				throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya estás vinculada/o con tu pareja.");
			}
			return existing.get();
		}
		var couple = new Couple(newCode(), user.getId());
		couple.setTogetherSince(user.getTogetherSince());
		return couples.save(couple);
	}

	@Transactional
	public Couple join(AppUser user, String rawCode) {
		String code = rawCode == null ? "" : rawCode.trim().toUpperCase();
		if (limiter.blocked(user.getId())) {
			throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
					"Demasiados intentos. Prueba de nuevo en unos minutos.");
		}
		Optional<Couple> existing = findFor(user);
		if (existing.isPresent()) {
			if (existing.get().isPaired()) {
				throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya estás vinculada/o con tu pareja.");
			}
			if (existing.get().getInviteCode().equals(code)) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ese es tu propio código.");
			}
			// Tenía su propio código pendiente y se une al de la otra persona.
			couples.delete(existing.get());
			couples.flush();
		}
		if (couples.claim(code, user.getId()) == 0) {
			limiter.recordFailure(user.getId());
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código inválido o ya utilizado.");
		}
		var couple = couples.findByInviteCode(code).orElseThrow();
		// Si quien creó el código no cargó la fecha, vale la de quien se une.
		if (couple.getTogetherSince() == null && user.getTogetherSince() != null) {
			couple.setTogetherSince(user.getTogetherSince());
			couples.save(couple);
		}
		return couple;
	}

	/**
	 * Formulario de bienvenida (y su edición desde Perfil). La fecha de pareja
	 * se guarda en la pareja si ya existe; si no, queda en la persona hasta
	 * que cree o se una a una.
	 */
	@Transactional
	public void updateProfile(AppUser user, String name, String gender, java.time.LocalDate birthDate,
			java.time.LocalDate togetherSince) {
		user.setDisplayName(name.trim());
		user.setGender(gender);
		user.setBirthDate(birthDate);
		user.setTogetherSince(togetherSince);
		users.save(user);
		findFor(user).ifPresent(c -> {
			c.setTogetherSince(togetherSince);
			couples.save(c);
		});
	}

	/** Zona horaria de una persona de la pareja (para calcular su "hoy"). */
	public java.time.ZoneId zoneOf(UUID userId) {
		return users.findById(userId).map(AppUser::zone).orElse(java.time.ZoneOffset.UTC);
	}

	public Optional<UUID> partnerId(AppUser user) {
		return findFor(user).flatMap(c -> c.partnerOf(user.getId()));
	}

	private String newCode() {
		String code;
		do {
			var sb = new StringBuilder(CODE_LENGTH);
			for (int i = 0; i < CODE_LENGTH; i++) {
				sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
			}
			code = sb.toString();
		}
		while (couples.existsByInviteCode(code));
		return code;
	}
}
