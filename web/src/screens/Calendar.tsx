import { useCallback, useEffect, useMemo, useState } from 'react';

import { api, type CoupleEvent, type Me } from '../api';
import { locale, t } from '../i18n';
import { firstName, localIsoDate, monthGrid } from '../lib';
import { CalendarIcon, ChevronIcon, ClockIcon, PlusCircleIcon } from '../icons';
import { NewEventSheet } from './NewEventSheet';

const INTL = locale === 'en' ? 'en-US' : 'es-ES';

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(INTL, { hour: '2-digit', minute: '2-digit' });

export function Calendar({ me }: { me: Me }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(localIsoDate(now));
  const [events, setEvents] = useState<CoupleEvent[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const partnerName = firstName(me.partner?.name, '—');

  const load = useCallback(async () => {
    const from = cells[0].date;
    const to = new Date(cells[cells.length - 1].date);
    to.setDate(to.getDate() + 1);
    try {
      setEvents(await api.events(from, to));
    } catch {
      setError(t.error);
    }
  }, [cells]);

  useEffect(() => {
    load();
  }, [load]);

  // Agrupa por día LOCAL de inicio (no por el día UTC del ISO).
  const byDay = useMemo(() => {
    const map = new Map<string, CoupleEvent[]>();
    for (const e of events) {
      const key = localIsoDate(new Date(e.startsAt));
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return map;
  }, [events]);

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  async function remove(id: string) {
    try {
      await api.deleteEvent(id);
      await load();
    } catch {
      setError(t.error);
    }
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString(INTL, { month: 'long', year: 'numeric' });
  const dayEvents = byDay.get(selected) ?? [];
  const selectedLabel = new Date(`${selected}T00:00:00`).toLocaleDateString(INTL, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <>
      <div className="stack" style={{ gap: 4 }}>
        <h1>{t.calendario.title}</h1>
        <p className="couple">
          {firstName(me.name, '')} <span className="heart">♥</span> {partnerName}
        </p>
      </div>

      <section className="card strip">
        <div className="cal-head">
          <span className="badge" aria-hidden>
            <CalendarIcon size={18} />
          </span>
          <h2 className="cap">{monthLabel}</h2>
          <button className="round-btn" onClick={() => shift(-1)} aria-label={t.calendario.prev}>
            <ChevronIcon dir="left" />
          </button>
          <button className="round-btn" onClick={() => shift(1)} aria-label={t.calendario.next}>
            <ChevronIcon dir="right" />
          </button>
        </div>

        <div className="cal-grid" role="grid" aria-label={monthLabel}>
          {t.weekdaysMonFirst.map((w, i) => (
            <span key={i} className="wd">
              {w}
            </span>
          ))}
          {cells.map((c) => {
            const list = byDay.get(c.dateKey) ?? [];
            return (
              <button
                key={c.dateKey}
                className={`cal-day${c.inMonth ? '' : ' out'}${c.isToday ? ' today' : ''}${selected === c.dateKey ? ' selected' : ''}`}
                aria-pressed={selected === c.dateKey}
                aria-label={c.date.toLocaleDateString(INTL, { day: 'numeric', month: 'long' })}
                onClick={() => setSelected(c.dateKey)}
              >
                {c.date.getDate()}
                <span className="dots" aria-hidden>
                  {list.some((e) => e.mine && e.visibility === 'solo_yo') && <i className="dot mine" />}
                  {list.some((e) => e.visibility === 'los_dos') && <i className="dot both" />}
                  {list.some((e) => !e.mine) && <i className="dot partner" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="legend small muted">
          <span><i className="dot mine" /> {t.calendario.legend.mine}</span>
          <span><i className="dot both" /> {t.calendario.legend.both}</span>
          <span><i className="dot partner" /> {t.calendario.legend.partner}</span>
        </div>
      </section>

      <button className="btn" onClick={() => setCreating(true)}>
        {t.calendario.new} <PlusCircleIcon />
      </button>

      <p className="kicker cap">
        {selectedLabel}
      </p>
      {dayEvents.length === 0 && <p className="muted">{t.calendario.noEvents}</p>}
      {dayEvents.map((e) => (
        <article key={e.id} className={`bubble ${!e.mine ? 'sky' : e.visibility === 'los_dos' ? 'coral' : 'yellow'}`}>
          <div className="row between">
            <div className="stack" style={{ gap: 6 }}>
              <h2>{e.title}</h2>
              <p className="meta">
                <ClockIcon /> {timeLabel(e.startsAt)} – {timeLabel(e.endsAt)}
              </p>
            </div>
            <span className="pill">
              {!e.mine ? t.calendario.partners(partnerName) : e.visibility === 'los_dos' ? t.calendario.shared : t.calendario.mine}
            </span>
          </div>
          {e.mine && (
            <button className="btn link" style={{ alignSelf: 'flex-end', padding: 0 }} onClick={() => remove(e.id)}>
              {t.calendario.remove}
            </button>
          )}
        </article>
      ))}
      {error && <p className="error">{error}</p>}

      {creating && (
        <NewEventSheet
          me={me}
          initialDate={selected}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </>
  );
}
