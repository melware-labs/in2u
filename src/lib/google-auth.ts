import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

// Necesario para que la pestaña del navegador se cierre sola al volver a la app.
WebBrowser.maybeCompleteAuthSession();

/**
 * Dispara el login con Google delegando el OAuth a Supabase (el Client ID / Secret
 * de Google se configuran una sola vez en el panel de Supabase, no acá).
 *
 * Pide además el scope de Google Calendar para poder sincronizar eventos más
 * adelante (Fase C), y `access_type=offline` + `prompt=consent` para asegurarnos
 * de recibir un refresh token reutilizable, no solo un access token de corta vida.
 */
export async function signInWithGoogle() {
  const redirectTo = makeRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      scopes: 'https://www.googleapis.com/auth/calendar.events',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('Supabase no devolvió una URL de OAuth.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success' || !result.url) {
    // El usuario canceló o cerró la pestaña — no es un error a reportar.
    return null;
  }

  const { params, errorCode } = getQueryParams(result.url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) {
    throw new Error('La respuesta de Google no incluyó los tokens esperados.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw sessionError;

  return sessionData.session;
}
