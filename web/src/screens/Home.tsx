import { useEffect, useRef, useState } from 'react';

import { api, type Checkin, type CoupleEvent, type GameState, type Me, type PartnerCycle, type Photo, type TodayTip } from '../api';
import { Emoji } from '../Emoji';
import { moodEmoji, t } from '../i18n';
import { ChatIcon, ClockIcon, PlusCircleIcon } from '../icons';
import { firstName, localIsoDate, ofTheDay, parseLocalDate, weekDays } from '../lib';
import { DAILY_QUESTIONS } from '../questions';
import { CARE_TIPS, tipByKey } from '../tips';
import { PhotoCard } from './Album';
import { nextQuestion } from './Game';

export type HomeTarget = 'calendario' | 'consejos' | 'album' | 'juego';

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

function NextPlanCard({ event, onCalendar }: { event: CoupleEvent | null | undefined; onCalendar: () => void }) {
  if (event === undefined) return null;
  if (!event) {
    return (
      <section className="card">
        <p className="kicker">{t.inicio.nextPlan}</p>
        <h2>{t.inicio.noPlan}</h2>
        <p className="muted small">{t.inicio.planIdea}</p>
        <button className="btn secondary small-btn" style={{ alignSelf: 'flex-start' }} onClick={onCalendar}>
          {t.inicio.createPlan}
        </button>
      </section>
    );
  }
  const start = new Date(event.startsAt);
  const days = Math.round(
    (parseLocalDate(localIsoDate(start)).getTime() - parseLocalDate(localIsoDate(new Date())).getTime()) / 86_400_000,
  );
  return (
    <button className="bubble coral plan" onClick={onCalendar}>
      <span className="kicker">{t.inicio.nextPlan}</span>
      <h2>{event.title}</h2>
      <span className="meta">
        <ClockIcon />
        <span className="cap">
          {start.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
          {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </span>
      </span>
      <span className="pill" style={{ alignSelf: 'flex-start' }}>
        {t.inicio.inDays(days)}
      </span>
    </button>
  );
}

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
  const today = localIsoDate(new Date());
  const mine = week.find((c) => c.mine && c.date === today);
  const partner = week.find((c) => !c.mine && c.date === today);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  // undefined = cargando; null = no hay planes de los dos.
  const [plan, setPlan] = useState<CoupleEvent | null | undefined>(undefined);
  const [game, setGame] = useState<GameState | null>(null);
  const question = ofTheDay(DAILY_QUESTIONS);
  const curated = tip ? tipByKey(tip.tipKey) : undefined;

  useEffect(() => {
    api.photos().then(setPhotos, () => setPhotos([]));
  }, [versions.album]);

  useEffect(() => {
    api.game().then(setGame, () => undefined);
  }, [versions.game]);

  useEffect(() => {
    const now = new Date();
    api.events(now, new Date(now.getTime() + 60 * 86_400_000)).then(
      (list) => setPlan(list.find((e) => e.visibility === 'los_dos' && new Date(e.endsAt) >= now) ?? null),
      () => setPlan(null),
    );
  }, []);

  const pendingFromPartner = game?.questions.some((q) => q.partnerAnswered && q.mySelf == null);

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

      {photos && <PhotoCarousel photos={photos} onOpen={onOpenPhoto} onAlbum={() => onGo('album')} />}

      <div className="cols">
        <div className="col">
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
          <NextPlanCard event={plan} onCalendar={() => onGo('calendario')} />

          <section className="card sky">
            <p className="kicker">{t.inicio.questionOfDay}</p>
            <h2 className="question">{question}</h2>
            <button className="btn small-btn" style={{ alignSelf: 'flex-start' }} onClick={() => onAsk(question)}>
              <ChatIcon /> {t.inicio.talkInChat}
            </button>
          </section>
        </div>
        <div className="col">
          {partnerCycle && <CycleCareCard partner={partnerName} cycle={partnerCycle} />}

          <section className="card yellow">
            <p className="kicker">
              {t.inicio.tipOfDay}
              {tip && ` · ${tip.kicker}`}
            </p>
            {tip ? (
              <>
                {curated && <h2>{curated.title}</h2>}
                <p>{tip.advice}</p>
              </>
            ) : (
              <p className="muted">{t.inicio.tipEmpty(partnerName)}</p>
            )}
            <button className="btn link" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => onGo('consejos')}>
              {t.inicio.moreTips}
            </button>
          </section>

          {game && nextQuestion(game) && (
            <section className="card">
              <p className="kicker">{t.inicio.game}</p>
              <p>{pendingFromPartner ? t.inicio.gamePending(partnerName) : t.inicio.gameInvite}</p>
              <button className="btn secondary small-btn" style={{ alignSelf: 'flex-start' }} onClick={() => onGo('juego')}>
                {t.inicio.play}
              </button>
            </section>
          )}

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
    </>
  );
}
