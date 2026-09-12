import { getMonthGridRange } from '@/lib/calendar-grid';
import { phaseForOffset, type CyclePhase } from '@/lib/cycle';
import { toLocalDateKey } from '@/lib/format';

export type CycleDayCell = {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  /** Día dentro de la ventana de sangrado de ALGÚN período registrado. */
  isPeriodDay: boolean;
  /** El día exacto en que se tocó "marcar período" (no solo parte de la ventana). */
  isRegisteredStart: boolean;
  /** null si el día es anterior al primer período registrado — no hay de dónde calcularla. */
  phase: CyclePhase | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Arma la grilla mensual del ciclo: para cada día busca el período
 * registrado más reciente que empezó en esa fecha o antes (los períodos
 * reales anclan cada tramo; no se extrapola un solo período hacia atrás en
 * el tiempo) y calcula la fase relativa a esa ancla. Para fechas futuras
 * más allá del último período registrado, sigue extrapolando desde ese
 * último período con la duración promedio configurada — igual que
 * `computeCyclePhase`.
 */
export function buildCycleMonthGrid(params: {
  year: number;
  month: number; // 0-11
  periodStarts: Date[]; // cualquier orden
  cycleLength: number;
  periodLength: number;
  selectedDateKey?: string;
}): CycleDayCell[] {
  const { year, month, periodStarts, cycleLength, periodLength, selectedDateKey } = params;
  const { start, end } = getMonthGridRange(year, month);
  const todayKey = toLocalDateKey(new Date());

  const sortedStarts = [...periodStarts].map(startOfDay).sort((a, b) => a.getTime() - b.getTime());
  const startKeys = new Set(sortedStarts.map((d) => toLocalDateKey(d)));

  const cells: CycleDayCell[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    const dateKey = toLocalDateKey(date);

    // Última ancla <= date (los períodos están ordenados asc, tomamos la última que no pase la fecha).
    let anchor: Date | null = null;
    for (const s of sortedStarts) {
      if (s.getTime() <= date.getTime()) anchor = s;
      else break;
    }

    let phase: CyclePhase | null = null;
    let isPeriodDay = false;
    if (anchor) {
      const daysSince = Math.floor((date.getTime() - anchor.getTime()) / MS_PER_DAY);
      const dayOfCycle0 = ((daysSince % cycleLength) + cycleLength) % cycleLength;
      phase = phaseForOffset(dayOfCycle0, cycleLength, periodLength);
      isPeriodDay = dayOfCycle0 < periodLength;
    }

    cells.push({
      date,
      dateKey,
      inCurrentMonth: date.getMonth() === month,
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedDateKey,
      isPeriodDay,
      isRegisteredStart: startKeys.has(dateKey),
      phase,
    });
  }
  return cells;
}
