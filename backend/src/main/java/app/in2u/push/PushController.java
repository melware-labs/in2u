package app.in2u.push;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.in2u.user.AppUser;
import app.in2u.user.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/push")
public class PushController {

	private final PushNotificationService pushService;
	private final CurrentUser currentUser;

	public PushController(PushNotificationService pushService, CurrentUser currentUser) {
		this.pushService = pushService;
		this.currentUser = currentUser;
	}

	@GetMapping("/public-key")
	public ResponseEntity<Map<String, String>> getPublicKey() {
		String key = pushService.getPublicKey();
		if (key == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(Map.of("publicKey", key));
	}

	public record SubscriptionKeys(@NotBlank String p256dh, @NotBlank String auth) {
	}

	public record SubscribeRequest(@NotBlank String endpoint, @NotNull @Valid SubscriptionKeys keys) {
	}

	@PostMapping("/subscribe")
	public ResponseEntity<Void> subscribe(@AuthenticationPrincipal OAuth2User principal,
			@Valid @RequestBody SubscribeRequest body) {
		AppUser user = currentUser.of(principal);
		pushService.subscribe(user.getId(), body.endpoint(), body.keys().p256dh(), body.keys().auth());
		return ResponseEntity.noContent().build();
	}

	public record UnsubscribeRequest(@NotBlank String endpoint) {
	}

	@PostMapping("/unsubscribe")
	public ResponseEntity<Void> unsubscribe(@Valid @RequestBody UnsubscribeRequest body) {
		pushService.unsubscribe(body.endpoint());
		return ResponseEntity.noContent().build();
	}
}
