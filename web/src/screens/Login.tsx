import { useState } from 'react';

import { api } from '../api';
import { t } from '../i18n';

// El login sin Google solo existe si el backend corre con DEV_LOGIN=true;
// en el build de producción el formulario ni se muestra.
const SHOW_DEV_LOGIN = import.meta.env.DEV || import.meta.env.VITE_DEV_LOGIN === 'true';

export function Login() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    <div className="app">
      <main className="page center">
        <div className="stack" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="brand">in2u</div>
          <p className="muted">{t.login.tagline}</p>
        </div>

        <a className="btn" href="/oauth2/authorization/google">
          {t.login.google}
        </a>

        {SHOW_DEV_LOGIN && (
          <form className="card" onSubmit={devLogin}>
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
