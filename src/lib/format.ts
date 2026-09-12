import type { Locale } from '@/lib/i18n';

const WEEKDAY_LETTERS: Record<Locale, string[]> = {
  es: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};

/** `Intl`/`toLocaleDateString` no entiende nuestros códigos de 2 letras solos. */
export const INTL_LOCALE: Record<Locale, string> = { es: 'es-AR', en: 'en-US' };

/** "mar 1 sep" */
export function formatDayHeader(locale: Locale = 'es', date: Date = new Date()): string {
  return date
    .toLocaleDateString(INTL_LOCALE[locale], { weekday: 'short', day: 'numeric', month: 'short' })
    .replace('.', '');
}

type RelativeTimeStrings = {
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo: (n: number) => string;
};

/** "hace 20 min" / "hace 3 h" / "hace 2 d" (o su equivalente en inglés) — labels via t.format. */
export function formatRelativeTime(iso: string, t: RelativeTimeStrings): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return t.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.hoursAgo(hours);
  const days = Math.floor(hours / 24);
  return t.daysAgo(days);
}

/** Lunes a domingo de la semana que contiene `date`, como Date[] de 7 elementos. */
export function currentWeekDays(date: Date = new Date()): Date[] {
  const day = date.getDay(); // 0 = domingo
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function weekdayLetter(date: Date, locale: Locale = 'es'): string {
  return WEEKDAY_LETTERS[locale][date.getDay()];
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Igual que `toDateKey`, pero en el día calendario LOCAL en vez del día en
 * UTC — `toDateKey` corta el `Date` a las 10 primeras letras de su ISO
 * string, que está en UTC, así que cerca de la medianoche local (ej. desde
 * las 21hs en Argentina, UTC-3) devuelve el día siguiente. Usar esta
 * versión para todo lo que el usuario percibe como "el calendario de su
 * teléfono" (el ciclo, `src/lib/cycle.ts` y `cycle-grid.ts`) — no para
 * `mood_checkins`, cuyo `checkin_date` lo genera Postgres a partir de
 * `created_at at time zone 'utc'`: ahí el cliente tiene que seguir
 * calculando en UTC para no desalinearse con esa columna generada.
 */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
