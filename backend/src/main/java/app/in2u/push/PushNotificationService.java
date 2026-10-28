package app.in2u.push;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;

import app.in2u.config.In2uProperties;
import app.in2u.couple.CoupleRepository;
import app.in2u.user.AppUserRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;

@Service
public class PushNotificationService {

	private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

	private final PushSubscriptionRepository repository;
	private final CoupleRepository coupleRepository;
	private final AppUserRepository userRepository;
	private final In2uProperties properties;
	private final ObjectMapper objectMapper;
	private PushService webPushService;

	public PushNotificationService(PushSubscriptionRepository repository, CoupleRepository coupleRepository,
			AppUserRepository userRepository, In2uProperties properties, ObjectMapper objectMapper) {
		this.repository = repository;
		this.coupleRepository = coupleRepository;
		this.userRepository = userRepository;
		this.properties = properties;
		this.objectMapper = objectMapper;

		if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
			Security.addProvider(new BouncyCastleProvider());
		}

		if (properties.push() != null && properties.push().configured()) {
			try {
				this.webPushService = new PushService(
						properties.push().publicKey(),
						properties.push().privateKey(),
						properties.push().subject()
				);
				log.info("Servicio Web Push inicializado correctamente.");
			} catch (GeneralSecurityException e) {
				log.error("No se pudo inicializar WebPushService con las claves VAPID configuradas", e);
			}
		} else {
			log.warn("Web Push no configurado: faltan claves VAPID.");
		}
	}

	/** Clave pública VAPID para el navegador, o null si push no está configurado. */
	public String getPublicKey() {
		return properties.push() != null && properties.push().configured() ? properties.push().publicKey() : null;
	}

	@Transactional
	public void subscribe(UUID userId, String endpoint, String p256dh, String auth) {
		repository.findByEndpoint(endpoint).ifPresentOrElse(
				existing -> existing.updateKeys(p256dh, auth),
				() -> repository.save(new PushSubscription(userId, endpoint, p256dh, auth))
		);
	}

	@Transactional
	public void unsubscribe(String endpoint) {
		repository.deleteByEndpoint(endpoint);
	}

	@Async
	public CompletableFuture<Void> notifyPartner(UUID coupleId, UUID senderUserId, String title, String body, String url) {
		if (webPushService == null) {
			return CompletableFuture.completedFuture(null);
		}
		var couple = coupleRepository.findById(coupleId).orElse(null);
		if (couple == null) {
			return CompletableFuture.completedFuture(null);
		}
		var partnerId = couple.partnerOf(senderUserId).orElse(null);
		if (partnerId == null) {
			return CompletableFuture.completedFuture(null);
		}
		return sendToUser(partnerId, title, body, url);
	}

	@Async
	public CompletableFuture<Void> sendToUser(UUID userId, String title, String body, String url) {
		if (webPushService == null) {
			return CompletableFuture.completedFuture(null);
		}

		var subs = repository.findByUserId(userId);
		if (subs.isEmpty()) {
			return CompletableFuture.completedFuture(null);
		}

		try {
			String payload = objectMapper.writeValueAsString(Map.of(
					"title", title,
					"body", body,
					"url", url != null ? url : "/",
					"icon", "/icons/icon-192.png",
					"badge", "/favicon.svg"
			));
			byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

			for (var sub : subs) {
				try {
					var notification = new Notification(sub.getEndpoint(), sub.getP256dh(), sub.getAuth(), payloadBytes);
					var response = webPushService.send(notification);
					int status = response.getStatusLine().getStatusCode();
					if (status == 201) {
						sub.markUsed();
					} else if (status == 404 || status == 410) {
						log.info("Suscripción push expirada (HTTP {}), eliminando endpoint: {}", status, sub.getEndpoint());
						repository.delete(sub);
					} else {
						log.warn("Respuesta inesperada al enviar push a {}: HTTP {}", sub.getEndpoint(), status);
					}
				} catch (Exception e) {
					log.warn("Error enviando notificación push al endpoint {}: {}", sub.getEndpoint(), e.getMessage());
				}
			}
		} catch (Exception e) {
			log.error("Error serializando payload de push", e);
		}

		return CompletableFuture.completedFuture(null);
	}
}
