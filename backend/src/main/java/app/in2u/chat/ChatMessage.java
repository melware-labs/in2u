package app.in2u.chat;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID coupleId;

	@Column(nullable = false)
	private UUID senderId;

	@Column(nullable = false)
	private String body;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected ChatMessage() {
	}

	public ChatMessage(UUID coupleId, UUID senderId, String body) {
		this.coupleId = coupleId;
		this.senderId = senderId;
		this.body = body;
	}

	public UUID getId() {
		return id;
	}

	public UUID getSenderId() {
		return senderId;
	}

	public String getBody() {
		return body;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
