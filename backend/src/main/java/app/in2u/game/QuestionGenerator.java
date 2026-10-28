package app.in2u.game;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * Respaldo inagotable cuando Gemini no está disponible: cada plantilla es una
 * pregunta con una lista de opciones posibles (en español e inglés, alineadas
 * por posición) de las que se sortean 4 distintas. Con ~15 plantillas y ~14
 * opciones cada una hay decenas de miles de combinaciones.
 */
final class QuestionGenerator {

	private record Template(String textEs, String textEn, List<String> es, List<String> en) {
		Template {
			if (es.size() != en.size() || es.size() < 4) {
				throw new IllegalArgumentException(textEs);
			}
		}
	}

	private static Template t(String textEs, String textEn, String[] es, String[] en) {
		return new Template(textEs, textEn, List.of(es), List.of(en));
	}

	private static final List<Template> TEMPLATES = List.of(
			t("¿Qué comida pedirías para una cena especial?", "Which food would you order for a special dinner?",
					new String[] { "Pizza", "Sushi", "Pasta", "Tacos", "Hamburguesa", "Parrillada", "Ensalada", "Ceviche", "Curry", "Ramen", "Empanadas", "Paella", "Lasaña", "Pollo asado" },
					new String[] { "Pizza", "Sushi", "Pasta", "Tacos", "Burger", "Barbecue", "Salad", "Ceviche", "Curry", "Ramen", "Empanadas", "Paella", "Lasagna", "Roast chicken" }),
			t("¿A cuál de estos lugares viajarías?", "Which of these places would you travel to?",
					new String[] { "París", "Tokio", "Nueva York", "Roma", "Cancún", "Patagonia", "Machu Picchu", "Barcelona", "Islandia", "Río de Janeiro", "Bali", "Londres", "Santorini", "Egipto" },
					new String[] { "Paris", "Tokyo", "New York", "Rome", "Cancun", "Patagonia", "Machu Picchu", "Barcelona", "Iceland", "Rio de Janeiro", "Bali", "London", "Santorini", "Egypt" }),
			t("¿Qué haces para pasarla bien un viernes por la noche?", "What do you do to have fun on a Friday night?",
					new String[] { "Salir a bailar", "Ver una peli", "Cenar con amigos", "Jugar videojuegos", "Cocinar algo rico", "Salir a caminar", "Dormir temprano", "Ir a un bar", "Hacer una videollamada", "Leer en casa", "Jugar juegos de mesa", "Pedir comida a domicilio" },
					new String[] { "Go out dancing", "Watch a movie", "Have dinner with friends", "Play video games", "Cook something tasty", "Go for a walk", "Go to bed early", "Go to a bar", "Have a video call", "Read at home", "Play board games", "Order food in" }),
			t("¿Qué bebida pides cuando sales?", "Which drink do you order when you go out?",
					new String[] { "Agua", "Limonada", "Cerveza", "Vino", "Un cóctel", "Café", "Gaseosa", "Jugo natural", "Té helado", "Batido", "Chocolate caliente", "Agua con gas" },
					new String[] { "Water", "Lemonade", "Beer", "Wine", "A cocktail", "Coffee", "Soda", "Fresh juice", "Iced tea", "Milkshake", "Hot chocolate", "Sparkling water" }),
			t("¿Qué género de música escuchas más?", "Which music genre do you listen to the most?",
					new String[] { "Pop", "Rock", "Reggaetón", "Salsa", "Baladas", "Electrónica", "Hip hop", "Cumbia", "Indie", "Jazz", "Clásica", "Country", "Bachata", "Metal" },
					new String[] { "Pop", "Rock", "Reggaeton", "Salsa", "Ballads", "Electronic", "Hip hop", "Cumbia", "Indie", "Jazz", "Classical", "Country", "Bachata", "Metal" }),
			t("¿Qué animal te gustaría tener como mascota?", "Which animal would you like as a pet?",
					new String[] { "Perro", "Gato", "Conejo", "Hámster", "Pájaro", "Pez", "Tortuga", "Caballo", "Loro", "Cobaya", "Hurón", "Iguana" },
					new String[] { "Dog", "Cat", "Rabbit", "Hamster", "Bird", "Fish", "Turtle", "Horse", "Parrot", "Guinea pig", "Ferret", "Iguana" }),
			t("¿Qué tipo de película verías hoy?", "What kind of movie would you watch today?",
					new String[] { "Comedia", "Romance", "Terror", "Acción", "Ciencia ficción", "Animación", "Documental", "Drama", "Misterio", "Fantasía", "Musical", "Aventura" },
					new String[] { "Comedy", "Romance", "Horror", "Action", "Sci-fi", "Animation", "Documentary", "Drama", "Mystery", "Fantasy", "Musical", "Adventure" }),
			t("¿Qué postre te tienta más?", "Which dessert tempts you the most?",
					new String[] { "Helado", "Chocolate", "Flan", "Torta de queso", "Brownie", "Churros", "Tiramisú", "Panqueques", "Frutas con crema", "Galletas", "Donas", "Arroz con leche", "Tres leches" },
					new String[] { "Ice cream", "Chocolate", "Flan", "Cheesecake", "Brownie", "Churros", "Tiramisu", "Pancakes", "Fruit and cream", "Cookies", "Donuts", "Rice pudding", "Tres leches" }),
			t("¿Qué hobby te gustaría tener más tiempo para practicar?", "Which hobby would you like more time for?",
					new String[] { "Pintar", "Tocar un instrumento", "Fotografía", "Jardinería", "Cocinar", "Escribir", "Bailar", "Hacer ejercicio", "Leer", "Manualidades", "Videojuegos", "Aprender un idioma" },
					new String[] { "Painting", "Playing an instrument", "Photography", "Gardening", "Cooking", "Writing", "Dancing", "Working out", "Reading", "Crafts", "Video games", "Learning a language" }),
			t("¿Qué plan de fin de semana prefieres?", "Which weekend plan do you prefer?",
					new String[] { "Una escapada a la playa", "Un día de montaña", "Un museo o exposición", "Un picnic en el parque", "Una maratón de series", "Una fiesta con amigos", "Visitar a la familia", "Un mercado o feria", "Una clase de algo nuevo", "Un concierto", "No hacer nada", "Un paseo en bici" },
					new String[] { "A beach getaway", "A day in the mountains", "A museum or exhibit", "A picnic in the park", "A series marathon", "A party with friends", "Visiting family", "A market or fair", "A class on something new", "A concert", "Doing nothing", "A bike ride" }),
			t("¿Con qué te regalarían el mejor cumpleaños?", "What would make for your best birthday gift?",
					new String[] { "Un viaje", "Un libro", "Ropa", "Un perfume", "Una cena especial", "Un aparato tecnológico", "Una joya", "Entradas a un concierto", "Un álbum de fotos", "Una planta", "Una carta", "Un curso" },
					new String[] { "A trip", "A book", "Clothes", "A perfume", "A special dinner", "A gadget", "Jewelry", "Concert tickets", "A photo album", "A plant", "A letter", "A course" }),
			t("¿Qué te gustaría tener en tu casa ideal?", "What would you want in your dream home?",
					new String[] { "Un jardín enorme", "Una cocina gigante", "Una terraza con vista", "Una piscina", "Una biblioteca", "Un cine en casa", "Un estudio de música", "Una chimenea", "Un gimnasio", "Un taller de manualidades", "Un huerto", "Un cuarto de juegos" },
					new String[] { "A huge garden", "A giant kitchen", "A terrace with a view", "A pool", "A library", "A home theater", "A music studio", "A fireplace", "A gym", "A craft workshop", "A vegetable garden", "A game room" }),
			t("¿Cuál de estas cosas no soportas?", "Which of these can't you stand?",
					new String[] { "Esperar en una fila", "El ruido fuerte", "Llegar tarde", "Los mensajes sin responder", "El desorden", "El calor extremo", "Madrugar", "Las mentiras", "El tráfico", "Las discusiones por tonterías", "Que me interrumpan", "La comida fría" },
					new String[] { "Waiting in line", "Loud noise", "Being late", "Unanswered messages", "Mess", "Extreme heat", "Waking up early", "Lies", "Traffic", "Arguing over silly things", "Being interrupted", "Cold food" }),
			t("¿Qué es lo que más disfrutas de un día de lluvia?", "What do you enjoy most about a rainy day?",
					new String[] { "Quedarme en la cama", "Tomar algo calentito", "Ver una peli", "Escuchar el sonido de la lluvia", "Leer", "Cocinar", "Dormir una siesta", "Jugar algo en casa", "Salir a mojarme", "Ordenar mis cosas" },
					new String[] { "Staying in bed", "Having something warm to drink", "Watching a movie", "Listening to the rain", "Reading", "Cooking", "Taking a nap", "Playing something at home", "Going out to get wet", "Tidying up my things" }),
			t("¿Cómo te gusta que te sorprendan?", "How do you like to be surprised?",
					new String[] { "Con una cena inesperada", "Con flores", "Con una nota escondida", "Con un viaje sorpresa", "Con una canción dedicada", "Con un desayuno en la cama", "Con una visita inesperada", "Con un regalo pequeño", "Con una fiesta sorpresa", "Con un plan improvisado" },
					new String[] { "With an unexpected dinner", "With flowers", "With a hidden note", "With a surprise trip", "With a dedicated song", "With breakfast in bed", "With an unexpected visit", "With a small gift", "With a surprise party", "With an improvised plan" }));

	private QuestionGenerator() {
	}

	/** Devuelve hasta {@code count} preguntas distintas entre sí, con plantillas y opciones sorteadas. */
	static List<QuestionDraft> next(int count, Random random) {
		var templates = new ArrayList<>(TEMPLATES);
		Collections.shuffle(templates, random);
		var drafts = new ArrayList<QuestionDraft>();
		for (int i = 0; i < count; i++) {
			Template tpl = templates.get(i % templates.size());
			var idx = new ArrayList<Integer>();
			for (int j = 0; j < tpl.es().size(); j++) {
				idx.add(j);
			}
			Collections.shuffle(idx, random);
			var es = new ArrayList<String>();
			var en = new ArrayList<String>();
			idx.stream().limit(4).forEach(j -> {
				es.add(tpl.es().get(j));
				en.add(tpl.en().get(j));
			});
			QuestionDraft.of(tpl.textEs(), es, tpl.textEn(), en).ifPresent(drafts::add);
		}
		return drafts;
	}

	static int templateCount() {
		return TEMPLATES.size();
	}
}
