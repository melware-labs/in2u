package app.in2u.couple;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Freno a la adivinanza de códigos: el código de invitación es el único
 * secreto para entrar a una pareja, así que se limitan los intentos fallidos
 * por persona. En memoria: alcanza para una sola instancia del backend.
 */
@Component
class JoinAttemptLimiter {

	static final int MAX_FAILURES = 8;

	static final Duration WINDOW = Duration.ofMinutes(15);

	private final Map<UUID, Deque<Instant>> failures = new ConcurrentHashMap<>();

	private final Clock clock;

	JoinAttemptLimiter(Clock clock) {
		this.clock = clock;
	}

	boolean blocked(UUID userId) {
		Deque<Instant> recent = failures.get(userId);
		if (recent == null) {
			return false;
		}
		synchronized (recent) {
			prune(recent);
			return recent.size() >= MAX_FAILURES;
		}
	}

	void recordFailure(UUID userId) {
		Deque<Instant> recent = failures.computeIfAbsent(userId, k -> new ArrayDeque<>());
		synchronized (recent) {
			prune(recent);
			recent.addLast(clock.instant());
		}
	}

	private void prune(Deque<Instant> recent) {
		Instant limit = clock.instant().minus(WINDOW);
		while (!recent.isEmpty() && recent.peekFirst().isBefore(limit)) {
			recent.removeFirst();
		}
	}
}
