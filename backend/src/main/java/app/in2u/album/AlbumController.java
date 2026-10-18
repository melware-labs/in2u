package app.in2u.album;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import app.in2u.couple.Couple;
import app.in2u.couple.CoupleService;
import app.in2u.mood.MoodStream;
import app.in2u.user.CurrentUser;

/**
 * Álbum de fotos de la pareja. La imagen llega como cuerpo crudo (image/jpeg,
 * ya achicada por el navegador); título y descripción van como parámetros.
 */
@RestController
@RequestMapping("/api/album")
class AlbumController {

	private static final Set<String> TYPES = Set.of("image/jpeg", "image/png", "image/webp");

	private static final int MAX_BYTES = 3 * 1024 * 1024;

	/** Tope por pareja para no llenar la base gratuita. */
	private static final int MAX_PHOTOS = 500;

	record PhotoResponse(UUID id, String title, String description, Instant createdAt, boolean mine) {
	}

	record DescribeRequest(String title, String description) {
	}

	private final AlbumPhotoRepository photos;

	private final CoupleService couples;

	private final CurrentUser currentUser;

	private final MoodStream stream;

	private final app.in2u.push.PushNotificationService pushNotifications;

	AlbumController(AlbumPhotoRepository photos, CoupleService couples, CurrentUser currentUser, MoodStream stream,
			app.in2u.push.PushNotificationService pushNotifications) {
		this.photos = photos;
		this.couples = couples;
		this.currentUser = currentUser;
		this.stream = stream;
		this.pushNotifications = pushNotifications;
	}

	@GetMapping
	List<PhotoResponse> list(@AuthenticationPrincipal OAuth2User principal) {
		var user = currentUser.of(principal);
		var couple = couples.requirePaired(user);
		return photos.listFor(couple.getId())
			.stream()
			.map(p -> new PhotoResponse(p.id(), p.title(), p.description(), p.createdAt(), p.uploaderId().equals(user.getId())))
			.toList();
	}

	@PostMapping(consumes = { "image/jpeg", "image/png", "image/webp" })
	@Transactional
	PhotoResponse upload(@AuthenticationPrincipal OAuth2User principal,
			@RequestHeader("Content-Type") String contentType, @RequestParam(required = false) String title,
			@RequestParam(required = false) String description, @RequestBody byte[] data) {
		var user = currentUser.of(principal);
		var couple = couples.requirePaired(user);
		String type = MediaType.parseMediaType(contentType).getType() + "/"
				+ MediaType.parseMediaType(contentType).getSubtype();
		if (!TYPES.contains(type)) {
			throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Formato de imagen no admitido.");
		}
		if (data.length == 0 || data.length > MAX_BYTES) {
			throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "La foto pesa demasiado (máx. 3 MB).");
		}
		if (photos.countByCoupleId(couple.getId()) >= MAX_PHOTOS) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"El álbum está lleno (" + MAX_PHOTOS + " fotos). Borra alguna para subir más.");
		}
		var saved = photos.save(new AlbumPhoto(couple.getId(), user.getId(), clean(title, 80, "El título"),
				clean(description, 500, "La descripción"), type, data));
		stream.publish(couple.getId(), "album");
		String uploaderName = user.getDisplayName() != null && !user.getDisplayName().isBlank()
				? user.getDisplayName()
				: "Tu pareja";
		pushNotifications.notifyPartner(couple.getId(), user.getId(), "in2u",
				uploaderName + " subió una foto nueva al álbum", "/");
		return toResponse(saved, user.getId());
	}

	/** Cambia título y descripción; cualquiera de los dos puede editarlos. */
	@PutMapping("/{id}")
	@Transactional
	PhotoResponse describe(@AuthenticationPrincipal OAuth2User principal, @PathVariable UUID id,
			@RequestBody DescribeRequest body) {
		var user = currentUser.of(principal);
		var couple = couples.requirePaired(user);
		var photo = find(couple, id);
		photo.describe(clean(body.title(), 80, "El título"), clean(body.description(), 500, "La descripción"));
		stream.publish(couple.getId(), "album");
		return toResponse(photo, user.getId());
	}

	@GetMapping("/{id}/image")
	ResponseEntity<byte[]> image(@AuthenticationPrincipal OAuth2User principal, @PathVariable UUID id) {
		var photo = find(couples.requirePaired(currentUser.of(principal)), id);
		// Una foto no cambia nunca: el navegador puede guardarla (solo en su caché privada).
		return ResponseEntity.ok()
			.contentType(MediaType.parseMediaType(photo.getContentType()))
			.cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePrivate())
			.body(photo.getData());
	}

	/** Cualquiera de los dos puede borrar una foto del álbum compartido. */
	@DeleteMapping("/{id}")
	@Transactional
	ResponseEntity<Void> delete(@AuthenticationPrincipal OAuth2User principal, @PathVariable UUID id) {
		var couple = couples.requirePaired(currentUser.of(principal));
		photos.delete(find(couple, id));
		stream.publish(couple.getId(), "album");
		return ResponseEntity.noContent().build();
	}

	private static String clean(String text, int max, String what) {
		String c = text == null ? "" : text.strip();
		if (c.length() > max) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, what + " admite hasta " + max + " caracteres.");
		}
		return c.isEmpty() ? null : c;
	}

	private static PhotoResponse toResponse(AlbumPhoto p, UUID me) {
		return new PhotoResponse(p.getId(), p.getTitle(), p.getDescription(), p.getCreatedAt(),
				p.getUploaderId().equals(me));
	}

	private AlbumPhoto find(Couple couple, UUID id) {
		return photos.findById(id)
			.filter(p -> p.getCoupleId().equals(couple.getId()))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Foto no encontrada."));
	}
}
