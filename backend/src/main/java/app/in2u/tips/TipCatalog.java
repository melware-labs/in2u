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
			new Entry("avisar-cuando-volves",
					"Avisar cuándo se vuelve; útil cuando hay ausencia, viajes o quedarse hasta tarde."),
			new Entry("girar-hacia-lo-minimo",
					"Responder a comentarios chicos al pasar como pedidos de atención; útil con ánimo neutro pero señales sutiles."),
			new Entry("volver-rapido",
					"Volver rápido después de una discusión o mal momento, aunque sea torpe; útil tras tensión o un bajón reciente."));

	public static boolean isValid(String key) {
		return ENTRIES.stream().anyMatch(e -> e.key().equals(key));
	}

	private TipCatalog() {
	}
}
