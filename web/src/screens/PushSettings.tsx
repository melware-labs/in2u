import { useEffect, useState } from 'react';

import { t } from '../i18n';
import { getPushStatus, type PushStatus, subscribeToPush, unsubscribeFromPush } from '../push';

export function PushSettings() {
  const [status, setStatus] = useState<PushStatus | 'loading'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPushStatus().then((s) => {
      if (active) setStatus(s);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      const ok = await subscribeToPush();
      if (ok) {
        setStatus('subscribed');
      } else {
        const next = await getPushStatus();
        setStatus(next);
      }
    } catch (e) {
      console.error('Error suscribiendo a push:', e);
      setError(t.notifications.error);
      const next = await getPushStatus();
      setStatus(next);
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError(null);
    try {
      await unsubscribeFromPush();
      setStatus('unsubscribed');
    } catch (e) {
      console.error('Error desuscribiendo push:', e);
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <p className="kicker">{t.notifications.kicker}</p>
      <h2>{t.notifications.title}</h2>
      <p className="muted small" style={{ marginBottom: '1rem' }}>
        {t.notifications.description}
      </p>

      {status === 'loading' ? (
        <p className="muted small">{t.loading}</p>
      ) : status === 'unsupported' ? (
        <p className="muted small">{t.notifications.statusUnsupported}</p>
      ) : status === 'denied' ? (
        <div>
          <p className="muted" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            {t.notifications.statusDenied}
          </p>
          <p className="muted small">{t.notifications.statusDeniedHint}</p>
        </div>
      ) : status === 'subscribed' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.notifications.statusSubscribed}</span>
          </div>
          <button
            className="btn secondary"
            onClick={handleDisable}
            disabled={busy}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            {busy ? t.notifications.disabling : t.notifications.disable}
          </button>
        </div>
      ) : (
        <div>
          <button
            className="btn"
            onClick={handleEnable}
            disabled={busy}
          >
            {busy ? t.notifications.enabling : t.notifications.enable}
          </button>
        </div>
      )}

      {error && (
        <p className="small" style={{ color: 'var(--color-primary)', marginTop: '0.75rem' }}>
          {error}
        </p>
      )}
    </section>
  );
}
