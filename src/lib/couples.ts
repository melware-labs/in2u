import { supabase } from '@/lib/supabase';

export type Couple = {
  id: string;
  invite_code: string;
  member_one: string;
  member_two: string | null;
  created_at: string;
};

// Sin 0/O ni 1/I para que nadie confunda el código al pasarlo de palabra.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Crea una pareja nueva con el usuario actual como member_one. */
export async function createCouple(userId: string): Promise<Couple> {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const invite_code = generateInviteCode();
    const { data, error } = await supabase
      .from('couples')
      .insert({ member_one: userId, invite_code })
      .select()
      .single();

    if (!error) return data;
    // 23505 = unique_violation (código repetido, muy improbable) -> reintentar.
    if (error.code !== '23505' || attempt === maxAttempts) throw error;
  }
  throw new Error('No se pudo generar un código de invitación único.');
}

/** Une al usuario actual a la pareja dueña de `inviteCode`. */
export async function joinCouple(inviteCode: string): Promise<Couple> {
  const { data, error } = await supabase.rpc('join_couple', { code: inviteCode });
  if (error) throw error;
  return data as Couple;
}
