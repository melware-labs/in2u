package app.in2u.tips;

import java.util.List;

import app.in2u.mood.MoodCheckin;

/**
 * Respaldo sin IA: elige el consejo solo con los números del ánimo. Se usa
 * cuando no hay API key de Gemini o cuando Gemini falla/agota su cuota
 * gratuita, así "Consejos" nunca queda vacío.
 */
public final class RuleBasedTipper {

	/** @param recent check-ins de quien se anima, el más reciente primero. */
	public static TipSuggestion suggest(String authorName, List<MoodCheckin> recent) {
		MoodCheckin today = recent.get(0);
		long lowDays = recent.stream().filter(c -> c.getMood() <= 3).count();
		boolean wasLowBefore = recent.stream().skip(1).anyMatch(c -> c.getMood() <= 2);

		if (today.getMood() <= 2) {
			return new TipSuggestion("preguntar-antes-de-resolver", authorName + " tuvo un día pesado",
					"Pregúntale si quiere que la/lo escuches o que la/lo ayudes a resolver algo. Hoy escuchar vale más que arreglar.",
					"reglas");
		}
		if (lowDays >= 3 || (today.getMood() == 3 && lowDays >= 2)) {
			return new TipSuggestion("avisar-cuando-volves", authorName + " viene cansada/o hace varios días",
					"Hoy suma lo predecible: avisa cuándo llegas y ofrece quitarle una tarea de encima.", "reglas");
		}
		if (today.getMood() >= 4 && wasLowBefore) {
			return new TipSuggestion("volver-rapido", authorName + " viene saliendo de un mal momento",
					"Un gesto chico para reconectar hoy ayuda más que esperar el momento perfecto.", "reglas");
		}
		if (today.getMood() >= 5) {
			return new TipSuggestion("girar-hacia-lo-minimo", authorName + " está de buen ánimo",
					"Aprovecha: responde a los comentarios chicos que haga hoy. Esos momentos suman.", "reglas");
		}
		return new TipSuggestion("girar-hacia-lo-minimo", authorName + " tuvo un día normal",
				"Atiende los comentarios al pasar: un \"mira esto\" es un pedido de atención.", "reglas");
	}

	private RuleBasedTipper() {
	}
}
