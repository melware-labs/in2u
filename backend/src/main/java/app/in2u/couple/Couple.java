package app.in2u.couple;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "couples")
public class Couple {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, unique = true)
	private String inviteCode;

	@Column(nullable = false)
	private UUID memberOne;

	private UUID memberTwo;

	/** Desde cuándo son pareja; compartida, la puede editar cualquiera de los dos. */
	private java.time.LocalDate togetherSince;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected Couple() {
	}

	public Couple(String inviteCode, UUID memberOne) {
		this.inviteCode = inviteCode;
		this.memberOne = memberOne;
	}

	public UUID getId() {
		return id;
	}

	public String getInviteCode() {
		return inviteCode;
	}

	public UUID getMemberOne() {
		return memberOne;
	}

	public UUID getMemberTwo() {
		return memberTwo;
	}

	public java.time.LocalDate getTogetherSince() {
		return togetherSince;
	}

	public void setTogetherSince(java.time.LocalDate togetherSince) {
		this.togetherSince = togetherSince;
	}

	public boolean isPaired() {
		return memberTwo != null;
	}

	public Optional<UUID> partnerOf(UUID userId) {
		if (userId.equals(memberOne)) {
			return Optional.ofNullable(memberTwo);
		}
		return userId.equals(memberTwo) ? Optional.of(memberOne) : Optional.empty();
	}
}
