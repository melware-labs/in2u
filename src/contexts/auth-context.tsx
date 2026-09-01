import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Couple } from '@/lib/couples';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type AuthContextValue = {
  session: Session | null;
  couple: Couple | null;
  /** Perfil de la pareja (null si todavía no hay pareja vinculada). */
  partner: Profile | null;
  /** true mientras se resuelve la sesión inicial y, si existe, su pareja. */
  loading: boolean;
  refreshCouple: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCouple = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .or(`member_one.eq.${userId},member_two.eq.${userId}`)
      .maybeSingle();

    if (error) {
      console.error('No se pudo cargar la pareja:', error.message);
      setCouple(null);
      setPartner(null);
      return;
    }
    setCouple(data);

    const partnerId = data ? (data.member_one === userId ? data.member_two : data.member_one) : null;
    if (!partnerId) {
      setPartner(null);
      return;
    }

    const { data: partnerProfile, error: partnerError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', partnerId)
      .maybeSingle();

    if (partnerError) {
      console.error('No se pudo cargar el perfil de la pareja:', partnerError.message);
      setPartner(null);
    } else {
      setPartner(partnerProfile);
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadCouple(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await loadCouple(newSession.user.id);
      } else {
        setCouple(null);
        setPartner(null);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadCouple]);

  const refreshCouple = useCallback(async () => {
    if (session?.user) await loadCouple(session.user.id);
  }, [session, loadCouple]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setCouple(null);
    setPartner(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, couple, partner, loading, refreshCouple, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
