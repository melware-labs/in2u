import { useEffect, useMemo, useState } from 'react';

import { api, SYMPTOMS, type Me, type OwnCycle, type Symptom, type Visibility } from '../api';
import { locale, t } from '../i18n';
import { cycleGrid, firstName, localIsoDate, parseLocalDate } from '../lib';

const INTL = locale === 'en' ? 'en-US' : 'es-ES';
const fmt = (key: string) => parseLocalDate(key).toLocaleDateString(INTL, { day: 'numeric', month: 'short' });

export function Cycle({ me }: { me: Me }) {
  const now = new Date();
  const [data, setData] = useState<OwnCycle | null>(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [error, setError] = useState<string | null>(null);
  const partnerName = firstName(me.partner?.name, '—');

  useEffect(() => {
    api.cycle().then(setData, () => setError(t.error));
  }, []);

  const cells = useMemo(
    () => (data ? cycleGrid(year, month, data.periodStarts, data.cycleLengthDays, data.periodLengthDays) : []),
    [data, year, month],
  );

  async function run(action: () => Promise<OwnCycle>) {
    setError(null);
    try {
      setData(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : t.ciclo.saveError);
    }
  }

  if (!data) return <p className="muted">{error ?? t.loading}</p>;

  const today = localIsoDate(new Date());
  const toggleStart = (key: string) => {
    if (key > today) return; // no se registra un inicio en el futuro
    run(() => (data.periodStarts.includes(key) ? api.removePeriod(key) : api.addPeriod(key)));
  };
  const toggleSymptom = (s: Symptom) => {
    const next = data.todaySymptoms.includes(s) ? data.todaySymptoms.filter((x) => x !== s) : [...data.todaySymptoms, s];
    run(() => api.setSymptoms(next));
  };
  const setVisibility = (v: Visibility) =>
    run(() => api.cycleSettings(data.cycleLengthDays, data.periodLengthDays, v));
  const setLengths = (cycle: number, period: number) =>
    run(() => api.cycleSettings(cycle, period, data.partnerVisibility));

  const monthLabel = new Date(year, month, 1).toLocaleDateString(INTL, { month: 'long', year: 'numeric' });
  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <>
      <h1>{t.ciclo.title}</h1>

      <section className="card">
        {data.today ? (
          <>
            <p className="kicker">{t.ciclo.phases[data.today.phase]}</p>
            <h2>{t.ciclo.dayOf(data.today.dayOfCycle, data.today.cycleLength)}</h2>
            <p className="muted">
              {t.ciclo.nextPeriod}: {fmt(data.today.nextPeriodDate)} · {t.ciclo.inDays(data.today.daysUntilNextPeriod)}
            </p>
            <p className="muted">
              {t.ciclo.fertileWindow}: {fmt(data.today.fertileWindowStart)} – {fmt(data.today.fertileWindowEnd)}
            </p>
          </>
        ) : (
          <p className="muted">{t.ciclo.notRegisteredYet}</p>
        )}
        <button
          className="btn"
          disabled={data.periodStarts.includes(today)}
          onClick={() => run(() => api.addPeriod(today))}
        >
          {data.periodStarts.includes(today) ? t.ciclo.startedToday : t.ciclo.logToday}
        </button>
        <p className="muted small">{t.ciclo.disclaimer}</p>
      </section>

      <section className="card">
        <p className="kicker">{t.ciclo.symptomsToday}</p>
        <div className="chips">
          {SYMPTOMS.map((s) => (
            <button key={s} className="chip" aria-pressed={data.todaySymptoms.includes(s)} onClick={() => toggleSymptom(s)}>
              {t.ciclo.symptoms[s]}
            </button>
          ))}
        </div>
      </section>

      <section className="card strip">
        <div className="row between">
          <button className="btn link" onClick={() => shift(-1)} aria-label={t.calendario.prev}>‹</button>
          <h2 className="cap">{monthLabel}</h2>
          <button className="btn link" onClick={() => shift(1)} aria-label={t.calendario.next}>›</button>
        </div>
        <div className="cal-grid">
          {t.weekdaysMonFirst.map((w, i) => (
            <span key={i} className="wd">{w}</span>
          ))}
          {cells.map((c) => (
            <button
              key={c.dateKey}
              className={`cal-day phase-${c.phase ?? 'none'}${c.inMonth ? '' : ' out'}${c.isToday ? ' today' : ''}${c.isRegisteredStart ? ' start' : ''}`}
              aria-pressed={c.isRegisteredStart}
              aria-label={`${c.date.toLocaleDateString(INTL, { day: 'numeric', month: 'long' })}${c.phase ? ' · ' + t.ciclo.phases[c.phase] : ''}`}
              onClick={() => toggleStart(c.dateKey)}
            >
              {c.date.getDate()}
            </button>
          ))}
        </div>
        <p className="muted small">{t.ciclo.calendarHint}</p>
      </section>

      <section className="card">
        <p className="kicker">{t.ciclo.settings}</p>
        <div className="row" style={{ gap: 12 }}>
          <label className="stack" style={{ flex: 1 }}>
            <span className="muted small">{t.ciclo.cycleDays}</span>
            <input
              className="input"
              type="number"
              min={20}
              max={45}
              value={data.cycleLengthDays}
              onChange={(e) => setLengths(Number(e.target.value), data.periodLengthDays)}
            />
          </label>
          <label className="stack" style={{ flex: 1 }}>
            <span className="muted small">{t.ciclo.periodDays}</span>
            <input
              className="input"
              type="number"
              min={1}
              max={10}
              value={data.periodLengthDays}
              onChange={(e) => setLengths(data.cycleLengthDays, Number(e.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="card">
        <p className="kicker">{t.ciclo.whatPartnerSees(partnerName)}</p>
        <div className="stack" role="radiogroup" aria-label={t.ciclo.whatPartnerSees(partnerName)}>
          {(['nada', 'avisos', 'fase_y_avisos'] as const).map((v) => (
            <button
              key={v}
              role="radio"
              aria-checked={data.partnerVisibility === v}
              className="mood-option"
              aria-pressed={data.partnerVisibility === v}
              onClick={() => setVisibility(v)}
            >
              {t.ciclo.visibility[v]}
            </button>
          ))}
        </div>
        <p className="muted small">{t.ciclo.privacyHint}</p>
      </section>

      {error && <p className="error">{error}</p>}
    </>
  );
}
