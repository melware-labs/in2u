import { useEffect, useRef, useState } from 'react';

import { api, type Checkin, type CoupleEvent, type GameState, type Me, type PartnerCycle, type Photo, type TodayTip } from '../api';
import { Emoji } from '../Emoji';
import { locale, moodEmoji, t } from '../i18n';
import { ChatIcon, GameIcon, IdeaIcon, PlusCircleIcon } from '../icons';
import { daysSince, firstName, localIsoDate, ofTheDay, parseLocalDate, weekDays } from '../lib';
import { DAILY_QUESTIONS } from '../questions';
import { CARE_TIPS, tipByKey } from '../tips';
import { PhotoCard } from './Album';
import { nextQuestion } from './Game';

export type HomeTarget = 'calendario' | 'consejos' | 'album' | 'juego' | 'perfil';

/** Carrusel horizontal de fotos del álbum: la tarjeta siguiente asoma y abajo van los puntitos. */
function PhotoCarousel({
  photos,
  onOpen,
  onAlbum,
}: {
  photos: Photo[];
  onOpen: (id: string) => void;
  onAlbum: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const shown = photos.slice(0, 8);

  if (shown.length === 0) {
    return (
      <button className="card photo-empty" onClick={onAlbum}>
        <PlusCircleIcon />
        <span>
          <strong>{t.inicio.addFirstPhoto}</strong>
          <br />
          <span className="muted small">{t.inicio.addFirstPhotoHint}</span>
        </span>
      </button>
    );
  }

  return (
    <section className="stack" style={{ gap: 10 }} aria-label={t.inicio.ourPhotos}>
      <div className="row between">
        <h2>{t.inicio.ourPhotos}</h2>
        <button className="btn link" onClick={onAlbum}>
          {t.inicio.seeAll}
        </button>
      </div>
      <div
        className="carousel"
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const card = el.firstElementChild as HTMLElement | null;
          if (card) setIndex(Math.round(el.scrollLeft / (card.offsetWidth + 14)));
        }}
      >
        {shown.map((p) => (
          <PhotoCard key={p.id} photo={p} className="slide" onOpen={() => onOpen(p.id)} />
        ))}
      </div>
      {shown.length > 1 && (
        <div className="dots-row" role="tablist">
          {shown.map((p, i) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1} / ${shown.length}`}
              className={i === index ? 'active' : ''}
              onClick={() => {
                const el = track.current;
                const card = el?.children[i] as HTMLElement | undefined;
                if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' });
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function CycleCareCard({ partner, cycle }: { partner: string; cycle: PartnerCycle }) {
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

function DaysTogetherCard({ since }: { since: string }) {
  const days = daysSince(since);
  return (
    <section className="card sky">
      <p className="kicker">
        {t.nosotros.since(parseLocalDate(since).toLocaleDateString(locale, { dateStyle: 'long' }))}
      </p>
      <h2>{days > 0 ? t.nosotros.daysTogether(days) : t.nosotros.firstDay}</h2>
    </section>
  );
}

function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  return h < 12 ? t.nosotros.greeting.morning : h < 19 ? t.nosotros.greeting.afternoon : t.nosotros.greeting.evening;
}

/** Lunes de la semana de `now`, a medianoche local. */
function weekStart(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export function Home({
  me,
  week,
  tip,
  partnerCycle,
  versions,
  onCheckIn,
  onGo,
  onOpenPhoto,
  onAsk,
}: {
  me: Me;
  week: Checkin[];
  tip: TodayTip | null;
  partnerCycle: PartnerCycle | null;
  /** Cambian cuando la pareja toca el álbum, el calendario o el juego. */
  versions: { album: number; game: number };
  onCheckIn: () => void;
  onGo: (target: HomeTarget) => void;
  onOpenPhoto: (id: string) => void;
  /** Lleva la pregunta del día al chat. */
  onAsk: (question: string) => void;
}) {
  const partnerName = firstName(me.partner?.name, '—');
  const myInitial = (firstName(me.name, '·')[0] ?? '·').toUpperCase();
  const partnerInitial = (partnerName[0] ?? '·').toUpperCase();
  const today = localIsoDate(new Date());
  const mine = week.find((c) => c.mine && c.date === today);
  const partner = week.find((c) => !c.mine && c.date === today);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [events, setEvents] = useState<CoupleEvent[]>([]);
  const [selected, setSelected] = useState(today);
  const [game, setGame] = useState<GameState | null>(null);
  const question = ofTheDay(DAILY_QUESTIONS);
  const curated = tip ? tipByKey(tip.tipKey) : undefined;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = weekStart(new Date());
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    api.photos().then(setPhotos, () => setPhotos([]));
  }, [versions.album]);

  useEffect(() => {
    api.game().then(setGame, () => undefined);
  }, [versions.game]);

  useEffect(() => {
    const from = weekStart(new Date());
    api.events(from, new Date(from.getTime() + 60 * 86_400_000)).then(setEvents, () => setEvents([]));
  }, []);

  const eventsOn = (key: string) => events.filter((e) => localIsoDate(new Date(e.startsAt)) === key);
  const dayEvents = eventsOn(selected);
  const nextShared = events.find((e) => e.visibility === 'los_dos' && new Date(e.endsAt) >= new Date());
  const pendingFromPartner = game?.questions.some((q) => q.partnerAnswered && q.mySelf == null);

  return (
    <>
      <header className="home-head">
        <div className="stack" style={{ gap: 4 }}>
          <h1 className="home-title">
            {greeting()}, {firstName(me.name, '')}
          </h1>
          <p className="couple">
            {firstName(me.name, '')} <span className="heart">♥</span> {partnerName}
          </p>
        </div>
        <button className="profile-btn" aria-label={t.tabs.perfil} title={t.tabs.perfil} onClick={() => onGo('perfil')}>
          {myInitial}
        </button>
      </header>

      {me.togetherSince && <DaysTogetherCard since={me.togetherSince} />}

      <div className="week-strip" role="tablist" aria-label={t.nosotros.week}>
        {days.map((d) => {
          const key = localIsoDate(d);
          return (
            <button
              key={key}
              role="tab"
              aria-selected={key === selected}
              className={`wk-day${key === today ? ' today' : ''}`}
              onClick={() => setSelected(key)}
            >
              <span className="wk-num">{d.getDate()}</span>
              <span className="wk-name cap">{d.toLocaleDateString(undefined, { weekday: 'short' }).replace('.', '')}</span>
              <span className={`wk-dot${eventsOn(key).length ? ' on' : ''}`} aria-hidden />
            </button>
          );
        })}
      </div>

      <div className="cols">
        <div className="col">
          <section className="stack" style={{ gap: 12 }}>
            <h2 className="section-title">{selected === today ? t.inicio.scheduleToday : t.inicio.scheduleDay}</h2>
            {dayEvents.length === 0 ? (
              <div className="agenda-empty">
                <p className="muted">{t.inicio.noPlan}</p>
                {nextShared && (
                  <p className="small">
                    {t.inicio.nextPlan}: <strong>{nextShared.title}</strong>
                  </p>
                )}
              </div>
            ) : (
              <div className="agenda">
                {dayEvents.map((e) => (
                  <div key={e.id} className="agenda-row">
                    <span className="agenda-time">{hhmm(e.startsAt)}</span>
                    <button
                      className={`event-card ${e.visibility === 'los_dos' ? 'red' : 'navy'}`}
                      onClick={() => onGo('calendario')}
                    >
                      <span className="event-title">{e.title}</span>
                      <span className="event-foot">
                        <span className="event-time">
                          {hhmm(e.startsAt)} – {hhmm(e.endsAt)}
                        </span>
                        <span className="mini-avatars" aria-hidden>
                          <span>{e.visibility === 'los_dos' || e.mine ? myInitial : partnerInitial}</span>
                          {e.visibility === 'los_dos' && <span>{partnerInitial}</span>}
                        </span>
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {photos && <PhotoCarousel photos={photos} onOpen={onOpenPhoto} onAlbum={() => onGo('album')} />}

          <section className="stack" style={{ gap: 12 }}>
            <h2 className="section-title">{t.inicio.reminders}</h2>
            <button className="reminder" onClick={() => onAsk(question)}>
              <span className="reminder-icon">
                <ChatIcon />
              </span>
              <span className="reminder-text">
                <span className="reminder-kicker">{t.inicio.questionOfDay}</span>
                <span className="reminder-title">{question}</span>
              </span>
            </button>
            <button className="reminder" onClick={() => onGo('consejos')}>
              <span className="reminder-icon">
                <IdeaIcon />
              </span>
              <span className="reminder-text">
                <span className="reminder-kicker">
                  {t.inicio.tipOfDay}
                  {tip && ` · ${tip.kicker}`}
                </span>
                <span className="reminder-title">
                  {tip ? (curated ? curated.title : tip.advice) : t.inicio.tipEmpty(partnerName)}
                </span>
              </span>
            </button>
            {game && nextQuestion(game) && (
              <button className="reminder" onClick={() => onGo('juego')}>
                <span className="reminder-icon">
                  <GameIcon />
                </span>
                <span className="reminder-text">
                  <span className="reminder-kicker">{t.inicio.game}</span>
                  <span className="reminder-title">
                    {pendingFromPartner ? t.inicio.gamePending(partnerName) : t.inicio.gameInvite}
                  </span>
                </span>
              </button>
            )}
          </section>
        </div>

        <div className="col">
          <h2 className="section-title">{t.inicio.moodToday}</h2>
          <section className="card" aria-label={partnerName}>
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

          <section className="card">
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
        </div>
      </div>

      <button className="btn big" onClick={() => onGo('calendario')}>
        {t.inicio.newPlan}
      </button>
    </>
  );
}
