package app.in2u.game;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** Una pregunta con sus 4 opciones, en español e inglés, antes de guardarla. */
record QuestionDraft(String textEs, List<String> optionsEs, String textEn, List<String> optionsEn) {

	static final int MAX_TEXT = 120;

	static final int MAX_OPTION = 60;

	/** Limpia y valida lo que llega (de Gemini o del banco); vacío si no sirve. */
	static Optional<QuestionDraft> of(String textEs, List<String> optionsEs, String textEn, List<String> optionsEn) {
		String es = clean(textEs);
		String en = clean(textEn);
		List<String> oes = optionsEs == null ? List.of() : optionsEs.stream().map(QuestionDraft::clean).toList();
		List<String> oen = optionsEn == null ? List.of() : optionsEn.stream().map(QuestionDraft::clean).toList();
		if (es.isEmpty() || en.isEmpty() || es.length() > MAX_TEXT || en.length() > MAX_TEXT || !validOptions(oes)
				|| !validOptions(oen)) {
			return Optional.empty();
		}
		return Optional.of(new QuestionDraft(es, oes, en, oen));
	}

	private static boolean validOptions(List<String> options) {
		return options.size() == 4 && options.stream().allMatch(o -> !o.isEmpty() && o.length() <= MAX_OPTION)
				&& new HashSet<>(options.stream().map(QuestionDraft::normalize).toList()).size() == 4;
	}

	private static String clean(String s) {
		return s == null ? "" : s.replaceAll("\\s+", " ").strip();
	}

	/** Clave para comparar preguntas: sin tildes, mayúsculas ni signos. */
	static String normalize(String s) {
		return Normalizer.normalize(s, Normalizer.Form.NFD)
			.replaceAll("\\p{M}", "")
			.toLowerCase(Locale.ROOT)
			.replaceAll("[^a-z0-9]", "");
	}
}
