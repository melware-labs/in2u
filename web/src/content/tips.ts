/** Catálogo curado de consejos, portado de src/content/tips.ts. Las claves coinciden con TipCatalog.java. */
import { locale } from '../lib/i18n';

export type Tip = { key: string; kicker: string; title: string; body: string };

const ES: Tip[] = [
  {
    key: "preguntar-antes-de-resolver",
    kicker: "Escucha",
    title: "Pregunta antes de resolver",
    body: "\"¿Quieres que te escuche o que te ayude a resolverlo?\". Sentirse entendido baja el estrés más rápido que cualquier solución.",
  },
  {
    key: "ofrecer-compania",
    kicker: "Cuidado",
    title: "Acompaña sin presionar",
    body: "En un día pesado, estar cerca vale más que las palabras. Un abrazo o una infusión dicen que no está sola o solo.",
  },
  {
    key: "quitar-una-tarea",
    kicker: "Cuidado",
    title: "Quítale una tarea de encima",
    body: "Cuando alguien está agotado, resolver algo concreto sin que lo pida es una forma clara de decir que te importa.",
  },
  {
    key: "mensaje-sin-pregunta",
    kicker: "Cercanía",
    title: "Un mensaje sin pedir nada",
    body: "Un cariño que no exige respuesta no suma presión y deja saber que piensas en esa persona.",
  },
  {
    key: "avisar-cuando-volves",
    kicker: "Confianza",
    title: "Avisa cuándo llegas",
    body: "La seguridad se construye en lo previsible: llegar cuando dijiste.",
  },
  {
    key: "plan-sencillo",
    kicker: "Tiempo juntos",
    title: "Propón un plan sencillo",
    body: "Con poca energía, lo mejor es lo fácil: cenar tranquilos o ver algo juntos, sin exigencias.",
  },
  {
    key: "preguntar-como-esta-de-verdad",
    kicker: "Escucha",
    title: "Pregunta cómo está de verdad",
    body: "Un cómo estás con tiempo para responder, sin interrumpir, abre la puerta a contar lo que pesa.",
  },
  {
    key: "volver-rapido",
    kicker: "Reconciliación",
    title: "Acércate pronto, aunque sea torpe",
    body: "Las parejas estables no discuten menos: vuelven antes. Basta con un \"perdón, empecé mal\".",
  },
  {
    key: "celebrar-mejoria",
    kicker: "Cercanía",
    title: "Nota que va mejor",
    body: "Cuando alguien sale de un mal momento, que lo noten con cariño ayuda a que se sienta acompañado.",
  },
  {
    key: "girar-hacia-lo-minimo",
    kicker: "Atención diaria",
    title: "Responde a los detalles pequeños",
    body: "Un comentario al pasar, como un \"mira esto\", es una invitación a conectar. Responderlas predice relaciones estables.",
  },
  {
    key: "compartir-alegria",
    kicker: "Celebrar",
    title: "Celebra lo bueno juntos",
    body: "Interesarse por las alegrías del otro une tanto como acompañar en los malos ratos.",
  },
  {
    key: "proponer-algo-lindo",
    kicker: "Tiempo juntos",
    title: "Propón algo que les guste a los dos",
    body: "Los días buenos son ideales para crear recuerdos juntos, aunque sea un paseo corto.",
  },
  {
    key: "pequeno-detalle",
    kicker: "Atención diaria",
    title: "Un detalle sin motivo",
    body: "Pequeños gestos sin ocasión especial mantienen viva la relación entre las grandes fechas.",
  },
  {
    key: "preguntar-algo-concreto",
    kicker: "Escucha",
    title: "Haz una pregunta concreta",
    body: "Preguntar cuál fue lo mejor del día da mejores conversaciones que un cómo estás general.",
  },
  {
    key: "tiempo-sin-pantallas",
    kicker: "Tiempo juntos",
    title: "Diez minutos sin pantallas",
    body: "Diez minutos de atención completa valen más que una tarde juntos con el móvil en la mano.",
  },
];

const EN: Tip[] = [
  {
    key: "preguntar-antes-de-resolver",
    kicker: "Listening",
    title: "Ask before you fix it",
    body: "\"Do you want me to listen, or to help you solve it?\". Feeling understood lowers stress faster than any solution.",
  },
  {
    key: "ofrecer-compania",
    kicker: "Care",
    title: "Be there without pushing",
    body: "On a heavy day, being close says more than words. A hug or a hot drink tells them they are not alone.",
  },
  {
    key: "quitar-una-tarea",
    kicker: "Care",
    title: "Take one chore off their plate",
    body: "When someone is worn out, solving something concrete without being asked is a clear way to say you care.",
  },
  {
    key: "mensaje-sin-pregunta",
    kicker: "Closeness",
    title: "A message that asks for nothing",
    body: "A kind note that doesn't need an answer adds no pressure and shows you are thinking of them.",
  },
  {
    key: "avisar-cuando-volves",
    kicker: "Trust",
    title: "Say when you'll be back",
    body: "Security is built in what's predictable: arriving when you said.",
  },
  {
    key: "plan-sencillo",
    kicker: "Time together",
    title: "Suggest an easy plan",
    body: "With low energy, easy wins: a quiet dinner or watching something together, no demands.",
  },
  {
    key: "preguntar-como-esta-de-verdad",
    kicker: "Listening",
    title: "Ask how they really are",
    body: "A real how are you, with time to answer and no interrupting, opens the door to what is weighing on them.",
  },
  {
    key: "volver-rapido",
    kicker: "Repair",
    title: "Come back soon, even clumsily",
    body: "Stable couples don't argue less; they come back sooner. A \"sorry, I started badly\" is enough.",
  },
  {
    key: "celebrar-mejoria",
    kicker: "Closeness",
    title: "Notice they're doing better",
    body: "When someone comes out of a bad stretch, being noticed kindly helps them feel supported.",
  },
  {
    key: "girar-hacia-lo-minimo",
    kicker: "Daily attention",
    title: "Answer the small things",
    body: "An offhand remark like \"look at this\" is an invitation to connect. Answering them predicts stable relationships.",
  },
  {
    key: "compartir-alegria",
    kicker: "Celebrate",
    title: "Celebrate the good together",
    body: "Showing interest in someone's happy moments bonds as much as supporting the hard ones.",
  },
  {
    key: "proponer-algo-lindo",
    kicker: "Time together",
    title: "Suggest something you both enjoy",
    body: "Good days are ideal for making memories together, even a short walk.",
  },
  {
    key: "pequeno-detalle",
    kicker: "Daily attention",
    title: "A small gesture for no reason",
    body: "Little gestures with no occasion keep the relationship alive between the big dates.",
  },
  {
    key: "preguntar-algo-concreto",
    kicker: "Listening",
    title: "Ask something specific",
    body: "Asking what the best part of the day was gives better conversations than a general how are you.",
  },
  {
    key: "tiempo-sin-pantallas",
    kicker: "Time together",
    title: "Ten minutes without screens",
    body: "Ten minutes of full attention beat a whole afternoon together with a phone in hand.",
  },
];

export const TIPS: Tip[] = locale === 'en' ? EN : ES;
export const tipByKey = (key: string) => TIPS.find((t) => t.key === key);

export type CareTip = { key: string; title: string; body: string };

const CARE_ES: CareTip[] = [
  { key: 'carga-invisible', title: 'Baja la carga invisible', body: 'Ocúpate de la cena y de los mandados estos días, sin que ella tenga que pedirlo.' },
  { key: 'ofrecer-no-diagnosticar', title: 'Ofrece, no diagnostiques', body: '"¿Quieres que salgamos o prefieres quedarte?" funciona mejor que "estás así por el ciclo".' },
  { key: 'contacto-fisico', title: 'Contacto físico tranquilo', body: 'Calor y cercanía sin agenda: baja el dolor y el estrés más que cualquier consejo.' },
];

const CARE_EN: CareTip[] = [
  { key: 'carga-invisible', title: 'Lighten the invisible load', body: 'Take care of dinner and errands these days, without her having to ask.' },
  { key: 'ofrecer-no-diagnosticar', title: "Offer, don't diagnose", body: '"Do you want to go out or would you rather stay in?" works better than "you\'re like this because of your cycle".' },
  { key: 'contacto-fisico', title: 'Calm physical touch', body: 'Warmth and closeness with no agenda lowers pain and stress more than any advice.' },
];

export const CARE_TIPS: CareTip[] = locale === 'en' ? CARE_EN : CARE_ES;
