package app.in2u.chat;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import app.in2u.couple.CoupleService;
import app.in2u.mood.MoodStream;
import app.in2u.user.CurrentUser;

/** Chat privado de la pareja. Los mensajes nuevos se avisan por el mismo SSE del ánimo (evento "chat"). */
@RestController
@RequestMapping("/api/chat")
class ChatController {

	private static final int PAGE = 50;

	private static final int MAX_LENGTH = 2000;

	record SendRequest(@NotNull String body) {
	}

	record MessageResponse(UUID id, String body, Instant createdAt, boolean mine) {
	}

	private final ChatMessageRepository messages;

	private final CoupleService couples;

	private final CurrentUser currentUser;

	private final MoodStream stream;

	private final app.in2u.push.PushNotificationService pushNotifications;

	ChatController(ChatMessageRepository messages, CoupleService couples, CurrentUser currentUser,
			MoodStream stream, app.in2u.push.PushNotificationService pushNotifications) {
		this.messages = messages;
		this.couples = couples;
		this.currentUser = currentUser;
		this.stream = stream;
		this.pushNotifications = pushNotifications;
	}

	/** Los últimos mensajes (o los anteriores a {@code before}), del más viejo al más nuevo. */
	@GetMapping
	List<MessageResponse> list(@AuthenticationPrincipal OAuth2User principal,
			@RequestParam(required = false) Instant before) {
		var user = currentUser.of(principal);
		var couple = couples.requirePaired(user);
		var page = before == null ? messages.findByCoupleIdOrderByCreatedAtDesc(couple.getId(), Limit.of(PAGE))
				: messages.findByCoupleIdAndCreatedAtBeforeOrderByCreatedAtDesc(couple.getId(), before,
						Limit.of(PAGE));
		var result = new ArrayList<>(page.stream().map(m -> toResponse(m, user.getId())).toList());
		Collections.reverse(result);
		return result;
	}

	@PostMapping
	@Transactional
	MessageResponse send(@AuthenticationPrincipal OAuth2User principal, @Valid @RequestBody SendRequest body) {
		var user = currentUser.of(principal);
		var couple = couples.requirePaired(user);
		String clean = body.body().strip();
		if (clean.isEmpty() || clean.length() > MAX_LENGTH) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mensaje debe tener entre 1 y 2000 caracteres.");
		}
		var saved = messages.save(new ChatMessage(couple.getId(), user.getId(), clean));
		stream.publish(couple.getId(), "chat");
		String senderName = user.getDisplayName() != null && !user.getDisplayName().isBlank()
				? user.getDisplayName()
				: "Tu pareja";
		String preview = clean.length() > 80 ? clean.substring(0, 77) + "..." : clean;
		pushNotifications.notifyPartner(couple.getId(), user.getId(), senderName, preview, "/");
		return toResponse(saved, user.getId());
	}

	private static MessageResponse toResponse(ChatMessage m, UUID me) {
		return new MessageResponse(m.getId(), m.getBody(), m.getCreatedAt(), m.getSenderId().equals(me));
	}
}
