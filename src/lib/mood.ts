import { supabase } from '@/lib/supabase';

export type Mood = 1 | 2 | 3 | 4 | 5 | 6;

export type MoodCheckin = {
  id: string;
  couple_id: string;
  user_id: string;
  mood: Mood;
  note: string | null;
  created_at: string;
  checkin_date: string;
};

/** Orden de arriba a abajo en la pantalla de check-in: mejor a peor. */
export const MOOD_OPTIONS: { mood: Mood; emoji: string; label: string }[] = [
  { mood: 6, emoji: '😄', label: 'De diez' },
  { mood: 5, emoji: '🙂', label: 'Bien' },
  { mood: 4, emoji: '😐', label: 'Normal' },
  { mood: 3, emoji: '🥱', label: 'Cansada' },
  { mood: 2, emoji: '😞', label: 'Bajón' },
  { mood: 1, emoji: '😣', label: 'Mal' },
];

export function moodOption(mood: Mood) {
  return MOOD_OPTIONS.find((o) => o.mood === mood);
}

/** Crea o actualiza el check-in del día (uno por usuario por día, ver migración 0002). */
export async function upsertTodayCheckin(params: {
  coupleId: string;
  userId: string;
  mood: Mood;
  note?: string | null;
}): Promise<MoodCheckin> {
  const { data, error } = await supabase
    .from('mood_checkins')
    .upsert(
      {
        couple_id: params.coupleId,
        user_id: params.userId,
        mood: params.mood,
        note: params.note ?? null,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,checkin_date' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as MoodCheckin;
}
