/**
 * Tokens del sistema de diseño "Nocturne" (Melany, Claude Design) — ver
 * `_ds/nocturne-.../styles.css` en el proyecto de diseño. Nocturne es
 * dark-first: no se diseñó una paleta clara, así que `light` y `dark`
 * apuntan a los mismos valores por ahora. Si en algún momento se agrega
 * un modo claro real, es acá donde se separan.
 */

import '@/global.css';

import { Platform } from 'react-native';

const nocturne = {
  background: '#161826', // --color-bg
  backgroundElement: '#232532', // --color-surface
  backgroundSelected: '#2b2741', // --color-accent-900 (fondo de fila/opción elegida)
  text: '#e9e9ed', // --color-text
  textSecondary: '#b2b6ca', // --color-neutral-400
  divider: 'rgba(233,233,237,0.16)', // --color-divider

  accent: '#9184d9', // --color-accent
  accent2: '#a7a1db', // --color-accent-2

  neutral100: '#f3f5fe',
  neutral200: '#e4e7f5',
  neutral300: '#cfd3e5',
  neutral400: '#b2b6ca',
  neutral500: '#9397ab',
  neutral600: '#75798c',
  neutral700: '#595d6c',
  neutral800: '#3f424d',
  neutral900: '#292b31',

  accent100: '#f5f4ff',
  accent200: '#e7e5fe',
  accent300: '#d2cefd',
  accent400: '#b5abfc',
  accent500: '#968ae0',
  accent600: '#796cbf',
  accent700: '#5d5294',
  accent800: '#423a6a',
  accent900: '#2b2741',
} as const;

export const Colors = {
  light: nocturne,
  dark: nocturne,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Radios de borde — --radius-sm/md/lg en styles.css. */
export const Radius = {
  sm: 4,
  md: 8,
  lg: 14,
} as const;

export const Fonts = {
  // --font-heading-weight es 500: los títulos usan Inter Medium por default.
  heading: 'Inter_500Medium',
  headingSemiBold: 'Inter_600SemiBold',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_700Bold',
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
