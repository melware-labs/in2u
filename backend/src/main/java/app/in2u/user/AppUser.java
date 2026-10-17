package app.in2u.user;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_users")
public class AppUser {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, unique = true)
	private String authSubject;

	private String email;

	private String displayName;

	private String avatarUrl;

	@Column(nullable = false)
	private String timezone = "UTC";

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected AppUser() {
	}

	public AppUser(String authSubject, String email, String displayName, String avatarUrl) {
		this.authSubject = authSubject;
		this.email = email;
		this.displayName = displayName;
		this.avatarUrl = avatarUrl;
	}

	public UUID getId() {
		return id;
	}

	public String getAuthSubject() {
		return authSubject;
	}

	public String getEmail() {
		return email;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getAvatarUrl() {
		return avatarUrl;
	}

	public String getTimezone() {
		return timezone;
	}

	public void setTimezone(String timezone) {
		this.timezone = timezone;
	}

	public java.time.ZoneId zone() {
		return java.time.ZoneId.of(timezone);
	}

	/** "Hoy" según la zona horaria de esta persona, no la del servidor. */
	public java.time.LocalDate today(java.time.Clock clock) {
		return java.time.LocalDate.now(clock.withZone(zone()));
	}
}
