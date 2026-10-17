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
