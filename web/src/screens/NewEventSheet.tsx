import { useState } from 'react';

import { api, type Me } from '../api';
import { t } from '../i18n';
import { firstName } from '../lib';

export function NewEventSheet({
  me,
  initialDate,
  onClose,
  onSaved,
}: {
  me: Me;
  initialDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const partnerName = firstName(me.partner?.name, '—');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [from, setFrom] = useState('19:00');
  const [to, setTo] = useState('20:00');
  const [visibility, setVisibility] = useState<'solo_yo' | 'los_dos'>('los_dos');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hora local del navegador → instante UTC que guarda el backend.
  const startsAt = new Date(`${date}T${from}`);
  const endsAt = new Date(`${date}T${to}`);
  const valid = title.trim().length > 0 && !isNaN(startsAt.getTime()) && endsAt >= startsAt;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.createEvent({
        title: title.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        visibility,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.newEvent.saveError);
      setSaving(false);
    }
  }

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={t.newEvent.title} onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <button className="btn link" onClick={onClose}>
            {t.newEvent.cancel}
          </button>
          <span className="kicker">{t.newEvent.title}</span>
        </div>

        <input
          className="input"
          autoFocus
          maxLength={120}
          placeholder={t.newEvent.titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="row" style={{ gap: 8 }}>
          <label className="stack" style={{ flex: 2 }}>
            <span className="kicker">{t.newEvent.date}</span>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="stack" style={{ flex: 1 }}>
            <span className="kicker">{t.newEvent.from}</span>
            <input className="input" type="time" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="stack" style={{ flex: 1 }}>
            <span className="kicker">{t.newEvent.to}</span>
            <input className="input" type="time" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>

        <div className="stack" role="group" aria-label={t.newEvent.visibleFor}>
          <span className="kicker">{t.newEvent.visibleFor}</span>
          <div className="row" style={{ gap: 8 }}>
            {(['los_dos', 'solo_yo'] as const).map((v) => (
              <button
                key={v}
                className="mood-option"
                style={{ justifyContent: 'center' }}
                aria-pressed={visibility === v}
                onClick={() => setVisibility(v)}
              >
                {v === 'los_dos' ? t.newEvent.bothOfUs : t.newEvent.onlyMe}
              </button>
            ))}
          </div>
          <p className="muted small">
            {visibility === 'los_dos' ? t.newEvent.partnerSeesIt(partnerName) : t.newEvent.onlyYouSeeIt}
          </p>
        </div>

        <button className="btn" disabled={!valid || saving} onClick={save}>
          {saving ? t.newEvent.saving : t.newEvent.save}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
