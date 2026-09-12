import { supabase } from '@/lib/supabase';
import { toLocalDateKey } from '@/lib/format';

export type CyclePhase = 'menstrual' | 'folicular' | 'ovulacion' | 'lutea';
export type PartnerVisibility = 'nada' | 'avisos' | 'fase_y_avisos';
export type Symptom = 'dolor' | 'sangrado' | 'sin_energia' | 'antojos' | 'insomnio';

export const SYMPTOMS: Symptom[] = ['dolor', 'sangrado', 'sin_energia', 'antojos', 'insomnio'];

export type CycleSettings = {
  user_id: string;
  average_cycle_length_days: number;
  average_period_length_days: number;
  partner_visibility: PartnerVisibility;
  updated_at: string;
};

export type CyclePhaseResult = {
  dayOfCycle: number;
  cycleLength: number;
  phase: CyclePhase;
  nextPeriodDate: string;
  daysUntilNextPeriod: number;
  fertileWindowStart: string;
  fertileWindowEnd: string;
};

/**
 * Cuántos días de folicular/ovulación entran en lo que queda del ciclo
 * después de la menstruación, con la misma proporción del mock (8:4 sobre
 * un resto de 24 en un ciclo de 29 días) escalada a `cycleLength`.
 * Compartida por `computeCyclePhase` (una sola fecha ancla) y por
 * `src/lib/cycle-grid.ts` (una fecha ancla distinta por día del mes).
 */
export function cyclePhaseBuckets(cycleLength: number, periodLength: number): { folicularDays: number; ovulacionDays: number } {
  const remaining = Math.max(cycleLength - periodLength, 1);
  return {
    folicularDays: Math.round((remaining * 8.0) / 24),
    ovulacionDays: Math.round((remaining * 4.0) / 24),
  };
}

/** `dayOfCycle0` es 0-indexado desde el inicio del período (día de sangrado = 0). */
export function phaseForOffset(dayOfCycle0: number, cycleLength: number, periodLength: number): CyclePhase {
  const { folicularDays, ovulacionDays } = cyclePhaseBuckets(cycleLength, periodLength);
  if (dayOfCycle0 < periodLength) return 'menstrual';
  if (dayOfCycle0 < periodLength + folicularDays) return 'folicular';
  if (dayOfCycle0 < periodLength + folicularDays + ovulacionDays) return 'ovulacion';
  return 'lutea';
}

/**
 * Réplica en TS de `compute_cycle_phase()` en
 * `supabase/migrations/0004_cycle.sql` — mantener las dos sincronizadas a
 * mano. Esta versión la usa la propia dueña del ciclo (sus filas crudas ya
 * son legibles por RLS normal); la versión SQL es la única que corre para
 * la pareja, dentro de `get_partner_cycle_summary`, para no mandar nunca
 * datos crudos fuera de Postgres.
 */
export function computeCyclePhase(
  lastPeriodStart: Date,
  cycleLength: number,
  periodLength: number,
  asOf: Date = new Date()
): CyclePhaseResult {
  const daysSinceStart = daysBetween(lastPeriodStart, asOf);
  const dayOfCycle0 = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength;
  const { folicularDays, ovulacionDays } = cyclePhaseBuckets(cycleLength, periodLength);
  const phase = phaseForOffset(dayOfCycle0, cycleLength, periodLength);

  const cyclesElapsed = Math.floor(daysSinceStart / cycleLength);
  const nextPeriodDate = addDays(lastPeriodStart, (cyclesElapsed + 1) * cycleLength);
  const fertileStart = addDays(lastPeriodStart, periodLength + folicularDays);
  const fertileEnd = addDays(lastPeriodStart, periodLength + folicularDays + ovulacionDays);

  return {
    dayOfCycle: dayOfCycle0 + 1,
    cycleLength,
    phase,
    nextPeriodDate: toLocalDateKey(nextPeriodDate),
    daysUntilNextPeriod: cycleLength - dayOfCycle0,
    fertileWindowStart: toLocalDateKey(fertileStart),
    fertileWindowEnd: toLocalDateKey(fertileEnd),
  };
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
}

export async function getOwnCycleSettings(userId: string): Promise<CycleSettings | null> {
  const { data, error } = await supabase.from('cycle_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data as CycleSettings | null;
}

/** Todos los inicios de período registrados, más reciente primero. */
export async function getOwnPeriodStarts(userId: string, limit = 24): Promise<Date[]> {
  const { data, error } = await supabase
    .from('cycle_periods')
    .select('start_date')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => new Date(`${row.start_date}T00:00:00`));
}

export async function logPeriodStart(userId: string, date: Date = new Date()): Promise<void> {
  const { error } = await supabase
    .from('cycle_periods')
    .upsert({ user_id: userId, start_date: toLocalDateKey(date) }, { onConflict: 'user_id,start_date' });
  if (error) throw error;
}

export async function deletePeriodStart(userId: string, date: Date): Promise<void> {
  const { error } = await supabase
    .from('cycle_periods')
    .delete()
    .eq('user_id', userId)
    .eq('start_date', toLocalDateKey(date));
  if (error) throw error;
}

/**
 * Marca/desmarca `date` como inicio de período, tocando a la app desde el
 * calendario del ciclo. `current` es la lista ya cargada (evita un
 * round-trip extra solo para saber si ya estaba marcado).
 */
export async function togglePeriodStart(userId: string, date: Date, current: Date[]): Promise<Date[]> {
  const key = toLocalDateKey(date);
  const exists = current.some((d) => toLocalDateKey(d) === key);
  if (exists) {
    await deletePeriodStart(userId, date);
    return current.filter((d) => toLocalDateKey(d) !== key);
  }
  await logPeriodStart(userId, date);
  return [...current, date].sort((a, b) => b.getTime() - a.getTime());
}

export async function getTodaySymptoms(userId: string): Promise<Symptom[]> {
  const { data, error } = await supabase
    .from('cycle_daily_logs')
    .select('symptoms')
    .eq('user_id', userId)
    .eq('log_date', toLocalDateKey(new Date()))
    .maybeSingle();
  if (error) throw error;
  return (data?.symptoms as Symptom[] | undefined) ?? [];
}

export async function toggleSymptom(userId: string, symptom: Symptom, current: Symptom[]): Promise<Symptom[]> {
  const next = current.includes(symptom) ? current.filter((s) => s !== symptom) : [...current, symptom];
  const { error } = await supabase
    .from('cycle_daily_logs')
    .upsert(
      { user_id: userId, log_date: toLocalDateKey(new Date()), symptoms: next },
      { onConflict: 'user_id,log_date' }
    );
  if (error) throw error;
  return next;
}

export async function updatePartnerVisibility(userId: string, level: PartnerVisibility): Promise<void> {
  const { error } = await supabase
    .from('cycle_settings')
    .upsert(
      { user_id: userId, partner_visibility: level, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

export type PartnerCycleSummary =
  | { visibility: 'nada' }
  | { visibility: 'avisos' | 'fase_y_avisos'; has_data: false }
  | { visibility: 'avisos'; has_data: true; care_mode: boolean }
  | {
      visibility: 'fase_y_avisos';
      has_data: true;
      phase: CyclePhase;
      day_of_cycle: number;
      cycle_length: number;
      next_period_date: string;
      days_until_next_period: number;
    };

/** Único canal hacia el ciclo de la pareja — ver `get_partner_cycle_summary` en la migración 0004. */
export async function getPartnerCycleSummary(ownerId: string): Promise<PartnerCycleSummary> {
  const { data, error } = await supabase.rpc('get_partner_cycle_summary', { p_owner_id: ownerId });
  if (error) throw error;
  return data as PartnerCycleSummary;
}
