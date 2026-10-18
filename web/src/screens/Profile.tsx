import { useState } from 'react';

import { api, type Me } from '../api';
import { locale, t } from '../i18n';
import { parseLocalDate } from '../lib';
import { ProfileForm } from './ProfileForm';
import { PushSettings } from './PushSettings';
import { ThemePicker } from './ThemePicker';

export function Profile({
  me,
  onChange,
  onSignedOut,
}: {
  me: Me;
  onChange: (me: Me) => void;
  onSignedOut: () => void;
}) {
  const [editing, setEditing] = useState(false);

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

      <div className="grid-cards">
        <section className="card">
          <p className="kicker">{t.perfil.account}</p>
          <h2>{me.name ?? me.email}</h2>
          {me.name && me.email && <p className="muted">{me.email}</p>}
          {editing ? (
            <ProfileForm
              me={me}
              onCancel={() => setEditing(false)}
              onSaved={(updated) => {
                onChange(updated);
                setEditing(false);
              }}
            />
          ) : (
            <>
              <p className="muted small">
                {[me.gender && t.profile.genders[me.gender], me.age != null && t.profile.age(me.age)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {me.togetherSince && (
                <p className="muted small">
                  {t.nosotros.since(parseLocalDate(me.togetherSince).toLocaleDateString(locale, { dateStyle: 'long' }))}
                </p>
              )}
              <button className="btn secondary" onClick={() => setEditing(true)}>
                {t.profile.edit}
              </button>
            </>
          )}
        </section>

        <section className="card">
          <p className="kicker">{t.perfil.partner}</p>
          <h2>{me.partner?.name ?? '—'}</h2>
          <p className="muted small">
            {t.perfil.coupleCode}: {me.inviteCode}
          </p>
        </section>
      </div>

      <PushSettings />

      <ThemePicker />

      <button className="btn secondary" onClick={signOut}>
        {t.perfil.signOut}
      </button>
    </>
  );
}
