/**
 * Tema de colores: solo carmesí. Se guarda en este navegador; el modo día/noche
 * se elige entre "auto" (sigue al sistema), "light" o "dark".
 */
export type ThemeName = 'carmesi';
export type Mode = 'auto' | 'light' | 'dark';

/** Color de muestra de la paleta (su --primary en styles.css). */
export const THEMES: { id: ThemeName; color: string }[] = [
  { id: 'carmesi', color: '#ab2222' },
];
export const MODES: Mode[] = ['auto', 'light', 'dark'];

const THEME_KEY = 'in2u.theme';
const MODE_KEY = 'in2u.mode';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // modo privado o almacenamiento bloqueado: el tema dura solo esta visita
  }
}

export function savedTheme(): ThemeName {
  const v = read(THEME_KEY);
  return THEMES.some((t) => t.id === v) ? (v as ThemeName) : 'carmesi'; // incluye a quien tenía guardado el viejo "rosa"
}

export function savedMode(): Mode {
  const v = read(MODE_KEY);
  return MODES.includes(v as Mode) ? (v as Mode) : 'auto';
}

const darkQuery = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : undefined;

function paint() {
  const root = document.documentElement;
  const mode = savedMode();
  const dark = mode === 'dark' || (mode === 'auto' && !!darkQuery?.matches);
  root.dataset.theme = savedTheme();
  root.dataset.mode = dark ? 'dark' : 'light';
  // Color de la barra del navegador en el celular.
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#ffffff');
}

export function setTheme(theme: ThemeName) {
  write(THEME_KEY, theme);
  paint();
}

export function setMode(mode: Mode) {
  write(MODE_KEY, mode);
  paint();
}

/** Se llama una vez al arrancar, antes de dibujar la app. */
export function initTheme() {
  paint();
  darkQuery?.addEventListener?.('change', () => {
    if (savedMode() === 'auto') paint();
  });
}
