/**
 * Tips estáticos "Cómo cuidarla estos días" — mismo contenido para
 * cualquier fase en v1 (no depende de IA, a diferencia de src/content/tips.ts).
 */
export type CycleCareTip = {
  key: string;
  title: string;
  body: string;
};

export const CYCLE_CARE_TIPS_ES: CycleCareTip[] = [
  {
    key: 'carga-invisible',
    title: 'Bajá la carga invisible',
    body: 'Ocupate vos de la cena y de los mandados estos días, sin que lo tenga que pedir.',
  },
  {
    key: 'ofrecer-no-diagnosticar',
    title: 'Ofrecé, no diagnostiques',
    body: '"¿Querés que salgamos o preferís quedarte?" funciona mejor que "estás así por el ciclo".',
  },
  {
    key: 'contacto-fisico',
    title: 'Contacto físico tranquilo',
    body: 'Calor y cercanía sin agenda: baja el dolor y el estrés más que cualquier consejo.',
  },
];

export const CYCLE_CARE_TIPS_EN: CycleCareTip[] = [
  {
    key: 'carga-invisible',
    title: 'Lighten the invisible load',
    body: 'Take care of dinner and errands these days, without her having to ask.',
  },
  {
    key: 'ofrecer-no-diagnosticar',
    title: "Offer, don't diagnose",
    body: '"Do you want to go out or would you rather stay in?" works better than "you\'re like this because of your cycle".',
  },
  {
    key: 'contacto-fisico',
    title: 'Calm physical touch',
    body: 'Warmth and closeness with no agenda lowers pain and stress more than any advice.',
  },
];
