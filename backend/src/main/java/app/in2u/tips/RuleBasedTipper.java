package app.in2u.tips;

import java.util.List;

import app.in2u.mood.MoodCheckin;

/**
 * Respaldo sin IA: elige el consejo solo con los números del ánimo. Se usa
 * cuando no hay API key de Gemini o cuando Gemini falla/agota su cuota
 * gratuita, así "Consejos" nunca queda vacío. Cada situación tiene varias
 * opciones y se rota según el día para que no sea siempre el mismo consejo.
 */
public final class RuleBasedTipper {

	public record Option(String key, String advice) {
	}

	public static final List<Option> HEAVY_DAY = List.of(
			new Option("preguntar-antes-de-resolver",
					"Pregúntale qué necesita: que la escuches o que busquen una solución juntos. Hoy escuchar vale más que arreglar."),
			new Option("ofrecer-compania",
					"No hace falta decir mucho: quédate cerca, ofrécele un abrazo o una infusión y deja que hable si quiere."),
			new Option("quitar-una-tarea",
					"Hazte cargo de algo pendiente de hoy, como la cena o un mandado, sin que te lo pida."),
			new Option("mensaje-sin-pregunta",
					"Mándale un mensaje breve de cariño que no pida respuesta, solo para que sepa que estás ahí."));

	public static final List<Option> LOW_ENERGY_STREAK = List.of(
			new Option("avisar-cuando-volves",
					"Hoy suma lo predecible: avisa cuándo llegas y ofrécele quitarle una tarea de encima."),
			new Option("plan-sencillo",
					"Propón un plan muy simple para esta noche, como cenar tranquilos o ver una serie, sin exigir nada más."),
			new Option("preguntar-como-esta-de-verdad",
					"Pregúntale cómo se siente de verdad, no solo qué tal el día, y dale tiempo para contestar sin interrumpir."));

	public static final List<Option> RECOVERING = List.of(
			new Option("volver-rapido",
					"Un gesto pequeño para reconectar hoy ayuda más que esperar el momento perfecto."),
			new Option("celebrar-mejoria",
					"Dile con naturalidad que la notas mejor hoy y pregúntale si hay algo que quiera contarte."));

	public static final List<Option> GOOD_DAY = List.of(
			new Option("girar-hacia-lo-minimo",
					"Aprovecha: responde a los comentarios pequeños que haga hoy. Esos momentos suman."),
			new Option("compartir-alegria",
					"Pregúntale qué le puso de buen humor y celébralo con interés: compartir lo bueno también une."),
			new Option("proponer-algo-lindo",
					"Es buen día para proponer algo que les guste a los dos, como un paseo o una salida corta."));

	public static final List<Option> NORMAL_DAY = List.of(
			new Option("pequeno-detalle",
					"Un detalle sin motivo, como su bebida favorita o un mensaje a media tarde, vale más de lo que parece."),
			new Option("preguntar-algo-concreto",
					"Pregúntale algo concreto sobre su día, como cuál fue lo mejor de hoy, en lugar de un cómo estás general."),
			new Option("tiempo-sin-pantallas",
					"Dediquen diez minutos sin pantallas a conversar: la atención completa se nota."),
			new Option("girar-hacia-lo-minimo",
					"Atiende los comentarios al pasar: un \"mira esto\" es un pedido de atención."));

	/** @param recent check-ins de quien se anima, el más reciente primero. */
	public static TipSuggestion suggest(String authorName, List<MoodCheckin> recent) {
		MoodCheckin today = recent.get(0);
		long lowDays = recent.stream().filter(c -> c.getMood() <= 3).count();
		boolean wasLowBefore = recent.stream().skip(1).anyMatch(c -> c.getMood() <= 2);

		if (today.getMood() <= 2) {
			return pick(HEAVY_DAY, authorName + " tuvo un día pesado", today);
		}
		if (lowDays >= 3 || (today.getMood() == 3 && lowDays >= 2)) {
			return pick(LOW_ENERGY_STREAK, authorName + " viene con poca energía hace varios días", today);
		}
		if (today.getMood() >= 4 && wasLowBefore) {
			return pick(RECOVERING, authorName + " viene saliendo de un mal momento", today);
		}
		if (today.getMood() >= 5) {
			return pick(GOOD_DAY, authorName + " está de buen ánimo", today);
		}
		return pick(NORMAL_DAY, authorName + " tuvo un día normal", today);
	}

	/** Rota por día y ánimo: el mismo día y ánimo da siempre lo mismo, otro día cambia. */
	private static TipSuggestion pick(List<Option> options, String kicker, MoodCheckin today) {
		int index = (int) Math.floorMod(today.getCheckinDate().toEpochDay() + today.getMood(), (long) options.size());
		Option o = options.get(index);
		return new TipSuggestion(o.key(), kicker, o.advice(), "reglas");
	}

	private RuleBasedTipper() {
	}
}
