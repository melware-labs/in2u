import { useState } from 'react';

import { t } from '../i18n';
import { MODES, type Mode, savedMode, setMode } from '../theme';

/** Solo el selector de modo día/noche. La paleta siempre es carmesí. */
export function ThemePicker() {
  const [mode, setModeState] = useState<Mode>(savedMode);

  return (
    <section className="card">
      <p className="kicker">{t.perfil.mode}</p>
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
