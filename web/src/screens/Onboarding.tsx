import { useState } from 'react';

import { api, type Me } from '../api';
import { t } from '../i18n';

export function Onboarding({ me, onChange }: { me: Me; onChange: (me: Me) => void }) {
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<Me>) {
    setBusy(true);
    setError(null);
    try {
      onChange(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(me.inviteCode ?? '');
      setCopied(true);
    } catch {
      // sin permiso de portapapeles: el código sigue visible para copiarlo a mano
    }
  }

  if (me.state === 'waiting' && me.inviteCode) {
    return (
      <div className="app splash">
        <main className="page center">
          <h1>{t.onboarding.yourCode}</h1>
          <div className="code-box" aria-label={t.onboarding.yourCode}>
            {me.inviteCode}
          </div>
          <p className="muted">{t.onboarding.waiting}</p>
          <button className="btn secondary" onClick={copy}>
            {copied ? t.onboarding.copied : t.onboarding.copy}
          </button>
          <button className="btn" disabled={busy} onClick={() => run(async () => (await api.me()) ?? me)}>
            {t.onboarding.refresh}
          </button>
          {error && <p className="error">{error}</p>}
        </main>
      </div>
    );
  }

  return (
    <div className="app splash">
      <main className="page center">
        <div className="stack" style={{ alignItems: 'center' }}>
          <div className="brand">in2u</div>
          <h1>{t.onboarding.title}</h1>
          <p className="muted">{t.onboarding.subtitle}</p>
        </div>

        {!joining ? (
          <>
            <button className="btn" disabled={busy} onClick={() => run(api.createCouple)}>
              {t.onboarding.create}
            </button>
            <button className="btn link" onClick={() => setJoining(true)}>
              {t.onboarding.haveCode}
            </button>
          </>
        ) : (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => api.joinCouple(code));
            }}
          >
            <input
              className="input code"
              autoFocus
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder={t.onboarding.codePlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="btn" type="submit" disabled={busy || code.trim().length < 6}>
              {t.onboarding.join}
            </button>
          </form>
        )}
        {error && <p className="error">{error}</p>}
      </main>
    </div>
  );
}
