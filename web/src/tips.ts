/** Catálogo curado de consejos, portado de src/content/tips.ts. Las claves coinciden con TipCatalog.java. */
import { locale } from './i18n';

export type Tip = { key: string; kicker: string; title: string; body: string };

const ES: Tip[] = [
  {
    key: 'preguntar-antes-de-resolver',
    kicker: 'Escucha empática',
    title: 'Pregunta antes de resolver',
    body: '"¿Quieres que te escuche o que te ayude a resolverlo?". Sentirse entendido baja el estrés más rápido que cualquier solución.',
  },
  {
    key: 'avisar-cuando-volves',
    kicker: 'Base segura · teoría del apego',
    title: 'Avisa cuándo vuelves',
    body: 'La seguridad se construye en lo previsible: llegar cuando dijiste.',
  },
  {
    key: 'girar-hacia-lo-minimo',
    kicker: 'Intentos de conexión',
    title: 'Gira hacia lo mínimo',
    body: 'Un comentario al pasar es un pedido de atención. Responder a esos pedidos chicos predice la estabilidad.',
  },
  {
    key: 'volver-rapido',
    kicker: 'Reparación',
    title: 'Volver rápido, aunque sea torpe',
    body: 'Las parejas estables no discuten menos: vuelven antes. Alcanza con un "perdón, arranqué mal".',
  },
];

const EN: Tip[] = [
  {
    key: 'preguntar-antes-de-resolver',
    kicker: 'Empathic listening',
    title: 'Ask before you fix it',
    body: '"Do you want me to listen, or to help you solve it?". Feeling understood lowers stress faster than any solution.',
  },
  {
    key: 'avisar-cuando-volves',
    kicker: 'Secure base · attachment theory',
    title: "Say when you'll be back",
    body: "Security is built in what's predictable: arriving when you said.",
  },
  {
    key: 'girar-hacia-lo-minimo',
    kicker: 'Bids for connection',
    title: 'Turn toward the small stuff',
    body: 'An offhand remark is a request for attention. Answering those small bids predicts stability.',
  },
  {
    key: 'volver-rapido',
    kicker: 'Repair',
    title: 'Come back fast, even clumsily',
    body: "Stable couples don't argue less — they come back sooner. A \"sorry, I started badly\" is enough.",
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
