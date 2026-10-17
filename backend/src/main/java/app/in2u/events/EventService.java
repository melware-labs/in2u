package app.in2u.events;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import app.in2u.couple.CoupleService;
import app.in2u.user.AppUser;

@Service
public class EventService {

	private static final Set<String> VISIBILITIES = Set.of("solo_yo", "los_dos");

	/** Tope del rango consultable: evita pedir años enteros de una vez. */
	private static final Duration MAX_RANGE = Duration.ofDays(62);

	private final CoupleEventRepository events;

	private final CoupleService couples;

	public EventService(CoupleEventRepository events, CoupleService couples) {
		this.events = events;
		this.couples = couples;
	}

	@Transactional(readOnly = true)
	public List<CoupleEvent> inRange(AppUser user, Instant from, Instant to) {
		if (!to.isAfter(from) || Duration.between(from, to).compareTo(MAX_RANGE) > 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rango de fechas inválido.");
		}
		var couple = couples.requirePaired(user);
		return events.visibleInRange(couple.getId(), user.getId(), from, to);
	}

	@Transactional
	public CoupleEvent create(AppUser user, String title, Instant startsAt, Instant endsAt, String visibility,
			boolean googleSync) {
		String clean = title == null ? "" : title.trim();
		if (clean.isEmpty() || clean.length() > 120) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El título es obligatorio (máx. 120).");
		}
		if (endsAt.isBefore(startsAt)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El evento no puede terminar antes de empezar.");
		}
		if (!VISIBILITIES.contains(visibility)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Visibilidad inválida.");
		}
		var couple = couples.requirePaired(user);
		return events.save(new CoupleEvent(couple.getId(), user.getId(), clean, startsAt, endsAt, visibility,
				googleSync));
	}

	/** Solo quien lo creó puede borrarlo; para el resto el evento "no existe" (404, no 403). */
	@Transactional
	public void delete(AppUser user, UUID id) {
		var couple = couples.requirePaired(user);
		CoupleEvent event = events.findById(id).orElse(null);
		boolean visibleToMe = event != null && couple.getId().equals(eventCouple(event))
				&& (event.getOwnerId().equals(user.getId()) || event.getVisibility().equals("los_dos"));
		if (!visibleToMe) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado.");
		}
		if (!event.getOwnerId().equals(user.getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo quien creó el evento puede borrarlo.");
		}
		events.delete(event);
	}

	private UUID eventCouple(CoupleEvent e) {
		return e.coupleId();
	}
}
