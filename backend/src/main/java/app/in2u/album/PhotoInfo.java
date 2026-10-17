package app.in2u.album;

import java.time.Instant;
import java.util.UUID;

/** Datos de cada foto sin los bytes de la imagen (esos se piden de a una). */
public record PhotoInfo(UUID id, UUID uploaderId, String title, String description, Instant createdAt) {
}
