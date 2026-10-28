package app.in2u.calendar.google;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Una persona que vinculó su Google Calendar. Los tokens están cifrados (ver {@link TokenCipher}). */
@Entity
@Table(name = "google_calendar_links")
class GoogleCalendarLink {

	@Id
	private UUID userId;

	private String googleEmail;

	@Column(nullable = false)
	private String refreshTokenEnc;

	private String accessTokenEnc;

	private Instant accessTokenExpiresAt;

	@Column(nullable = false)
	private Instant connectedAt = Instant.now();

	protected GoogleCalendarLink() {
	}

	GoogleCalendarLink(UUID userId, String refreshTokenEnc) {
		this.userId = userId;
		this.refreshTokenEnc = refreshTokenEnc;
	}

	UUID getUserId() {
		return userId;
	}

	String getGoogleEmail() {
		return googleEmail;
	}

	void setGoogleEmail(String googleEmail) {
		this.googleEmail = googleEmail;
	}

	String getRefreshTokenEnc() {
		return refreshTokenEnc;
	}

	void setRefreshTokenEnc(String refreshTokenEnc) {
		this.refreshTokenEnc = refreshTokenEnc;
	}

	String getAccessTokenEnc() {
		return accessTokenEnc;
	}

	Instant getAccessTokenExpiresAt() {
		return accessTokenExpiresAt;
	}

	void setAccessToken(String accessTokenEnc, Instant expiresAt) {
		this.accessTokenEnc = accessTokenEnc;
		this.accessTokenExpiresAt = expiresAt;
	}

	Instant getConnectedAt() {
		return connectedAt;
	}
}
