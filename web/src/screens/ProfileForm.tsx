import { useState } from 'react';

import { api, GENDERS, type Gender, type Me } from '../api';
import { DateSelect } from '../DateSelect';
import { t } from '../i18n';
import { localIsoDate } from '../lib';

/**
 * Datos que se piden al crear la cuenta (y se editan desde Perfil): nombre,
 * género, fecha de nacimiento (la edad sale de ahí) y desde cuándo son pareja.
 */
export function ProfileForm({
  me,
  onSaved,
  onCancel,
}: {
  me: Me;
  onSaved: (me: Me) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(me.name ?? '');
  const [gender, setGender] = useState<Gender | null>(me.gender);
  const [birthDate, setBirthDate] = useState(me.birthDate ?? '');
  const [togetherSince, setTogetherSince] = useState(me.togetherSince ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = localIsoDate(new Date());
  const valid = name.trim() !== '' && gender !== null && birthDate !== '' && togetherSince !== '';

  async function save() {
    if (!valid || gender === null) return;
    setSaving(true);
    setError(null);
    try {
      onSaved(await api.saveProfile({ name, gender, birthDate, togetherSince }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
      setSaving(false);
    }
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="stack" style={{ gap: 6 }}>
        <span className="kicker">{t.profile.name}</span>
        <input
          className="input"
          maxLength={60}
          autoComplete="given-name"
          placeholder={t.profile.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <div className="stack" role="group" aria-label={t.profile.gender} style={{ gap: 6 }}>
        <span className="kicker">{t.profile.gender}</span>
        <div className="chips">
          {GENDERS.map((g) => (
            <button key={g} type="button" className="chip" aria-pressed={gender === g} onClick={() => setGender(g)}>
              {t.profile.genders[g]}
            </button>
          ))}
        </div>
        {gender && <span className="muted small">{t.profile.genderHint[gender]}</span>}
      </div>

      <DateSelect label={t.profile.birthDate} value={birthDate} onChange={setBirthDate} minYear={1920} max={today} />

      <div className="stack" style={{ gap: 6 }}>
        <DateSelect
          label={t.profile.togetherSince}
          value={togetherSince}
          onChange={setTogetherSince}
          minYear={Number(birthDate.slice(0, 4)) || 1920}
          max={today}
        />
        <span className="muted small">{t.profile.togetherHint}</span>
      </div>

      <button className="btn" type="submit" disabled={!valid || saving}>
        {saving ? t.profile.saving : onCancel ? t.profile.save : t.profile.continue}
      </button>
      {onCancel && (
        <button className="btn link" type="button" onClick={onCancel}>
          {t.profile.cancel}
        </button>
      )}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
