package app.in2u.game;

import java.util.List;

/**
 * Preguntas fijas que el backend necesita conocer: las 20 del frontend (solo
 * para no repetirlas) y un banco de reserva para cuando Gemini no está
 * disponible.
 */
final class GameQuestionBank {

	private GameQuestionBank() {
	}

	/** Copia de los textos de web/src/content/questions.ts (GAME_ES). */
	static final List<String> BUILT_IN_ES = List.of("¿Cuál es tu plan ideal para un sábado?",
			"¿Qué comida elegirías para siempre?", "¿A dónde te irías de viaje mañana?",
			"¿Qué te hace sentir más querida/o?", "¿Eres más de mañana o de noche?",
			"Si pudieras tener un superpoder, ¿cuál sería?", "Cuando tienes un mal día, ¿qué necesitas?",
			"¿Qué tipo de película eliges?", "¿Qué mascota tendrías?", "¿Cuál sería tu cita soñada?",
			"¿Con qué arrancas el día?", "¿Cuál es tu estación favorita?", "Cuando te enojas, ¿qué haces?",
			"¿Qué regalo te haría más ilusión?", "¿Qué música no puede faltar?", "¿Cómo es tu domingo perfecto?",
			"¿Qué te da más miedo?", "En 5 años, ¿dónde te imaginas?", "¿Qué postre eliges?",
			"¿Qué cumplido te gusta más?");

	private static QuestionDraft q(String es, List<String> oes, String en, List<String> oen) {
		return QuestionDraft.of(es, oes, en, oen).orElseThrow();
	}

	static final List<QuestionDraft> RESERVE = List.of(
			q("¿Qué haces primero al despertarte?", List.of("Miro el celular", "Me estiro un rato", "Voy directo a la ducha", "Pospongo la alarma"),
					"What do you do first when you wake up?", List.of("Check my phone", "Stretch for a while", "Head straight to the shower", "Hit snooze")),
			q("¿Qué harías con un día libre sorpresa?", List.of("Dormir todo lo que pueda", "Salir de paseo", "Ordenar la casa", "Ver series sin culpa"),
					"What would you do with a surprise day off?", List.of("Sleep as much as I can", "Go out exploring", "Tidy up the house", "Binge series guilt-free")),
			q("¿Cuál es tu forma favorita de relajarte?", List.of("Un baño largo", "Leer algo", "Escuchar música", "Salir a caminar"),
					"What is your favorite way to relax?", List.of("A long bath", "Reading something", "Listening to music", "Going for a walk")),
			q("¿Qué te cuesta más compartir?", List.of("La comida de mi plato", "Mi manta", "El control remoto", "Mi cargador"),
					"What is hardest for you to share?", List.of("The food on my plate", "My blanket", "The remote", "My charger")),
			q("¿Qué es lo que más te gusta de nuestra relación?", List.of("Que nos reímos mucho", "Que nos cuidamos", "Que hablamos de todo", "Que hacemos planes juntos"),
					"What do you like most about our relationship?", List.of("We laugh a lot", "We look after each other", "We talk about everything", "We make plans together")),
			q("¿Qué harías si ganaras la lotería?", List.of("Viajar por el mundo", "Comprar una casa", "Ayudar a mi familia", "Ahorrar casi todo"),
					"What would you do if you won the lottery?", List.of("Travel the world", "Buy a house", "Help my family", "Save almost all of it")),
			q("¿Qué tarea de la casa odias más?", List.of("Lavar los platos", "Planchar", "Limpiar el baño", "Doblar la ropa"),
					"Which chore do you hate the most?", List.of("Washing dishes", "Ironing", "Cleaning the bathroom", "Folding laundry")),
			q("¿Cómo prefieres celebrar tu cumpleaños?", List.of("Una fiesta grande", "Una cena tranquila", "Un viaje corto", "Sin festejos, por favor"),
					"How do you prefer to celebrate your birthday?", List.of("A big party", "A quiet dinner", "A short trip", "No fuss, please")),
			q("¿Qué snack eliges para ver una peli?", List.of("Palomitas", "Papitas", "Chocolate", "Fruta"),
					"Which snack do you pick for a movie?", List.of("Popcorn", "Chips", "Chocolate", "Fruit")),
			q("¿Qué deporte te gusta más?", List.of("Fútbol", "Natación", "Correr o caminar", "Ninguno, gracias"),
					"Which sport do you like best?", List.of("Soccer", "Swimming", "Running or walking", "None, thanks")),
			q("¿Qué te pone de buen humor al instante?", List.of("Una canción que me encanta", "Comer algo rico", "Un mensaje bonito", "Un día de sol"),
					"What puts you in a good mood instantly?", List.of("A song I love", "Eating something tasty", "A sweet message", "A sunny day")),
			q("¿Qué lugar de la casa es tu favorito?", List.of("La cama", "El sillón", "La cocina", "El balcón o el patio"),
					"What is your favorite spot at home?", List.of("The bed", "The couch", "The kitchen", "The balcony or yard")),
			q("¿Qué aprenderías si tuvieras tiempo?", List.of("Un idioma", "Un instrumento", "A cocinar mejor", "Un deporte nuevo"),
					"What would you learn if you had the time?", List.of("A language", "An instrument", "To cook better", "A new sport")),
			q("¿Cómo te gusta recibir una buena noticia?", List.of("En persona", "Por mensaje", "Con una llamada", "Con una sorpresa"),
					"How do you like to get good news?", List.of("In person", "By text", "With a call", "With a surprise")),
			q("¿Qué haces cuando no puedes dormir?", List.of("Miro el celular", "Leo un rato", "Me levanto a comer algo", "Doy vueltas en la cama"),
					"What do you do when you can't sleep?", List.of("Look at my phone", "Read for a bit", "Get up for a snack", "Toss and turn")),
			q("¿Qué tipo de vacaciones prefieres?", List.of("Todo planeado", "Improvisar sobre la marcha", "Descansar sin hacer nada", "Muchas actividades"),
					"What kind of vacation do you prefer?", List.of("Everything planned", "Improvise as we go", "Rest and do nothing", "Lots of activities")),
			q("¿Qué valoras más en una amistad?", List.of("La lealtad", "El humor", "La sinceridad", "Que esté en los malos momentos"),
					"What do you value most in a friendship?", List.of("Loyalty", "Humor", "Honesty", "Being there in hard times")),
			q("¿Qué época te hubiera gustado vivir?", List.of("Los años 80", "Los años 90", "El futuro", "Prefiero la de ahora"),
					"Which era would you have liked to live in?", List.of("The 80s", "The 90s", "The future", "I like today best")),
			q("¿Qué te da más vergüenza?", List.of("Tropezar en público", "Que me canten el cumpleaños", "Equivocarme de nombre", "Llegar tarde"),
					"What embarrasses you the most?", List.of("Tripping in public", "People singing me happy birthday", "Getting a name wrong", "Being late")),
			q("¿Cuál es tu comida de consuelo?", List.of("Algo casero", "Comida rápida", "Algo dulce", "Una sopa calentita"),
					"What is your comfort food?", List.of("Something homemade", "Fast food", "Something sweet", "A warm soup")),
			q("¿Cómo te gusta pasar una noche lluviosa?", List.of("Con mantas y una peli", "Cocinando algo rico", "Durmiendo temprano", "Escuchando la lluvia"),
					"How do you like to spend a rainy night?", List.of("Blankets and a movie", "Cooking something good", "Going to bed early", "Listening to the rain")),
			q("¿Qué es lo primero que notas en alguien?", List.of("La sonrisa", "Los ojos", "La forma de hablar", "El estilo"),
					"What do you notice first in someone?", List.of("Their smile", "Their eyes", "The way they talk", "Their style")),
			q("¿Qué app usas más?", List.of("Mensajes", "Redes sociales", "Música", "Videos"),
					"Which app do you use the most?", List.of("Messaging", "Social media", "Music", "Videos")),
			q("¿Qué harías en una tarde a solas?", List.of("Ver algo que me gusta", "Salir a dar una vuelta", "Dormir una siesta", "Hacer algo creativo"),
					"What would you do on an afternoon alone?", List.of("Watch something I like", "Go out for a stroll", "Take a nap", "Do something creative")),
			q("¿Qué plan te gustaría que hiciéramos pronto?", List.of("Un viaje", "Cocinar algo nuevo", "Una noche de baile", "Un día sin celulares"),
					"Which plan would you like us to do soon?", List.of("A trip", "Cook something new", "A night of dancing", "A phone-free day")),
			q("¿Qué te cuesta más perdonar?", List.of("Una mentira", "Que me ignoren", "Una promesa rota", "Que se burlen de mí"),
					"What is hardest for you to forgive?", List.of("A lie", "Being ignored", "A broken promise", "Being made fun of")),
			q("¿Qué color te define?", List.of("Rojo", "Azul", "Verde", "Negro"),
					"Which color defines you?", List.of("Red", "Blue", "Green", "Black")),
			q("¿Cómo eres cuando te enfermas?", List.of("Quiero mimos todo el tiempo", "Prefiero que me dejen tranquila/o", "Sigo como si nada", "Me pongo dramática/o"),
					"What are you like when you are sick?", List.of("I want cuddles all the time", "I prefer to be left alone", "I carry on as usual", "I get dramatic")),
			q("¿Qué te gustaría hacer de grande (o ya mismo)?", List.of("Viajar más", "Tener mi propio negocio", "Formar una familia", "Vivir cerca del mar"),
					"What would you like to do someday (or right now)?", List.of("Travel more", "Run my own business", "Start a family", "Live by the sea")),
			q("¿Qué canción cantarías en un karaoke?", List.of("Una balada romántica", "Un clásico de rock", "Algo para bailar", "Ninguna, solo aplaudo"),
					"What would you sing at karaoke?", List.of("A romantic ballad", "A rock classic", "Something to dance to", "None, I'll just clap")));
}
