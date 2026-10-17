package app.in2u.mood;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "mood_checkins")
public class MoodCheckin {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID coupleId;

	@Column(nullable = false)
	private UUID userId;

	@Column(nullable = false)
	private short mood;

	private String note;

	@Column(nullable = false)
	private LocalDate checkinDate;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	@Column(nullable = false)
	private Instant updatedAt = Instant.now();

	protected MoodCheckin() {
	}

	public MoodCheckin(UUID coupleId, UUID userId, LocalDate checkinDate) {
		this.coupleId = coupleId;
		this.userId = userId;
		this.checkinDate = checkinDate;
	}

	public void update(int mood, String note) {
		this.mood = (short) mood;
		this.note = note == null || note.isBlank() ? null : note.trim();
		this.updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public UUID getCoupleId() {
		return coupleId;
	}

	public UUID getUserId() {
		return userId;
	}

	public int getMood() {
		return mood;
	}

	public String getNote() {
		return note;
	}

	public LocalDate getCheckinDate() {
		return checkinDate;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
