import { type MonthCell, monthGrid, parseLocalDate } from './dates';

export type CyclePhase = 'menstrual' | 'folicular' | 'ovulacion' | 'lutea';

/**
 * Misma fórmula que CyclePhaseCalculator.java (el backend es la fuente de
 * verdad para "hoy" y para lo que ve la pareja); aquí solo se usa para pintar
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
