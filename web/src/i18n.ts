/**
 * Diccionario ES/EN mínimo (sin librería), portado de src/lib/i18n de la app
 * Expo. El idioma sale del navegador. Se agregan secciones a medida que se
 * portan las pantallas.
 */
const es = {
  loading: 'Cargando…',
  tabs: { nosotros: 'Nosotros', consejos: 'Consejos', perfil: 'Perfil' },
  login: {
    tagline: 'Un lugar para ustedes dos.',
    google: 'Continuar con Google',
    devTitle: 'Entrar sin Google (solo desarrollo)',
    email: 'Email',
    name: 'Nombre',
    enter: 'Entrar',
  },
  onboarding: {
    title: 'Vincula a tu pareja',
    subtitle: 'Crea un código y compártelo, o ingresa el que te dio tu pareja.',
    create: 'Crear mi código',
    haveCode: 'Ya tengo un código',
    codePlaceholder: 'CÓDIGO',
    join: 'Unirme',
    yourCode: 'Tu código',
    waiting: 'Compártelo con tu pareja. Cuando lo ingrese, ya estarán vinculados.',
    copy: 'Copiar',
    copied: 'Copiado',
    refresh: 'Ya lo ingresó',
  },
  nosotros: {
    checkInPrompt: '¿Cómo estás hoy?',
    notRegistered: 'sin registrar',
    tapToChoose: (partner: string) => `Toca para elegir — ${partner} lo ve al instante.`,
    partnerNoCheckinYet: (partner: string) => `${partner} todavía no registró su ánimo hoy.`,
    week: 'La semana',
    you: 'Tú',
    change: 'Cambiar',
    today: 'Hoy',
  },
  checkIn: {
    cancel: 'Cancelar',
    onePerDay: '1 por día',
    title: '¿Cómo estás hoy?',
    noteOptional: 'Nota — opcional',
    notePlaceholder: (partner: string) => `Una línea para ${partner}…`,
    shareWith: (partner: string) => `Compartir con ${partner}`,
    saving: 'Guardando…',
    saveError: 'No se pudo guardar el check-in.',
  },
  consejos: {
    title: 'Consejos',
    forToday: 'Para hoy',
    general: 'Siempre útiles',
    noneYet: 'Cuando tu pareja registre su ánimo, aquí aparece un consejo para hoy.',
  },
  perfil: {
    title: 'Perfil',
    account: 'Cuenta',
    coupleCode: 'Código de pareja',
    partner: 'Pareja',
    signOut: 'Cerrar sesión',
  },
  moods: { 6: 'De diez', 5: 'Bien', 4: 'Normal', 3: 'Cansancio', 2: 'Bajón', 1: 'Mal' } as Record<number, string>,
  weekdays: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  error: 'Algo salió mal. Intenta de nuevo.',
};

const en: typeof es = {
  loading: 'Loading…',
  tabs: { nosotros: 'Us', consejos: 'Tips', perfil: 'Profile' },
  login: {
    tagline: 'A place for the two of you.',
    google: 'Continue with Google',
    devTitle: 'Sign in without Google (development only)',
    email: 'Email',
    name: 'Name',
    enter: 'Sign in',
  },
  onboarding: {
    title: 'Link your partner',
    subtitle: 'Create a code and share it, or enter the one your partner gave you.',
    create: 'Create my code',
    haveCode: 'I have a code',
    codePlaceholder: 'CODE',
    join: 'Join',
    yourCode: 'Your code',
    waiting: 'Share it with your partner. Once they enter it, you are linked.',
    copy: 'Copy',
    copied: 'Copied',
    refresh: 'They entered it',
  },
  nosotros: {
    checkInPrompt: 'How are you today?',
    notRegistered: 'not logged',
    tapToChoose: (partner: string) => `Tap to choose — ${partner} sees it instantly.`,
    partnerNoCheckinYet: (partner: string) => `${partner} hasn't logged their mood today yet.`,
    week: 'This week',
    you: 'You',
    change: 'Change',
    today: 'Today',
  },
  checkIn: {
    cancel: 'Cancel',
    onePerDay: '1 per day',
    title: 'How are you today?',
    noteOptional: 'Note — optional',
    notePlaceholder: (partner: string) => `A line for ${partner}…`,
    shareWith: (partner: string) => `Share with ${partner}`,
    saving: 'Saving…',
    saveError: "Couldn't save the check-in.",
  },
  consejos: {
    title: 'Tips',
    forToday: 'For today',
    general: 'Always useful',
    noneYet: "When your partner logs their mood, a tip for today shows up here.",
  },
  perfil: {
    title: 'Profile',
    account: 'Account',
    coupleCode: 'Couple code',
    partner: 'Partner',
    signOut: 'Sign out',
  },
  moods: { 6: 'Great', 5: 'Good', 4: 'Okay', 3: 'Tired', 2: 'Low', 1: 'Bad' },
  weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  error: 'Something went wrong. Please try again.',
};

export type Locale = 'es' | 'en';
export const locale: Locale = navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
export const t = locale === 'en' ? en : es;

export const MOODS: { mood: number; emoji: string }[] = [
  { mood: 6, emoji: '😄' },
  { mood: 5, emoji: '🙂' },
  { mood: 4, emoji: '😐' },
  { mood: 3, emoji: '🥱' },
  { mood: 2, emoji: '😞' },
  { mood: 1, emoji: '😣' },
];

export const moodEmoji = (mood: number) => MOODS.find((m) => m.mood === mood)?.emoji ?? '·';
