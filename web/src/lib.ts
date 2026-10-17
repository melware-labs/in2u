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

// ---- Calendario mensual ----

export type MonthCell = { date: Date; dateKey: string; inMonth: boolean; isToday: boolean };

/** Grilla del mes con semanas de lunes a domingo (completa las semanas de los bordes). */
export function monthGrid(year: number, month: number, now: Date = new Date()): MonthCell[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay() === 0 ? -6 : 1 - first.getDay();
  const last = new Date(year, month + 1, 0);
  const endOffset = last.getDay() === 0 ? 0 : 7 - last.getDay();
  const todayKey = localIsoDate(now);
  const cells: MonthCell[] = [];
  for (let d = new Date(year, month, 1 + startOffset); d <= new Date(year, month, last.getDate() + endOffset); d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    const dateKey = localIsoDate(date);
    cells.push({ date, dateKey, inMonth: date.getMonth() === month, isToday: dateKey === todayKey });
  }
  return cells;
}

/** Fecha local desde "YYYY-MM-DD" (sin pasar por UTC, que corre el día). */
export function parseLocalDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Cantidad de días del mes (month 1-12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Días de calendario desde "YYYY-MM-DD" hasta hoy (local); 0 si es hoy. */
export function daysSince(dateKey: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // round: absorbe el día de 23 o 25 h de los cambios de horario.
  return Math.round((today.getTime() - parseLocalDate(dateKey).getTime()) / 86_400_000);
}

// ---- Ciclo ----

export type CyclePhase = 'menstrual' | 'folicular' | 'ovulacion' | 'lutea';

/**
 * Misma fórmula que CyclePhaseCalculator.java (el backend es la fuente de
 * verdad para "hoy" y para lo que ve la pareja); acá solo se usa para pintar
 * las fases en el calendario del ciclo. Los tests de los dos lados comparten
 * los mismos límites de fase: mantenerlos sincronizados.
 */
export function phaseForOffset(dayOfCycle0: number, cycleLength: number, periodLength: number): CyclePhase {
  const remaining = Math.max(cycleLength - periodLength, 1);
  const folicular = Math.round((remaining * 8) / 24);
  const ovulacion = Math.round((remaining * 4) / 24);
  if (dayOfCycle0 < periodLength) return 'menstrual';
  if (dayOfCycle0 < periodLength + folicular) return 'folicular';
  if (dayOfCycle0 < periodLength + folicular + ovulacion) return 'ovulacion';
  return 'lutea';
}

export type CycleCell = MonthCell & {
  /** null si el día es anterior al primer período registrado: no hay de dónde calcularla. */
  phase: CyclePhase | null;
  isRegisteredStart: boolean;
};

/**
 * Cada día toma como ancla el período registrado más reciente que empezó ese
 * día o antes (no se extrapola un período hacia atrás); para fechas futuras se
 * sigue extrapolando desde el último con la duración promedio.
 */
export function cycleGrid(
  year: number,
  month: number,
  periodStarts: string[],
  cycleLength: number,
  periodLength: number,
  now: Date = new Date(),
): CycleCell[] {
  const starts = [...periodStarts].sort();
  const startSet = new Set(starts);
  return monthGrid(year, month, now).map((cell) => {
    const anchorKey = [...starts].reverse().find((s) => s <= cell.dateKey);
    let phase: CyclePhase | null = null;
    if (anchorKey) {
      const days = Math.round((cell.date.getTime() - parseLocalDate(anchorKey).getTime()) / 86_400_000);
      phase = phaseForOffset(((days % cycleLength) + cycleLength) % cycleLength, cycleLength, periodLength);
    }
    return { ...cell, phase, isRegisteredStart: startSet.has(cell.dateKey) };
  });
}

/** Número de día local desde 1970: sirve para rotar contenido "del día" igual para los dos. */
export function dayNumber(now: Date = new Date()): number {
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
}

/** Elige el elemento del día de una lista, el mismo para toda la pareja. */
export function ofTheDay<T>(items: T[], now: Date = new Date()): T {
  return items[dayNumber(now) % items.length];
}

/**
 * Achica una foto en el navegador antes de subirla (lado mayor 1600 px, JPEG),
 * así pesa unos cientos de KB en vez de varios MB.
 */
export async function resizeImage(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', quality),
  );
}
