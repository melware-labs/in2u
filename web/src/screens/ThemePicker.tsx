import { useState } from 'react';

import { t } from '../i18n';
import { MODES, type Mode, savedMode, savedTheme, setMode, setTheme, THEMES, type ThemeName } from '../theme';

export function ThemePicker() {
  const [theme, setThemeState] = useState<ThemeName>(savedTheme);
  const [mode, setModeState] = useState<Mode>(savedMode);

  return (
    <section className="card">
      <p className="kicker">{t.perfil.theme}</p>
      <div className="swatches" role="radiogroup" aria-label={t.perfil.theme}>
        {THEMES.map((item) => (
          <button
            key={item.id}
            role="radio"
            aria-checked={theme === item.id}
            className="swatch"
            onClick={() => {
              setTheme(item.id);
              setThemeState(item.id);
            }}
          >
            <span className="circle" style={{ background: item.color }} aria-hidden>
              {theme === item.id ? '✓' : ''}
            </span>
            {t.perfil.themes[item.id]}
          </button>
        ))}
      </div>

      <p className="kicker" style={{ marginTop: 8 }}>
        {t.perfil.mode}
      </p>
      <div className="segmented" role="radiogroup" aria-label={t.perfil.mode}>
        {MODES.map((m) => (
          <button
            key={m}
            role="radio"
            aria-checked={mode === m}
            onClick={() => {
              setMode(m);
              setModeState(m);
            }}
          >
            {t.perfil.modes[m]}
          </button>
        ))}
      </div>
    </section>
  );
}
