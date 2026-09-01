import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

// Necesario para que la pestaña del navegador se cierre sola al volver a la app.
WebBrowser.maybeCompleteAuthSession();

/**
 * Parsea la URL de vuelta del OAuth (con los tokens en el fragmento) y crea
 * la sesión de Supabase. Se usa tanto desde el resultado directo de
 * `openAuthSessionAsync` como desde el listener de `Linking` (ver login.tsx)
 * — en la práctica, `openAuthSessionAsync` a veces no intercepta la vuelta
 * a la app (más común en Expo Go), así que `Linking` es la red de respaldo
 * recomendada por la propia guía de Supabase para Expo.
 */
export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return null;

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
  return data.session;
}

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
    // El usuario canceló, o la sesión no se pudo interceptar y va a llegar
    // (si llega) por el listener de Linking en login.tsx en su lugar.
    return null;
  }

  return createSessionFromUrl(result.url);
}
