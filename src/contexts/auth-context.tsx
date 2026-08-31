import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Couple } from '@/lib/couples';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  couple: Couple | null;
  /** true mientras se resuelve la sesión inicial y, si existe, su pareja. */
  loading: boolean;
  refreshCouple: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
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
      return;
    }
    setCouple(data);
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
  }, []);

  return (
    <AuthContext.Provider value={{ session, couple, loading, refreshCouple, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
