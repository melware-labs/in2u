import { supabase } from '@/lib/supabase';

export type EventVisibility = 'solo_yo' | 'los_dos';

export type CoupleEvent = {
  id: string;
  couple_id: string;
  owner_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  visibility: EventVisibility;
  google_sync_enabled: boolean;
  created_at: string;
};

/**
 * Eventos visibles para el usuario actual (propios + "los_dos" de la
 * pareja, según RLS) cuyo `starts_at` cae en `[start, end)`. Se usa tanto
 * para la grilla mensual como para la vista Agenda.
 */
export async function listEventsInRange(coupleId: string, start: Date, end: Date): Promise<CoupleEvent[]> {
  const { data, error } = await supabase
    .from('couple_events')
    .select('*')
    .eq('couple_id', coupleId)
    .gte('starts_at', start.toISOString())
    .lt('starts_at', end.toISOString())
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return (data as CoupleEvent[]) ?? [];
}

export async function createEvent(params: {
  coupleId: string;
  ownerId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  visibility: EventVisibility;
  googleSyncEnabled: boolean;
}): Promise<CoupleEvent> {
  const { data, error } = await supabase
    .from('couple_events')
    .insert({
      couple_id: params.coupleId,
      owner_id: params.ownerId,
      title: params.title,
      starts_at: params.startsAt.toISOString(),
      ends_at: params.endsAt.toISOString(),
      visibility: params.visibility,
      google_sync_enabled: params.googleSyncEnabled,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CoupleEvent;
}
