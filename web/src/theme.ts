/**
 * Tema de colores (paletas pastel) y modo día/noche. Se guarda en este
 * navegador; "auto" sigue el modo del sistema.
 */
export type ThemeName = 'rosa' | 'lavanda' | 'menta' | 'celeste' | 'durazno';
export type Mode = 'auto' | 'light' | 'dark';

/** Color de muestra de cada paleta (su --primary en styles.css). */
export const THEMES: { id: ThemeName; color: string }[] = [
  { id: 'rosa', color: '#d9a0b8' },
  { id: 'lavanda', color: '#b9a3e3' },
  { id: 'menta', color: '#8fd0b5' },
  { id: 'celeste', color: '#9cc8ec' },
  { id: 'durazno', color: '#f2b392' },
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
  return THEMES.some((t) => t.id === v) ? (v as ThemeName) : 'rosa';
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
