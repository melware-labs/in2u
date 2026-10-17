package app.in2u.config;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Login sin Google, solo para desarrollo local (DEV_LOGIN=true): permite
 * probar la app con dos "cuentas" en dos navegadores sin configurar OAuth.
 * Arma el mismo tipo de sesión que deja el login real, así el resto del
 * backend no distingue entre los dos.
 */
@RestController
@ConditionalOnBooleanProperty("in2u.dev-login")
class DevLoginController {

	private final SecurityContextRepository contextRepository;

	DevLoginController(SecurityContextRepository contextRepository) {
		this.contextRepository = contextRepository;
	}

	record DevLoginRequest(@NotBlank @Email String email, String name) {
	}

	@PostMapping("/api/dev/login")
	ResponseEntity<Void> login(@Valid @RequestBody DevLoginRequest body, HttpServletRequest request,
			HttpServletResponse response) {
		var authorities = List.of(new SimpleGrantedAuthority("OAUTH2_USER"));
		String name = body.name() == null || body.name().isBlank() ? body.email() : body.name();
		var user = new DefaultOAuth2User(authorities,
				Map.of("sub", "dev:" + body.email().toLowerCase(), "email", body.email(), "name", name), "sub");
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(new OAuth2AuthenticationToken(user, authorities, "dev"));
		SecurityContextHolder.setContext(context);
		contextRepository.saveContext(context, request, response);
		return ResponseEntity.noContent().build();
	}
}
