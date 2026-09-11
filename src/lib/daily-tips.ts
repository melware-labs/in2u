import { supabase } from '@/lib/supabase';
import { toDateKey } from '@/lib/format';

export type DailyTip = {
  id: string;
  couple_id: string;
  for_user_id: string;
  based_on_user_id: string;
  tip_key: string;
  kicker_text: string;
  created_at: string;
  tip_date: string;
};

/** El tip de hoy para `userId`, si `analyze-checkin` ya corrió (ver Fase D). */
export async function getTodayTip(userId: string): Promise<DailyTip | null> {
  const { data, error } = await supabase
    .from('daily_tips')
    .select('*')
    .eq('for_user_id', userId)
    .eq('tip_date', toDateKey(new Date()))
    .maybeSingle();

  if (error) throw error;
  return data as DailyTip | null;
}
