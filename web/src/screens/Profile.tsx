import { api, type Me } from '../api';
import { t } from '../i18n';
import { ThemePicker } from './ThemePicker';

export function Profile({ me, onSignedOut }: { me: Me; onSignedOut: () => void }) {
  async function signOut() {
    try {
      await api.logout();
    } finally {
      onSignedOut();
    }
  }

  return (
    <>
      <h1>{t.perfil.title}</h1>

      <section className="card">
        <p className="kicker">{t.perfil.account}</p>
        <h2>{me.name ?? me.email}</h2>
        {me.name && me.email && <p className="muted">{me.email}</p>}
      </section>

      <section className="card">
        <p className="kicker">{t.perfil.partner}</p>
        <h2>{me.partner?.name ?? '—'}</h2>
        <p className="muted small">
          {t.perfil.coupleCode}: {me.inviteCode}
        </p>
      </section>

      <ThemePicker />

      <button className="btn secondary" onClick={signOut}>
        {t.perfil.signOut}
      </button>
    </>
  );
}
