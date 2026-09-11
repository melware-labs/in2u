import { toDateKey } from '@/lib/format';
import type { CoupleEvent } from '@/lib/couple-events';

/**
 * Cómo se pinta un evento en la grilla/agenda. Solo existen estas tres
 * combinaciones porque la RLS de `couple_events` nunca deja ver un evento
 * "solo_yo" ajeno: si el dueño no soy yo, siempre es "los_dos" (bordered).
 */
export type EventBadgeKind = 'solid' | 'bordered' | 'pill';

export function eventBadgeKind(event: CoupleEvent, ownUserId: string | undefined): EventBadgeKind {
  if (!ownUserId || event.owner_id !== ownUserId) return 'bordered';
  return event.visibility === 'los_dos' ? 'pill' : 'solid';
}

/** Agrupa eventos por día calendario (según `starts_at`, hora local). */
export function groupEventsByDay(events: CoupleEvent[]): Map<string, CoupleEvent[]> {
  const map = new Map<string, CoupleEvent[]>();
  for (const event of events) {
    const key = toDateKey(new Date(event.starts_at));
    const list = map.get(key);
    if (list) list.push(event);
    else map.set(key, [event]);
  }
  return map;
}

/**
 * Rango [start, end) que cubre la grilla mensual visible: primer lunes
 * anterior o igual al día 1 del mes, hasta el domingo posterior o igual al
 * último día — mismo criterio "lunes primero" que `currentWeekDays()` de
 * `format.ts`. `end` es exclusivo, listo para pasar a `listEventsInRange`.
 */
export function getMonthGridRange(year: number, month: number): { start: Date; end: Date } {
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay(); // 0 = domingo
  const startOffset = firstWeekday === 0 ? -6 : 1 - firstWeekday;
  const start = new Date(year, month, 1 + startOffset);
  start.setHours(0, 0, 0, 0);

  const last = new Date(year, month + 1, 0);
  const lastWeekday = last.getDay();
  const endOffset = lastWeekday === 0 ? 0 : 7 - lastWeekday;
  const end = new Date(year, month, last.getDate() + endOffset + 1); // +1: exclusivo
  end.setHours(0, 0, 0, 0);

  return { start, end };
}

export type CalendarDayCell = {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  badges: { solid: boolean; bordered: boolean; pill: boolean };
};

export function buildMonthGrid(params: {
  year: number;
  month: number; // 0-11
  events: CoupleEvent[];
  ownUserId: string | undefined;
  selectedDateKey?: string;
}): CalendarDayCell[] {
  const { year, month, events, ownUserId, selectedDateKey } = params;
  const { start, end } = getMonthGridRange(year, month);
  const byDay = groupEventsByDay(events);
  const todayKey = toDateKey(new Date());

  const cells: CalendarDayCell[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    const dateKey = toDateKey(date);
    const dayEvents = byDay.get(dateKey) ?? [];
    const badges = { solid: false, bordered: false, pill: false };
    for (const event of dayEvents) {
      badges[eventBadgeKind(event, ownUserId)] = true;
    }
    cells.push({
      date,
      dateKey,
      inCurrentMonth: date.getMonth() === month,
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedDateKey,
      badges,
    });
  }
  return cells;
}
