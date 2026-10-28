import { locale } from '../lib/i18n';

/**
 * Preguntas del juego "¿Cuánto me conoces?": cada una con 4 opciones. La
 * clave se guarda en el backend, así que no se cambia una vez publicada (sí
 * el texto). Agregar preguntas nuevas al final.
 */
export type GameQuestion = { key: string; text: string; options: [string, string, string, string] };

const GAME_ES: GameQuestion[] = [
  { key: 'plan_ideal', text: '¿Cuál es tu plan ideal para un sábado?', options: ['Quedarnos en casa con una peli', 'Salir a comer algo rico', 'Una escapada al aire libre', 'Juntarnos con amigos'] },
  { key: 'comida', text: '¿Qué comida elegirías para siempre?', options: ['Pizza', 'Sushi', 'Pasta', 'Tacos'] },
  { key: 'viaje', text: '¿A dónde te irías de viaje mañana?', options: ['A la playa', 'A la montaña', 'A una gran ciudad', 'A un pueblito tranquilo'] },
  { key: 'mimo', text: '¿Qué te hace sentir más querida/o?', options: ['Palabras bonitas', 'Abrazos y mimos', 'Que me ayuden con algo', 'Un regalito sorpresa'] },
  { key: 'manana_noche', text: '¿Eres más de mañana o de noche?', options: ['De mañana, sin dudas', 'De noche, siempre', 'Depende del día', 'Ni lo uno ni lo otro: de siesta'] },
  { key: 'superpoder', text: 'Si pudieras tener un superpoder, ¿cuál sería?', options: ['Volar', 'Teletransportarme', 'Leer mentes', 'Detener el tiempo'] },
  { key: 'mal_dia', text: 'Cuando tienes un mal día, ¿qué necesitas?', options: ['Que me escuchen', 'Estar un rato a solas', 'Distraerme con algo', 'Un abrazo largo'] },
  { key: 'peli', text: '¿Qué tipo de película eliges?', options: ['Comedia', 'Romántica', 'Terror o suspenso', 'Acción o aventura'] },
  { key: 'mascota', text: '¿Qué mascota tendrías?', options: ['Un perro', 'Un gato', 'Algo exótico', 'Ninguna, gracias'] },
  { key: 'cita', text: '¿Cuál sería tu cita soñada?', options: ['Cena romántica con velas', 'Picnic al atardecer', 'Concierto o festival', 'Noche de juegos en casa'] },
  { key: 'bebida', text: '¿Con qué arrancas el día?', options: ['Café', 'Té o mate', 'Jugo o licuado', 'Agua y listo'] },
  { key: 'estacion', text: '¿Cuál es tu estación favorita?', options: ['Primavera', 'Verano', 'Otoño', 'Invierno'] },
  { key: 'enojo', text: 'Cuando te enojas, ¿qué haces?', options: ['Lo digo enseguida', 'Me quedo en silencio', 'Necesito tiempo y después hablo', 'Se me pasa rápido'] },
  { key: 'regalo', text: '¿Qué regalo te haría más ilusión?', options: ['Una experiencia juntos', 'Algo hecho a mano', 'Algo que necesito', 'Una carta'] },
  { key: 'musica', text: '¿Qué música no puede faltar?', options: ['Pop', 'Reggaetón o urbano', 'Rock', 'Baladas o románticas'] },
  { key: 'domingo', text: '¿Cómo es tu domingo perfecto?', options: ['Dormir hasta tarde', 'Desayuno largo y paseo', 'Hacer deporte', 'Series todo el día'] },
  { key: 'miedo', text: '¿Qué te da más miedo?', options: ['Las alturas', 'Los insectos', 'La oscuridad', 'Hablar en público'] },
  { key: 'futuro', text: 'En 5 años, ¿dónde te imaginas?', options: ['En la misma ciudad', 'Viviendo en otro país', 'En una casa con jardín', 'Viajando por el mundo'] },
  { key: 'postre', text: '¿Qué postre eliges?', options: ['Helado', 'Chocolate', 'Torta o pastel', 'Fruta'] },
  { key: 'cumplido', text: '¿Qué cumplido te gusta más?', options: ['Que soy linda/o', 'Que soy inteligente', 'Que soy divertida/o', 'Que soy buena persona'] },
];

const GAME_EN: GameQuestion[] = [
  { key: 'plan_ideal', text: 'What is your ideal Saturday plan?', options: ['Stay home with a movie', 'Go out for good food', 'An outdoor getaway', 'Hang out with friends'] },
  { key: 'comida', text: 'Which food would you pick forever?', options: ['Pizza', 'Sushi', 'Pasta', 'Tacos'] },
  { key: 'viaje', text: 'Where would you travel tomorrow?', options: ['The beach', 'The mountains', 'A big city', 'A quiet little town'] },
  { key: 'mimo', text: 'What makes you feel most loved?', options: ['Sweet words', 'Hugs and cuddles', 'Help with something', 'A surprise gift'] },
  { key: 'manana_noche', text: 'Are you a morning or a night person?', options: ['Morning, for sure', 'Night, always', 'Depends on the day', 'Neither: nap person'] },
  { key: 'superpoder', text: 'If you could have a superpower, what would it be?', options: ['Flying', 'Teleporting', 'Reading minds', 'Stopping time'] },
  { key: 'mal_dia', text: 'On a bad day, what do you need?', options: ['Someone to listen', 'Some time alone', 'A distraction', 'A long hug'] },
  { key: 'peli', text: 'What kind of movie do you pick?', options: ['Comedy', 'Romance', 'Horror or thriller', 'Action or adventure'] },
  { key: 'mascota', text: 'Which pet would you have?', options: ['A dog', 'A cat', 'Something exotic', 'None, thanks'] },
  { key: 'cita', text: 'What would your dream date be?', options: ['Candlelit dinner', 'Sunset picnic', 'Concert or festival', 'Game night at home'] },
  { key: 'bebida', text: 'How do you start your day?', options: ['Coffee', 'Tea', 'Juice or smoothie', 'Just water'] },
  { key: 'estacion', text: 'What is your favorite season?', options: ['Spring', 'Summer', 'Autumn', 'Winter'] },
  { key: 'enojo', text: 'When you get angry, what do you do?', options: ['Say it right away', 'Go quiet', 'Need time, then talk', 'Get over it fast'] },
  { key: 'regalo', text: 'Which gift would excite you most?', options: ['An experience together', 'Something handmade', 'Something I need', 'A letter'] },
  { key: 'musica', text: 'Which music is a must?', options: ['Pop', 'Reggaeton or urban', 'Rock', 'Ballads'] },
  { key: 'domingo', text: 'What is your perfect Sunday like?', options: ['Sleep in', 'Long breakfast and a walk', 'Work out', 'Series all day'] },
  { key: 'miedo', text: 'What scares you most?', options: ['Heights', 'Bugs', 'The dark', 'Public speaking'] },
  { key: 'futuro', text: 'In 5 years, where do you see yourself?', options: ['Same city', 'Living abroad', 'A house with a garden', 'Traveling the world'] },
  { key: 'postre', text: 'Which dessert do you pick?', options: ['Ice cream', 'Chocolate', 'Cake', 'Fruit'] },
  { key: 'cumplido', text: 'Which compliment do you like most?', options: ["That I'm good-looking", "That I'm smart", "That I'm fun", "That I'm a good person"] },
];

export const GAME_QUESTIONS: GameQuestion[] = locale === 'en' ? GAME_EN : GAME_ES;
export const gameQuestion = (key: string) => GAME_QUESTIONS.find((q) => q.key === key);

/** Preguntas para conversar: una por día, la misma para los dos. */
const DAILY_ES = [
  '¿Cuál es tu recuerdo favorito de nosotros?',
  '¿Qué fue lo primero que te gustó de mí?',
  'Si pudiéramos repetir un día juntos, ¿cuál sería?',
  '¿Qué sueño te gustaría que cumpliéramos juntos?',
  '¿Qué canción te hace pensar en mí?',
  '¿Qué es algo pequeño que hago y te alegra el día?',
  '¿A qué lugar del mundo te gustaría ir conmigo?',
  '¿Qué aprendiste de ti desde que estamos juntos?',
  '¿Cuál fue el momento en que supiste que me querías?',
  '¿Qué te gustaría que hiciéramos más seguido?',
  '¿Qué tradición te gustaría que tuviéramos como pareja?',
  '¿Qué te hace reír siempre, aunque estés de mal humor?',
  '¿Cómo te imaginas nuestra vida en diez años?',
  '¿Qué es lo que más valoras de nuestra relación?',
  '¿Hay algo que te preocupe y no me hayas contado?',
  '¿Cuál fue la mejor cita que tuvimos?',
  '¿Qué película o serie te gustaría ver conmigo?',
  '¿Qué cosa nueva te gustaría que probáramos juntos?',
  '¿Qué te gustaría que te dijera más seguido?',
  'Si escribieras un libro sobre nosotros, ¿cómo se llamaría?',
  '¿Qué comida te recuerda a tu infancia?',
  '¿Cuál es tu forma favorita de pasar un día de lluvia juntos?',
  '¿De qué estás orgullosa/o esta semana?',
  '¿Qué meta personal te gustaría que te ayudara a cumplir?',
  '¿Qué es algo que nunca te animaste a hacer?',
  '¿Qué tres palabras nos describen como pareja?',
  '¿Cuál es tu manera favorita de recibir cariño?',
  '¿Qué momento de hoy te gustaría contarme?',
  '¿Qué te gustaría celebrar juntos este mes?',
  '¿Cuál es la aventura más loca que te gustaría vivir conmigo?',
];

const DAILY_EN = [
  'What is your favorite memory of us?',
  'What was the first thing you liked about me?',
  'If we could relive one day together, which would it be?',
  'Which dream would you like us to make come true together?',
  'Which song makes you think of me?',
  'What small thing do I do that makes your day?',
  'Where in the world would you like to go with me?',
  'What have you learned about yourself since we got together?',
  'When did you know you loved me?',
  'What would you like us to do more often?',
  'Which tradition would you like us to have as a couple?',
  'What always makes you laugh, even in a bad mood?',
  'How do you picture our life in ten years?',
  'What do you value most about our relationship?',
  "Is there something worrying you that you haven't told me?",
  'What was the best date we ever had?',
  'Which movie or series would you like to watch with me?',
  'What new thing would you like us to try together?',
  'What would you like me to tell you more often?',
  'If you wrote a book about us, what would it be called?',
  'Which food reminds you of your childhood?',
  'What is your favorite way to spend a rainy day together?',
  'What are you proud of this week?',
  'Which personal goal would you like my help with?',
  "What is something you've never dared to do?",
  'Which three words describe us as a couple?',
  'What is your favorite way to receive affection?',
  'Which moment from today would you like to tell me about?',
  'What would you like us to celebrate this month?',
  'What is the craziest adventure you would like to have with me?',
];

export const DAILY_QUESTIONS: string[] = locale === 'en' ? DAILY_EN : DAILY_ES;
