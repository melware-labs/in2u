import type { Checkin, Me, PartnerCycle } from '../api';
import { Emoji } from '../Emoji';
import { moodEmoji, t } from '../i18n';
import { firstName, localIsoDate, weekDays } from '../lib';
import { CARE_TIPS } from '../tips';

function CycleCareCard({ partner, cycle }: { partner: string; cycle: PartnerCycle }) {
  if (cycle.visibility === 'nada' || !cycle.hasData) return null;

  if (cycle.visibility === 'avisos') {
    return cycle.careMode ? (
      <section className="card">
        <p className="kicker">{t.cuidar.title}</p>
        <p>{t.cuidar.careMode(partner)}</p>
      </section>
    ) : null;
  }

  const soon = (cycle.daysUntilNextPeriod ?? 99) <= 1;
  const near = (cycle.daysUntilNextPeriod ?? 99) <= 3;
  return (
    <>
      <section className="card">
        <p className="kicker">{t.cuidar.cycleOf(partner, t.ciclo.phases[cycle.phase ?? 'menstrual'])}</p>
        <h2>{t.cuidar.dayOfCycle(cycle.dayOfCycle ?? 0)}</h2>
        {near && <p>{soon ? t.cuidar.arrivingSoon : t.cuidar.arrivingIn(cycle.daysUntilNextPeriod ?? 0)}</p>}
        <p className="muted small">{t.cuidar.hint}</p>
        <p className="muted small">{t.cuidar.shared(partner)}</p>
      </section>
      {(cycle.phase === 'menstrual' || cycle.phase === 'lutea') && (
        <>
          <p className="kicker">{t.cuidar.title}</p>
          {CARE_TIPS.map((tip) => (
            <article key={tip.key} className="card">
              <h2>{tip.title}</h2>
              <p className="muted">{tip.body}</p>
            </article>
          ))}
        </>
      )}
    </>
  );
}

function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  return h < 12 ? t.nosotros.greeting.morning : h < 19 ? t.nosotros.greeting.afternoon : t.nosotros.greeting.evening;
}

export function Home({
  me,
  week,
  partnerCycle,
  onCheckIn,
}: {
  me: Me;
  week: Checkin[];
  partnerCycle: PartnerCycle | null;
  onCheckIn: () => void;
}) {
  const partnerName = firstName(me.partner?.name, '—');
  const today = localIsoDate(new Date());
  const mine = week.find((c) => c.mine && c.date === today);
  const partner = week.find((c) => !c.mine && c.date === today);

  return (
    <>
      <header className="row between" style={{ marginBottom: 8 }}>
        <div className="stack" style={{ gap: 4 }}>
          <h1>
            {greeting()}, {firstName(me.name, '')}
          </h1>
          <p className="couple">
            {firstName(me.name, '')} <span className="heart">♥</span> {partnerName}
          </p>
        </div>
        <div className="avatars" aria-hidden>
          <div className="avatar">{(firstName(me.name, '·')[0] ?? '·').toUpperCase()}</div>
          <div className="avatar partner">{(partnerName[0] ?? '·').toUpperCase()}</div>
        </div>
      </header>

      <section className="card coral" aria-label={partnerName}>
        <p className="kicker">{partnerName}</p>
        {partner ? (
          <div className="mood-row">
            <span className="mood-big" aria-hidden>
              <Emoji char={moodEmoji(partner.mood)} />
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

      <section className="card yellow">
        <p className="kicker">{t.nosotros.you}</p>
        {mine ? (
          <div className="mood-row">
            <span className="mood-big" aria-hidden>
              <Emoji char={moodEmoji(mine.mood)} />
            </span>
            <div style={{ flex: 1 }}>
              <h2>{t.moods[mine.mood]}</h2>
              {mine.note && <p className="muted">“{mine.note}”</p>}
            </div>
            <button className="btn secondary small-btn" onClick={onCheckIn}>
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

      {partnerCycle && <CycleCareCard partner={partnerName} cycle={partnerCycle} />}

      <section className="card strip">
        <p className="kicker">{t.nosotros.week}</p>
        <div className="week">
          {weekDays(week).map((d) => (
            <div key={d.date} className={`day${d.isToday ? ' today' : ''}`}>
              <span className="wd">{t.weekdays[d.weekday]}</span>
              <span className="em" aria-label={d.partner ? t.moods[d.partner.mood] : undefined}>
                {d.partner ? <Emoji char={moodEmoji(d.partner.mood)} /> : '·'}
              </span>
              <span className="em" aria-label={d.mine ? t.moods[d.mine.mood] : undefined}>
                {d.mine ? <Emoji char={moodEmoji(d.mine.mood)} /> : '·'}
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
