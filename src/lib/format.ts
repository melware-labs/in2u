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
