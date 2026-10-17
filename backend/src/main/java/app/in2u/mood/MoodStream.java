package app.in2u.mood;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Reemplaza a Supabase Realtime: cada pareja tiene sus conexiones SSE
 * abiertas y se les avisa cuando alguien guarda un check-in. Las conexiones
 * viven en memoria, así que sirve con una sola instancia del backend (el
 * caso de esta app); para varias habría que pasar por Postgres LISTEN/NOTIFY.
 */
@Component
public class MoodStream {

	private final Map<UUID, List<SseEmitter>> byCouple = new ConcurrentHashMap<>();

	public SseEmitter subscribe(UUID coupleId) {
		// Sin timeout del servidor: el navegador reconecta solo si se corta.
		var emitter = new SseEmitter(0L);
		var list = byCouple.computeIfAbsent(coupleId, k -> new CopyOnWriteArrayList<>());
		list.add(emitter);
		Runnable remove = () -> list.remove(emitter);
		emitter.onCompletion(remove);
		emitter.onTimeout(remove);
		emitter.onError(e -> remove.run());
		try {
			emitter.send(SseEmitter.event().name("hello").data("ok"));
		}
		catch (IOException e) {
			remove.run();
		}
		return emitter;
	}

	public void publish(UUID coupleId, String event) {
		for (SseEmitter emitter : byCouple.getOrDefault(coupleId, List.of())) {
			try {
				emitter.send(SseEmitter.event().name(event).data("changed"));
			}
			catch (IOException | IllegalStateException e) {
				emitter.complete();
			}
		}
	}

	/** Latido para que proxies y balanceadores no cierren conexiones inactivas. */
	@org.springframework.scheduling.annotation.Scheduled(fixedRate = 25_000)
	void heartbeat() {
		byCouple.values().forEach(list -> list.forEach(e -> {
			try {
				e.send(SseEmitter.event().comment("ping"));
			}
			catch (IOException | IllegalStateException ex) {
				e.complete();
			}
		}));
	}
}
