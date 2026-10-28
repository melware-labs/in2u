package app.in2u.game;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import tools.jackson.databind.JsonNode;

import app.in2u.tips.GeminiClient;

/**
 * Preguntas infinitas: cada vez que alguien termina todas las preguntas
 * disponibles, se agrega un lote de 10 para la pareja. Primero se piden a
 * Gemini (plan gratuito) y, si no hay key, falla o devuelve pocas, se completa
 * con el banco de reserva y, si aún falta, con plantillas sorteadas (nunca se agotan). Nunca se repite una pregunta que la pareja ya tiene.
 * A Gemini solo viajan los textos de las preguntas, ningún dato de la pareja.
 */
@Service
class GameQuestionService {

	static final int BATCH_SIZE = 10;

	/** Cuántas preguntas previas se le pasan a Gemini para que no las repita. */
	private static final int AVOID_LIMIT = 150;

	private static final Logger log = LoggerFactory.getLogger(GameQuestionService.class);

	private static final SecureRandom RANDOM = new SecureRandom();

	private final GameQuestionRepository questions;

	private final GeminiClient gemini;

	GameQuestionService(GameQuestionRepository questions, GeminiClient gemini) {
		this.questions = questions;
		this.gemini = gemini;
	}

	List<GameQuestion> forCouple(UUID coupleId) {
		return questions.findByCoupleIdOrderByBatchAscPositionAsc(coupleId);
	}

	/** Genera y guarda el próximo lote. Devuelve cuántas preguntas se agregaron (0 si no quedan). */
	int addBatch(UUID coupleId) {
		List<GameQuestion> existing = forCouple(coupleId);
		List<String> asked = Stream.concat(GameQuestionBank.BUILT_IN_ES.stream(),
				existing.stream().map(GameQuestion::getTextEs)).toList();
		Set<String> seen = asked.stream().map(QuestionDraft::normalize).collect(Collectors.toCollection(HashSet::new));
		// Las plantillas repiten el texto con otras opciones: se distinguen por texto + opciones.
		Set<String> seenCombos = existing.stream().map(q -> combo(q.getTextEs(), q.getOptionsEs()))
			.collect(Collectors.toCollection(HashSet::new));

		var batch = new ArrayList<GameQuestion>();
		int number = existing.isEmpty() ? 1 : existing.get(existing.size() - 1).getBatch() + 1;
		if (!gemini.enabled()) {
			log.warn("GEMINI_API_KEY no está configurada: el juego usa preguntas de reserva.");
		}
		addUnseen(batch, fromGemini(asked), seen, coupleId, number, "gemini");
		addUnseen(batch, GameQuestionBank.RESERVE, seen, coupleId, number, "reserva");
		// Inagotable: si Gemini y el banco no alcanzan, se arman preguntas con las plantillas.
		for (int attempt = 0; attempt < 20 && batch.size() < BATCH_SIZE; attempt++) {
			for (QuestionDraft d : QuestionGenerator.next(BATCH_SIZE - batch.size(), RANDOM)) {
				if (batch.size() < BATCH_SIZE && seenCombos.add(combo(d.textEs(), d.optionsEs()))) {
					batch.add(new GameQuestion(coupleId, newKey(), number, batch.size(), d, "plantilla"));
				}
			}
		}
		if (batch.isEmpty()) {
			return 0;
		}
		log.info("Lote {} del juego: {} preguntas ({} de Gemini).", number, batch.size(),
				batch.stream().filter(q -> q.getSource().equals("gemini")).count());
		try {
			questions.saveAllAndFlush(batch);
			return batch.size();
		}
		catch (DataIntegrityViolationException e) {
			// La pareja generó el mismo lote a la vez: ya hay preguntas nuevas.
			return 0;
		}
	}

	private static void addUnseen(List<GameQuestion> batch, List<QuestionDraft> drafts, Set<String> seen,
			UUID coupleId, int number, String source) {
		for (QuestionDraft d : drafts) {
			if (batch.size() == BATCH_SIZE) {
				return;
			}
			if (seen.add(QuestionDraft.normalize(d.textEs())) && seen.add(QuestionDraft.normalize(d.textEn()))) {
				batch.add(new GameQuestion(coupleId, newKey(), number, batch.size(), d, source));
			}
		}
	}

	static String combo(String text, List<String> options) {
		return QuestionDraft.normalize(text) + "|"
				+ options.stream().map(QuestionDraft::normalize).sorted().collect(Collectors.joining(","));
	}

	private static String newKey() {
		var key = new StringBuilder("ia_");
		for (int i = 0; i < 12; i++) {
			key.append("abcdefghijklmnopqrstuvwxyz0123456789".charAt(RANDOM.nextInt(36)));
		}
		return key.toString();
	}

	private List<QuestionDraft> fromGemini(List<String> asked) {
		List<String> avoid = asked.subList(Math.max(0, asked.size() - AVOID_LIMIT), asked.size());
		return gemini.generateJson(prompt(avoid), SCHEMA).map(GameQuestionService::parse).orElse(List.of());
	}

	static String prompt(List<String> avoid) {
		return """
				Crea %d preguntas nuevas para el juego de pareja "¿Cuánto me conoces?". Cada persona responde \
				sobre sí misma y adivina qué respondió su pareja, así que las preguntas son sobre gustos, \
				costumbres, sueños, recuerdos o forma de ser.

				Reglas:
				- Tono cálido y divertido. Nada sexual, ofensivo ni demasiado íntimo o triste.
				- Español neutro con tuteo ("tú": eliges, prefieres, haces). Nunca voseo (elegís, preferís, hacés).
				- Evita palabras con género; si no se puede, usa la forma "querida/o".
				- Pregunta de máximo 90 caracteres y exactamente 4 opciones cortas (máximo 40 caracteres), \
				distintas entre sí y que cualquiera podría elegir.
				- Incluye la misma pregunta y opciones traducidas al inglés.
				- No repitas ni reformules ninguna de estas preguntas que ya se hicieron:
				%s""".formatted(BATCH_SIZE, avoid.stream().map(q -> "  * " + q).collect(Collectors.joining("\n")));
	}

	private static final Map<String, Object> SCHEMA = Map.of("type", "OBJECT", "properties",
			Map.of("questions", Map.of("type", "ARRAY", "items", Map.of("type", "OBJECT", "properties",
					Map.of("es", Map.of("type", "STRING"), "es_options", stringArray(), "en", Map.of("type", "STRING"),
							"en_options", stringArray()),
					"required", List.of("es", "es_options", "en", "en_options")))),
			"required", List.of("questions"));

	private static Map<String, Object> stringArray() {
		return Map.of("type", "ARRAY", "items", Map.of("type", "STRING"));
	}

	static List<QuestionDraft> parse(JsonNode json) {
		var drafts = new ArrayList<QuestionDraft>();
		for (JsonNode q : json.path("questions")) {
			QuestionDraft.of(q.path("es").asText(""), strings(q.path("es_options")), q.path("en").asText(""),
					strings(q.path("en_options"))).ifPresent(drafts::add);
		}
		if (drafts.isEmpty()) {
			log.warn("Gemini no devolvió preguntas válidas; se usa el banco de reserva.");
		}
		return drafts;
	}

	private static List<String> strings(JsonNode array) {
		var list = new ArrayList<String>();
		array.forEach(n -> list.add(n.asText("")));
		return list;
	}
}
