import type { Checkin } from './api';

/** YYYY-MM-DD con los componentes locales (no UTC): el "hoy" de quien mira. */
export function localIsoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export type WeekDay = { date: string; weekday: number; isToday: boolean; mine?: Checkin; partner?: Checkin };

/** Los últimos 7 días (el más antiguo primero) con el check-in de cada quien. */
export function weekDays(checkins: Checkin[], now: Date = new Date()): WeekDay[] {
  const days: WeekDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const date = localIsoDate(d);
    days.push({
      date,
      weekday: d.getDay(),
      isToday: i === 0,
      mine: checkins.find((c) => c.date === date && c.mine),
      partner: checkins.find((c) => c.date === date && !c.mine),
    });
  }
  return days;
}

export function firstName(name: string | null | undefined, fallback: string): string {
  const n = name?.trim().split(/\s+/)[0];
  return n || fallback;
}
