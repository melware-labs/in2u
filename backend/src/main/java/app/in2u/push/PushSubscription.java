package app.in2u.push;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "push_subscriptions")
public class PushSubscription {

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private UUID id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(nullable = false, unique = true, length = 1000)
	private String endpoint;

	@Column(nullable = false, length = 200)
	private String p256dh;

	@Column(nullable = false, length = 100)
	private String auth;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	@Column(name = "last_used_at")
	private Instant lastUsedAt;

	protected PushSubscription() {
	}

	public PushSubscription(UUID userId, String endpoint, String p256dh, String auth) {
		this.userId = userId;
		this.endpoint = endpoint;
		this.p256dh = p256dh;
		this.auth = auth;
		this.createdAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public String getEndpoint() {
		return endpoint;
	}

	public String getP256dh() {
		return p256dh;
	}

	public String getAuth() {
		return auth;
	}

	public void updateKeys(String p256dh, String auth) {
		this.p256dh = p256dh;
		this.auth = auth;
		this.lastUsedAt = Instant.now();
	}

	public void markUsed() {
		this.lastUsedAt = Instant.now();
	}
}
