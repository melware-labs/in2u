import { useEffect, useState } from 'react';

import { t } from '../i18n';
import { getPushStatus, isIos, isStandalone, type PushStatus, subscribeToPush, unsubscribeFromPush } from '../push';

export function PushSettings() {
  const [status, setStatus] = useState<PushStatus | 'loading'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iosNeedsInstall = isIos() && !isStandalone();

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

      {iosNeedsInstall ? (
        <div style={{ padding: '0.85rem', background: 'var(--color-surface, rgba(0,0,0,0.03))', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            📱 {t.notifications.iosInstallTitle}
          </p>
          <ol style={{ paddingLeft: '1.2rem', margin: '0 0 0.5rem 0', fontSize: '0.85rem', lineHeight: '1.5' }}>
            <li>{t.notifications.iosInstallStep1}</li>
            <li>{t.notifications.iosInstallStep2}</li>
            <li>{t.notifications.iosInstallStep3}</li>
          </ol>
          <p className="muted small" style={{ margin: 0, fontStyle: 'italic' }}>
            🔒 {t.notifications.privacyNote}
          </p>
        </div>
      ) : status === 'loading' ? (
        <p className="muted small">{t.loading}</p>
      ) : status === 'unsupported' ? (
        <div>
          <p className="muted small">{t.notifications.statusUnsupported}</p>
          <p className="muted small" style={{ marginTop: '0.4rem' }}>
            💡 Si abriste este enlace desde otra aplicación (como Instagram o WhatsApp), pulsa en el menú y selecciona <b>Abrir en el navegador</b> (Chrome o Safari).
          </p>
        </div>
      ) : status === 'denied' ? (
        <div>
          <p className="muted" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            {t.notifications.statusDenied}
          </p>
          <p className="muted small">{t.notifications.statusDeniedHint}</p>
        </div>
      ) : status === 'subscribed' ? (
        <div>
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
          <p className="muted small" style={{ marginTop: '0.75rem' }}>
            🔒 {t.notifications.privacyNote}
          </p>
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
          <p className="muted small" style={{ marginTop: '0.75rem' }}>
            🔒 {t.notifications.privacyNote}
          </p>
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
