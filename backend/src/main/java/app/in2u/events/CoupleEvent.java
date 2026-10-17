package app.in2u.events;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "couple_events")
public class CoupleEvent {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID coupleId;

	@Column(nullable = false)
	private UUID ownerId;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false)
	private Instant startsAt;

	@Column(nullable = false)
	private Instant endsAt;

	/** solo_yo | los_dos */
	@Column(nullable = false)
	private String visibility;

	@Column(nullable = false)
	private boolean googleSyncEnabled;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected CoupleEvent() {
	}

	public CoupleEvent(UUID coupleId, UUID ownerId, String title, Instant startsAt, Instant endsAt,
			String visibility, boolean googleSyncEnabled) {
		this.coupleId = coupleId;
		this.ownerId = ownerId;
		this.title = title;
		this.startsAt = startsAt;
		this.endsAt = endsAt;
		this.visibility = visibility;
		this.googleSyncEnabled = googleSyncEnabled;
	}

	public UUID getId() {
		return id;
	}

	public UUID coupleId() {
		return coupleId;
	}

	public UUID getOwnerId() {
		return ownerId;
	}

	public String getTitle() {
		return title;
	}

	public Instant getStartsAt() {
		return startsAt;
	}

	public Instant getEndsAt() {
		return endsAt;
	}

	public String getVisibility() {
		return visibility;
	}

	public boolean isGoogleSyncEnabled() {
		return googleSyncEnabled;
	}
}
