import { supabase } from '@/lib/supabase';
import { toDateKey } from '@/lib/format';

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
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceStart = Math.floor((startOfDay(asOf).getTime() - startOfDay(lastPeriodStart).getTime()) / msPerDay);
  const dayOfCycle0 = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength;
  const remaining = Math.max(cycleLength - periodLength, 1);
  const folicularDays = Math.round((remaining * 8.0) / 24);
  const ovulacionDays = Math.round((remaining * 4.0) / 24);

  let phase: CyclePhase;
  if (dayOfCycle0 < periodLength) phase = 'menstrual';
  else if (dayOfCycle0 < periodLength + folicularDays) phase = 'folicular';
  else if (dayOfCycle0 < periodLength + folicularDays + ovulacionDays) phase = 'ovulacion';
  else phase = 'lutea';

  const cyclesElapsed = Math.floor(daysSinceStart / cycleLength);
  const nextPeriodDate = addDays(lastPeriodStart, (cyclesElapsed + 1) * cycleLength);
  const fertileStart = addDays(lastPeriodStart, periodLength + folicularDays);
  const fertileEnd = addDays(lastPeriodStart, periodLength + folicularDays + ovulacionDays);

  return {
    dayOfCycle: dayOfCycle0 + 1,
    cycleLength,
    phase,
    nextPeriodDate: toDateKey(nextPeriodDate),
    daysUntilNextPeriod: cycleLength - dayOfCycle0,
    fertileWindowStart: toDateKey(fertileStart),
    fertileWindowEnd: toDateKey(fertileEnd),
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

export async function getOwnCycleSettings(userId: string): Promise<CycleSettings | null> {
  const { data, error } = await supabase.from('cycle_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data as CycleSettings | null;
}

export async function getOwnLastPeriodStart(userId: string): Promise<Date | null> {
  const { data, error } = await supabase
    .from('cycle_periods')
    .select('start_date')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? new Date(`${data.start_date}T00:00:00`) : null;
}

export async function logPeriodStart(userId: string, date: Date = new Date()): Promise<void> {
  const { error } = await supabase
    .from('cycle_periods')
    .upsert({ user_id: userId, start_date: toDateKey(date) }, { onConflict: 'user_id,start_date' });
  if (error) throw error;
}

export async function getTodaySymptoms(userId: string): Promise<Symptom[]> {
  const { data, error } = await supabase
    .from('cycle_daily_logs')
    .select('symptoms')
    .eq('user_id', userId)
    .eq('log_date', toDateKey(new Date()))
    .maybeSingle();
  if (error) throw error;
  return (data?.symptoms as Symptom[] | undefined) ?? [];
}

export async function toggleSymptom(userId: string, symptom: Symptom, current: Symptom[]): Promise<Symptom[]> {
  const next = current.includes(symptom) ? current.filter((s) => s !== symptom) : [...current, symptom];
  const { error } = await supabase
    .from('cycle_daily_logs')
    .upsert(
      { user_id: userId, log_date: toDateKey(new Date()), symptoms: next },
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
