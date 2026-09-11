/**
 * Diccionario ES — objeto anidado tipado, sin librería de i18n (son 2
 * idiomas, ver tasks/todo.md Fase F). `en.ts` debe tener exactamente esta
 * forma (`typeof es`), chequeado en compile-time.
 */
export const es = {
  tabs: {
    nosotros: 'Nosotros',
    calendario: 'Calendario',
    consejos: 'Consejos',
    ciclo: 'Ciclo',
    perfil: 'Perfil',
  },

  format: {
    justNow: 'recién',
    minutesAgo: (n: number) => `hace ${n} min`,
    hoursAgo: (n: number) => `hace ${n} h`,
    daysAgo: (n: number) => `hace ${n} d`,
  },

  nosotros: {
    linkPartnerHint: 'Vincula a tu pareja desde tu perfil para empezar a compartir el ánimo del día.',
    partnerNoCheckinYet: (partner: string) => `${partner} todavía no registró su ánimo hoy.`,
    noPartnerYet: 'Todavía no tienes pareja vinculada.',
    checkInPrompt: '¿Cómo estás hoy?',
    notRegistered: 'sin registrar',
    tapToChoose: (partner: string) => `Toca para elegir — ${partner} lo ve al instante.`,
    week: 'La semana',
    howToCareForHer: 'Cómo cuidarla estos días',
    cycleOf: (partner: string, phase: string) => `Ciclo de ${partner} · ${phase}`,
    dayOfCycle: (n: number) => `día ${n}`,
    cycleArrivingSoon: 'Le puede arrancar en cualquier momento',
    cycleArrivingIn: (n: number) => `Le puede arrancar en ${n} días`,
    cycleCareHint: 'Estos días suele tener menos energía y dormir peor. No es su humor: es el ciclo.',
    cycleShared: (partner: string) => `${partner} eligió compartir la fase contigo`,
    cycleCareMode: (partner: string) => `Cuida un poco más a ${partner} estos días.`,
  },

  checkIn: {
    cancel: 'Cancelar',
    onePerDay: '1 por día',
    title: '¿Cómo estás\nhoy?',
    chosen: 'elegido',
    noteOptional: 'Nota — opcional',
    notePlaceholder: (partner: string) => `Una línea para ${partner}…`,
    shareWith: (partner: string) => `Compartir con ${partner}`,
    deliveredNow: 'Le llega ahora, incluso con la app cerrada.',
    saveError: 'No se pudo guardar el check-in.',
  },

  calendario: {
    month: 'Mes',
    agenda: 'Agenda',
    you: 'Yo',
    bothOfUs: 'Los dos',
    noEvents: 'Sin eventos.',
    noEventsInRange: (days: number) => `Sin eventos en los próximos ${days} días.`,
  },

  newEvent: {
    new: 'Nuevo',
    titlePlaceholder: 'Título del evento',
    when: 'Cuándo',
    duration: 'Dura',
    repeat: 'Repetir',
    never: 'Nunca',
    visibleFor: 'Visible para',
    onlyMe: 'Solo yo',
    bothOfUs: 'Los dos',
    partnerSeesIt: (partner: string) => `${partner} lo ve en su calendario.`,
    onlyYouSeeIt: 'Solo tú lo vas a ver.',
    googleCalendar: 'Google Calendar',
    googleSyncHint: (email: string) => `Escribir también en ${email}`,
    googleSyncHintGeneric: 'Escribir también en tu Google Calendar',
    save: 'Guardar evento',
    saving: 'Guardando…',
    saveError: 'No se pudo guardar el evento.',
  },

  consejos: {
    title: 'Consejos',
    forToday: 'Para hoy',
    ritualOfWeek: 'Ritual de la semana —',
  },

  ciclo: {
    title: 'Ciclo',
    notRegisteredYet: 'Todavía no registraste tu último período.',
    startedToday: 'Empezó hoy',
    logAgain: '¿Te vino hoy? Registrar inicio',
    registerToday: 'Registrar hoy',
    nextPeriod: 'Próximo período',
    inDays: (n: number) => `en ${n} ${n === 1 ? 'día' : 'días'}`,
    fertileWindow: 'Ventana fértil',
    whatPartnerSees: (partner: string) => `Qué ve ${partner}`,
    privacyHint: 'Nunca ve lo que registras en detalle — solo la fase y los avisos que eliges.',
    disclaimer: 'Estimado a partir de la duración promedio de tu ciclo. No sirve como método anticonceptivo.',
    phases: {
      menstrual: 'Menstruación',
      folicular: 'Fase folicular',
      ovulacion: 'Ovulación',
      lutea: 'Fase lútea',
    },
    symptoms: {
      dolor: 'Dolor',
      sangrado: 'Sangrado',
      sin_energia: 'Sin energía',
      antojos: 'Antojos',
      insomnio: 'Insomnio',
    },
    visibility: {
      nada: 'Nada',
      avisos: 'Solo avisos',
      fase_y_avisos: 'Fase y avisos',
    },
  },

  perfil: {
    title: 'Perfil',
    account: 'Cuenta',
    coupleCode: 'Código de pareja',
    signOut: 'Cerrar sesión',
  },
};

export type Dictionary = typeof es;
