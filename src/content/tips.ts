/**
 * Catálogo curado de consejos de pareja. `key` es lo que guarda
 * `daily_tips.tip_key` (elegido por la Edge Function `analyze-checkin`) y
 * también lo que renderiza la lista general de la pantalla Consejos.
 */
export type Tip = {
  key: string;
  kicker: string;
  title: string;
  body: string;
  attribution: string;
};

export const TIPS_ES: Tip[] = [
  {
    key: 'preguntar-antes-de-resolver',
    kicker: 'Escucha empática',
    title: 'Preguntá antes de resolver',
    body: '"¿Querés que te escuche o que te ayude a resolverlo?". Sentirse entendido baja el estrés más rápido que cualquier solución.',
    attribution: 'Escucha empática · investigación Gottman',
  },
  {
    key: 'avisar-cuando-volves',
    kicker: 'Base segura · teoría del apego',
    title: 'Avisá cuándo volvés',
    body: 'La seguridad se construye en lo previsible: llegar cuando dijiste.',
    attribution: 'Base segura · teoría del apego',
  },
  {
    key: 'girar-hacia-lo-minimo',
    kicker: 'Intentos de conexión',
    title: 'Girá hacia lo mínimo',
    body: 'Un comentario al pasar es un pedido de atención. Responder a esos pedidos chicos predice la estabilidad.',
    attribution: 'Intentos de conexión',
  },
  {
    key: 'volver-rapido',
    kicker: 'Reparación',
    title: 'Volver rápido, aunque sea torpe',
    body: 'Las parejas estables no discuten menos: vuelven antes. Alcanza con un "perdón, arranqué mal".',
    attribution: 'Reparación',
  },
];

export const TIPS_EN: Tip[] = [
  {
    key: 'preguntar-antes-de-resolver',
    kicker: 'Empathic listening',
    title: 'Ask before you fix it',
    body: '"Do you want me to listen, or to help you solve it?". Feeling understood lowers stress faster than any solution.',
    attribution: 'Empathic listening · Gottman research',
  },
  {
    key: 'avisar-cuando-volves',
    kicker: 'Secure base · attachment theory',
    title: "Say when you'll be back",
    body: "Security is built in what's predictable: arriving when you said.",
    attribution: 'Secure base · attachment theory',
  },
  {
    key: 'girar-hacia-lo-minimo',
    kicker: 'Bids for connection',
    title: 'Turn toward the small stuff',
    body: 'An offhand remark is a request for attention. Answering those small bids predicts stability.',
    attribution: 'Bids for connection',
  },
  {
    key: 'volver-rapido',
    kicker: 'Repair',
    title: 'Come back fast, even clumsily',
    body: "Stable couples don't argue less — they come back sooner. A \"sorry, I started badly\" is enough.",
    attribution: 'Repair',
  },
];

export function tipByKey(key: string, locale: 'es' | 'en' = 'es'): Tip | undefined {
  return (locale === 'en' ? TIPS_EN : TIPS_ES).find((t) => t.key === key);
}

export type WeeklyRitual = { title: string; subtitle: string };

const WEEKLY_RITUALS_ES: WeeklyRitual[] = [
  { title: '20 min sin pantallas', subtitle: 'Nada de logística. Elijan un momento este fin de semana.' },
  { title: 'Una caminata sin destino', subtitle: 'Sin apuro, sin agenda — solo caminar y hablar.' },
  { title: 'Cocinar algo nuevo juntos', subtitle: 'Elijan una receta que ninguno de los dos probó antes.' },
];

const WEEKLY_RITUALS_EN: WeeklyRitual[] = [
  { title: '20 min with no screens', subtitle: 'No logistics. Pick a moment this weekend.' },
  { title: 'A walk with no destination', subtitle: 'No rush, no agenda — just walking and talking.' },
  { title: 'Cook something new together', subtitle: "Pick a recipe neither of you has tried before." },
];

/** Rotación determinística por semana del año — sin librería de fechas. */
function weekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return Math.floor(diffDays / 7);
}

export function weeklyRitual(locale: 'es' | 'en' = 'es', date: Date = new Date()): WeeklyRitual {
  const list = locale === 'en' ? WEEKLY_RITUALS_EN : WEEKLY_RITUALS_ES;
  return list[weekOfYear(date) % list.length];
}
