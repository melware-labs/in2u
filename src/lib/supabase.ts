import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copiá .env.example a .env y completá los valores del panel de Supabase.'
  );
}

// `window` no existe durante el render en servidor de `expo start --web` /
// `expo export --platform web`. AsyncStorage (su implementación web) asume
// `window.localStorage` y explota ahí, así que en ese entorno dejamos que
// supabase-js caiga a su storage en memoria (seguro para SSR) en vez de forzar
// AsyncStorage.
const isServer = typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isServer ? undefined : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});
