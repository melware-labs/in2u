import { useState } from 'react';

import { api, type Checkin, type Me } from '../api';
import { Emoji } from '../Emoji';
import { MOODS, t } from '../i18n';
import { firstName } from '../lib';

export function CheckInSheet({
  me,
  current,
  onClose,
  onSaved,
}: {
  me: Me;
  current?: Checkin;
  onClose: () => void;
  onSaved: () => void;
}) {
  const partnerName = firstName(me.partner?.name, '—');
  const [mood, setMood] = useState<number | null>(current?.mood ?? null);
  const [note, setNote] = useState(current?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (mood === null) return;
    setSaving(true);
    setError(null);
    try {
      await api.saveMood(mood, note);
      onSaved();
    } catch {
      setError(t.checkIn.saveError);
      setSaving(false);
    }
  }

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={t.checkIn.title} onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <button className="btn link" onClick={onClose}>
            {t.checkIn.cancel}
          </button>
          <span className="kicker">{t.checkIn.onePerDay}</span>
        </div>
        <h1>{t.checkIn.title}</h1>

        <div className="stack" role="group" aria-label={t.checkIn.title}>
          {MOODS.map((m) => (
            <button key={m.mood} className="mood-option" aria-pressed={mood === m.mood} onClick={() => setMood(m.mood)}>
              <span className="em" aria-hidden>
                <Emoji char={m.emoji} />
              </span>
              {t.moods[m.mood]}
            </button>
          ))}
        </div>

        <label className="stack">
          <span className="kicker">{t.checkIn.noteOptional}</span>
          <textarea
            className="input"
            rows={2}
            maxLength={500}
            placeholder={t.checkIn.notePlaceholder(partnerName)}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <button className="btn" disabled={mood === null || saving} onClick={save}>
          {saving ? t.checkIn.saving : t.checkIn.shareWith(partnerName)}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
