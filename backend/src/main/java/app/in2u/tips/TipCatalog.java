package app.in2u.tips;

import java.util.List;

/**
 * Claves de los consejos curados. Los textos (ES/EN) viven en el frontend,
 * igual que antes en src/content/tips.ts; acá solo hace falta la clave y una
 * descripción para que la IA elija. Mantener las claves sincronizadas.
 */
public final class TipCatalog {

	public record Entry(String key, String summary) {
	}

	public static final List<Entry> ENTRIES = List.of(
			new Entry("preguntar-antes-de-resolver",
					"Preguntar si necesita que la escuchen o que la ayuden a resolver algo; útil con estrés o un problema puntual."),
			new Entry("ofrecer-compania",
					"Acompañar sin presionar, con un abrazo o una infusión; útil con un día muy pesado o tristeza."),
			new Entry("quitar-una-tarea",
					"Hacerse cargo de una tarea pendiente sin que lo pida; útil con cansancio o sobrecarga."),
			new Entry("mensaje-sin-pregunta",
					"Mandar un mensaje de cariño que no pida respuesta; útil con ánimo bajo o cuando hay distancia."),
			new Entry("avisar-cuando-volves",
					"Avisar cuándo se vuelve; útil cuando hay ausencia, viajes o quedarse hasta tarde."),
			new Entry("plan-sencillo",
					"Proponer un plan muy simple para la noche; útil con varios días de poca energía."),
			new Entry("preguntar-como-esta-de-verdad",
					"Preguntar cómo se siente de verdad y escuchar sin interrumpir; útil con varios días de ánimo bajo."),
			new Entry("volver-rapido",
					"Volver rápido después de una discusión o mal momento, aunque sea torpe; útil tras tensión o un bajón reciente."),
			new Entry("celebrar-mejoria",
					"Notar y decir que va mejor; útil cuando el ánimo sube después de días malos."),
			new Entry("girar-hacia-lo-minimo",
					"Responder a comentarios chicos al pasar como pedidos de atención; útil con ánimo bueno o neutro."),
			new Entry("compartir-alegria",
					"Preguntar qué la puso de buen humor y celebrarlo; útil con ánimo alto."),
			new Entry("proponer-algo-lindo",
					"Proponer una salida o plan que les guste a los dos; útil con buen ánimo."),
			new Entry("pequeno-detalle",
					"Un detalle sin motivo, como su bebida favorita; útil con un día normal."),
			new Entry("preguntar-algo-concreto",
					"Hacer una pregunta concreta sobre su día en vez de un cómo estás; útil con un día normal."),
			new Entry("tiempo-sin-pantallas",
					"Diez minutos de conversación sin pantallas; útil con ánimo neutro o distancia."));

	public static boolean isValid(String key) {
		return ENTRIES.stream().anyMatch(e -> e.key().equals(key));
	}

	private TipCatalog() {
	}
}
