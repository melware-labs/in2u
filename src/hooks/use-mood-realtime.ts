import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { MoodCheckin } from '@/lib/mood';

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Trae los check-ins de ánimo de los últimos 7 días de la pareja y se
 * suscribe a cambios en tiempo real (Realtime de Supabase) para que el
 * ánimo del otro aparezca al instante, sin refrescar.
 */
export function useMoodRealtime(coupleId: string | undefined, userId: string | undefined) {
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!coupleId) {
      setLoading(false);
      return;
    }
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data, error } = await supabase
      .from('mood_checkins')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('No se pudieron cargar los check-ins de ánimo:', error.message);
    } else {
      setCheckins((data as MoodCheckin[]) ?? []);
    }
    setLoading(false);
  }, [coupleId]);

  useEffect(() => {
    load();
    if (!coupleId) return;

    const channel = supabase
      .channel(`mood_checkins:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mood_checkins', filter: `couple_id=eq.${coupleId}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, load]);

  const today = todayDateString();
  const ownToday = checkins.find((c) => c.user_id === userId && c.checkin_date === today) ?? null;
  // `checkins` viene ordenado por fecha desc, así que el primero de la
  // pareja es su check-in más reciente (no necesariamente de hoy).
  const partnerLatest = checkins.find((c) => c.user_id !== userId) ?? null;

  return { checkins, ownToday, partnerLatest, loading, refresh: load };
}
