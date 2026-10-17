import type { Checkin, Me } from '../api';
import { moodEmoji, t } from '../i18n';
import { firstName, localIsoDate, weekDays } from '../lib';

export function Home({ me, week, onCheckIn }: { me: Me; week: Checkin[]; onCheckIn: () => void }) {
  const partnerName = firstName(me.partner?.name, '—');
  const today = localIsoDate(new Date());
  const mine = week.find((c) => c.mine && c.date === today);
  const partner = week.find((c) => !c.mine && c.date === today);

  return (
    <>
      <h1>{t.tabs.nosotros}</h1>

      <section className="card" aria-label={partnerName}>
        <p className="kicker">{partnerName}</p>
        {partner ? (
          <div className="mood-row">
            <span className="mood-big" aria-hidden>
              {moodEmoji(partner.mood)}
            </span>
            <div>
              <h2>{t.moods[partner.mood]}</h2>
              {partner.note && <p className="muted">“{partner.note}”</p>}
            </div>
          </div>
        ) : (
          <p className="muted">{t.nosotros.partnerNoCheckinYet(partnerName)}</p>
        )}
      </section>

      <section className="card">
        <p className="kicker">{t.nosotros.you}</p>
        {mine ? (
          <div className="mood-row">
            <span className="mood-big" aria-hidden>
              {moodEmoji(mine.mood)}
            </span>
            <div style={{ flex: 1 }}>
              <h2>{t.moods[mine.mood]}</h2>
              {mine.note && <p className="muted">“{mine.note}”</p>}
            </div>
            <button className="btn secondary" onClick={onCheckIn}>
              {t.nosotros.change}
            </button>
          </div>
        ) : (
          <>
            <h2>{t.nosotros.checkInPrompt}</h2>
            <p className="muted small">{t.nosotros.tapToChoose(partnerName)}</p>
            <button className="btn" onClick={onCheckIn}>
              {t.nosotros.checkInPrompt}
            </button>
          </>
        )}
      </section>

      <section className="card">
        <p className="kicker">{t.nosotros.week}</p>
        <div className="week">
          {weekDays(week).map((d) => (
            <div key={d.date} className={`day${d.isToday ? ' today' : ''}`}>
              <span className="wd">{t.weekdays[d.weekday]}</span>
              <span className="em" aria-label={d.partner ? t.moods[d.partner.mood] : undefined}>
                {d.partner ? moodEmoji(d.partner.mood) : '·'}
              </span>
              <span className="em" aria-label={d.mine ? t.moods[d.mine.mood] : undefined}>
                {d.mine ? moodEmoji(d.mine.mood) : '·'}
              </span>
            </div>
          ))}
        </div>
        <p className="muted small">
          {partnerName} · {t.nosotros.you}
        </p>
      </section>
    </>
  );
}
