import * as Localization from 'expo-localization';

import { en } from './en';
import { es, type Dictionary } from './es';

const dictionaries = { es, en } as const;
export type Locale = keyof typeof dictionaries;

function resolveLocale(): Locale {
  return Localization.getLocales()[0]?.languageCode === 'en' ? 'en' : 'es';
}

/**
 * El idioma del sistema no cambia en vivo dentro de una sesión de la app,
 * así que un cálculo directo alcanza — no hace falta useState/useEffect ni
 * un Context.
 */
export function useTranslation(): { t: Dictionary; locale: Locale } {
  const locale = resolveLocale();
  return { t: dictionaries[locale], locale };
}
