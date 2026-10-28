/**
 * Modo día/noche, guardado en este navegador: "auto" (sigue al sistema),
 * "light" o "dark". La paleta es una sola (carmesí, en styles.css).
 */
export type Mode = 'auto' | 'light' | 'dark';

export const MODES: Mode[] = ['auto', 'light', 'dark'];

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

export function savedMode(): Mode {
  const v = read(MODE_KEY);
  return MODES.includes(v as Mode) ? (v as Mode) : 'auto';
}

const darkQuery = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : undefined;

function paint() {
  const root = document.documentElement;
  const mode = savedMode();
  const dark = mode === 'dark' || (mode === 'auto' && !!darkQuery?.matches);
  root.dataset.mode = dark ? 'dark' : 'light';
  // Color de la barra del navegador en el celular.
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#ffffff');
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
