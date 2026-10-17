package app.in2u.user;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/**
 * Traduce la sesión (Google o login de desarrollo) a una fila de app_users,
 * creándola la primera vez que esa persona entra.
 */
@Service
public class CurrentUser {

	private final AppUserRepository users;

	public CurrentUser(AppUserRepository users) {
		this.users = users;
	}

	public AppUser of(OAuth2User principal) {
		String subject = principal.getName();
		return users.findByAuthSubject(subject).orElseGet(() -> create(principal, subject));
	}

	private AppUser create(OAuth2User principal, String subject) {
		String name = principal.getAttribute("name");
		try {
			return users.saveAndFlush(new AppUser(subject, principal.getAttribute("email"), name,
					principal.getAttribute("picture")));
		}
		catch (DataIntegrityViolationException raceWithOtherRequest) {
			return users.findByAuthSubject(subject).orElseThrow();
		}
	}
}
