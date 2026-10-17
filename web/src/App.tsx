import { type ReactNode, useCallback, useEffect, useState } from 'react';

import { api, type Checkin, type Me, type PartnerCycle, type TodayTip, subscribeToUpdates } from './api';
import { Brand } from './Brand';
import { t } from './i18n';
import {
  AlbumIcon,
  CalendarIcon,
  ChatIcon,
  GameIcon,
  HomeIcon,
  IdeaIcon,
  MoonIcon,
  MoreIcon,
} from './icons';
import { localIsoDate } from './lib';
import { Album } from './screens/Album';
import { Calendar } from './screens/Calendar';
import { Chat } from './screens/Chat';
import { CheckInSheet } from './screens/CheckInSheet';
import { Cycle, PartnerCycleScreen } from './screens/Cycle';
import { Game } from './screens/Game';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Onboarding } from './screens/Onboarding';
import { Profile } from './screens/Profile';
import { ProfileForm } from './screens/ProfileForm';
import { TipsScreen } from './screens/Tips';

type Tab = 'nosotros' | 'calendario' | 'chat' | 'album' | 'juego' | 'consejos' | 'ciclo' | 'perfil';

/**
 * En el celular la barra muestra las primeras cuatro y el resto va en "Más"; en la compu se ven todas.
 * Perfil no está aquí: se abre tocando la foto de perfil en Inicio.
 */
const TABS: { id: Tab; icon: ReactNode; label: string; more?: boolean }[] = [
  { id: 'nosotros', icon: <HomeIcon />, label: t.tabs.nosotros },
  { id: 'calendario', icon: <CalendarIcon />, label: t.tabs.calendario },
  { id: 'chat', icon: <ChatIcon />, label: t.tabs.chat },
  { id: 'album', icon: <AlbumIcon />, label: t.tabs.album },
  { id: 'juego', icon: <GameIcon />, label: t.tabs.juego, more: true },
  { id: 'consejos', icon: <IdeaIcon />, label: t.tabs.consejos, more: true },
  { id: 'ciclo', icon: <MoonIcon />, label: t.tabs.ciclo, more: true },
];

export function App() {
  // undefined = todavía cargando; null = sin sesión.
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('nosotros');
  const [week, setWeek] = useState<Checkin[]>([]);
  const [tip, setTip] = useState<TodayTip | null>(null);
  const [partnerCycle, setPartnerCycle] = useState<PartnerCycle | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // Contadores que cambian con cada aviso en tiempo real, para que cada pantalla recargue lo suyo.
  const [versions, setVersions] = useState({ chat: 0, album: 0, game: 0 });
  const [chatUnread, setChatUnread] = useState(false);
  const [photoFocus, setPhotoFocus] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState<string | null>(null);
  const clearDraft = useCallback(() => setChatDraft(null), []);

  useEffect(() => {
    api.me().then(setMe, () => setMe(null));
  }, []);

  // Una vez por sesión: el navegador le dice al backend su zona horaria, para
  // que "hoy" sea el día de cada quien y no el del servidor.
  useEffect(() => {
    if (!me) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== me.timezone) api.setTimezone(tz).then(setMe, () => undefined);
  }, [me?.email, me?.timezone]); // eslint-disable-line react-hooks/exhaustive-deps

  const paired = me?.state === 'paired';

  const refresh = useCallback(async () => {
    const [w, tp, pc] = await Promise.all([api.week(), api.todayTip(), api.partnerCycle()]);
    setWeek(w);
    setTip(tp);
    setPartnerCycle(pc);
  }, []);

  // El ciclo de la pareja no llega por SSE: se vuelve a pedir al volver a "Nosotros" o "Ciclo".
  useEffect(() => {
    if (paired && (tab === 'nosotros' || tab === 'ciclo')) api.partnerCycle().then(setPartnerCycle, () => undefined);
  }, [paired, tab]);

  useEffect(() => {
    if (!paired) return;
    refresh().catch(() => undefined);
    return subscribeToUpdates((kind) => {
      if (kind === 'chat' || kind === 'album' || kind === 'game') {
        setVersions((v) => ({ ...v, [kind]: v[kind] + 1 }));
        if (kind === 'chat') setChatUnread(true);
        return;
      }
      if (kind === 'open') setVersions((v) => ({ chat: v.chat + 1, album: v.album + 1, game: v.game + 1 }));
      refresh().catch(() => undefined);
    });
  }, [paired, refresh]);

  // Estando en el chat no hay nada "sin leer".
  useEffect(() => {
    if (tab === 'chat') setChatUnread(false);
  }, [tab, versions.chat]);

  const go = useCallback((next: Tab) => {
    setTab(next);
    setMoreOpen(false);
    if (next !== 'album') setPhotoFocus(null);
    window.scrollTo({ top: 0 });
  }, []);

  if (me === undefined) {
    return (
      <div className="app splash">
        <main className="page center">
          <Brand />
          <p className="muted">{t.loading}</p>
        </main>
      </div>
    );
  }

  if (me === null) return <Login />;
  // Lo primero al crear la cuenta (y para las cuentas viejas que no lo tienen).
  if (!me.profileComplete) {
    return (
      <div className="app splash">
        <main className="page center">
          <div className="stack" style={{ alignItems: 'center' }}>
            <Brand />
            <h1>{t.profile.title}</h1>
            <p className="muted">{t.profile.subtitle}</p>
          </div>
          <ProfileForm me={me} onSaved={setMe} />
        </main>
      </div>
    );
  }
  if (me.state !== 'paired') return <Onboarding me={me} onChange={setMe} />;

  return (
    <div className="app">
      <main className="page">
        {tab === 'nosotros' && (
          <Home
            me={me}
            week={week}
            tip={tip}
            partnerCycle={partnerCycle}
            versions={versions}
            onCheckIn={() => setCheckingIn(true)}
            onGo={go}
            onOpenPhoto={(id) => {
              go('album');
              setPhotoFocus(id);
            }}
            onAsk={(question) => {
              setChatDraft(question);
              go('chat');
            }}
          />
        )}
        {tab === 'calendario' && <Calendar me={me} />}
        {tab === 'chat' && <Chat me={me} version={versions.chat} draft={chatDraft} onDraftUsed={clearDraft} />}
        {tab === 'album' && (
          <Album
            me={me}
            version={versions.album}
            focus={photoFocus}
            onFocus={(id) => {
              setPhotoFocus(id);
              window.scrollTo({ top: 0 });
            }}
          />
        )}
        {tab === 'juego' && <Game me={me} version={versions.game} />}
        {tab === 'consejos' && <TipsScreen tip={tip} />}
        {tab === 'ciclo' &&
          (me.gender === 'hombre' ? <PartnerCycleScreen me={me} cycle={partnerCycle} /> : <Cycle me={me} />)}
        {tab === 'perfil' && <Profile me={me} onChange={setMe} onSignedOut={() => setMe(null)} />}
      </main>

      <nav className="nav" aria-label="Principal">
        <div className="nav-inner">
          <div className="nav-brand" aria-hidden>
            in2u
          </div>
          {TABS.map((item) => (
            <button
              key={item.id}
              className={`${item.more ? 'in-more' : ''}${item.id === 'chat' && chatUnread ? ' unread' : ''}`}
              aria-current={tab === item.id ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
              onClick={() => go(item.id)}
            >
              {item.icon}
              <span className="label">{item.label}</span>
            </button>
          ))}
          <button
            className="more-btn"
            aria-current={TABS.some((i) => i.more && i.id === tab) ? 'page' : undefined}
            aria-label={t.tabs.mas}
            aria-expanded={moreOpen}
            title={t.tabs.mas}
            onClick={() => setMoreOpen(true)}
          >
            <MoreIcon />
            <span className="label">{TABS.find((i) => i.more && i.id === tab)?.label ?? t.tabs.mas}</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="sheet-bg" onClick={() => setMoreOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={t.tabs.mas} onClick={(e) => e.stopPropagation()}>
            <div className="more-grid">
              {TABS.filter((i) => i.more).map((item) => (
                <button
                  key={item.id}
                  className="more-item"
                  aria-current={tab === item.id ? 'page' : undefined}
                  onClick={() => go(item.id)}
                >
                  <span className="more-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {checkingIn && (
        <CheckInSheet
          me={me}
          current={week.find((c) => c.mine && c.date === localIsoDate(new Date()))}
          onClose={() => setCheckingIn(false)}
          onSaved={() => {
            setCheckingIn(false);
            refresh().catch(() => undefined);
          }}
        />
      )}
    </div>
  );
}
