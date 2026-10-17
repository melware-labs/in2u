package app.in2u.album;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "album_photos")
public class AlbumPhoto {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID coupleId;

	@Column(nullable = false)
	private UUID uploaderId;

	private String title;

	private String description;

	@Column(nullable = false)
	private String contentType;

	@Basic(fetch = FetchType.LAZY)
	@Column(nullable = false)
	private byte[] data;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected AlbumPhoto() {
	}

	public AlbumPhoto(UUID coupleId, UUID uploaderId, String title, String description, String contentType, byte[] data) {
		this.coupleId = coupleId;
		this.uploaderId = uploaderId;
		this.title = title;
		this.description = description;
		this.contentType = contentType;
		this.data = data;
	}

	public UUID getId() {
		return id;
	}

	public UUID getCoupleId() {
		return coupleId;
	}

	public UUID getUploaderId() {
		return uploaderId;
	}

	public String getTitle() {
		return title;
	}

	public String getDescription() {
		return description;
	}

	public void describe(String title, String description) {
		this.title = title;
		this.description = description;
	}

	public String getContentType() {
		return contentType;
	}

	public byte[] getData() {
		return data;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
