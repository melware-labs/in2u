import { useEffect, useState } from 'react';

import { api, type GoogleCalendarStatus } from '../lib/api';
import { t } from '../lib/i18n';

/** Vincular o desvincular el Google Calendar. No se muestra si el servidor no lo tiene activado. */
export function GoogleCalendarCard({ onChange }: { onChange: () => void }) {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Google vuelve a la app con ?google=vinculado (o cancelado, sin-permiso, error).
    const params = new URLSearchParams(window.location.search);
    const result = params.get('google');
    if (result) {
      setMessage(t.google.results[result] ?? t.google.results.error);
      params.delete('google');
      const query = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''));
    }
    api.googleCalendar().then(setStatus, () => setStatus(null));
  }, []);

  if (!status?.available) return null;

  async function disconnect() {
    setBusy(true);
    try {
      await api.disconnectGoogleCalendar();
      setStatus({ ...status!, connected: false, email: null });
      onChange();
    } catch {
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <p className="kicker">{t.google.kicker}</p>
      <h2>{t.google.title}</h2>
      <p className="muted small">{t.google.description}</p>
      {status.connected ? (
        <>
          <p className="small">✓ {t.google.connected(status.email)}</p>
          <button className="btn secondary" disabled={busy} onClick={disconnect}>
            {busy ? t.google.disconnecting : t.google.disconnect}
          </button>
          <p className="muted small">{t.google.disconnectHint}</p>
        </>
      ) : (
        <a
          className="btn"
          href="/api/google-calendar/connect"
          onClick={() => setBusy(true)}
          aria-disabled={busy}
        >
          {busy ? t.google.connecting : t.google.connect}
        </a>
      )}
      {message && <p className="small">{message}</p>}
    </section>
  );
}
