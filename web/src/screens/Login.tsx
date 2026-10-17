import { useState } from 'react';

import { api } from '../api';
import { t } from '../i18n';
import { Brand } from '../Brand';

// El login sin Google solo existe si el backend corre con DEV_LOGIN=true;
// en el build de producción el formulario ni se muestra.
const SHOW_DEV_LOGIN = import.meta.env.DEV || import.meta.env.VITE_DEV_LOGIN === 'true';

export function Login() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');

  async function devLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.devLogin(email.trim(), name.trim());
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    }
  }

  return (
    <div className="app splash">
      <main className="page center">
        <div className="stack" style={{ textAlign: 'center', alignItems: 'center', marginBottom: 16 }}>
          <Brand withMark />
          <p className="tagline">{t.login.tagline}</p>
        </div>

        {/* Con Google, registrarse y entrar son el mismo paso: la primera vez se
            crea la cuenta y la app pide los datos de bienvenida. */}
        <div className="auth-switch" role="tablist" aria-label={t.login.google}>
          {(['signup', 'signin'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}>
              {m === 'signup' ? t.login.signup : t.login.signin}
            </button>
          ))}
        </div>
        <p className="muted small" style={{ textAlign: 'center' }}>
          {mode === 'signup' ? t.login.signupHint : t.login.signinHint}
        </p>
        <a className="btn" href="/oauth2/authorization/google">
          {mode === 'signup' ? t.login.signupGoogle : t.login.signinGoogle}
        </a>

        {SHOW_DEV_LOGIN && (
          <form className="card" style={{ textAlign: 'left' }} onSubmit={devLogin}>
            <p className="kicker">{t.login.devTitle}</p>
            <input
              className="input"
              type="email"
              required
              placeholder={t.login.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input"
              placeholder={t.login.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn secondary" type="submit">
              {t.login.enter}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
        )}
      </main>
    </div>
  );
}
