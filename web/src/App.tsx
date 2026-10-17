import { type ReactNode, useCallback, useEffect, useState } from 'react';

import { api, type Checkin, type Me, type PartnerCycle, type TodayTip, subscribeToUpdates } from './api';
import { t } from './i18n';
import { CalendarIcon, HomeIcon, IdeaIcon, MoonIcon, UserIcon } from './icons';
import { localIsoDate } from './lib';
import { Calendar } from './screens/Calendar';
import { CheckInSheet } from './screens/CheckInSheet';
import { Cycle } from './screens/Cycle';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Onboarding } from './screens/Onboarding';
import { Profile } from './screens/Profile';
import { ProfileForm } from './screens/ProfileForm';
import { TipsScreen } from './screens/Tips';

type Tab = 'nosotros' | 'calendario' | 'consejos' | 'ciclo' | 'perfil';

const TABS: { id: Tab; icon: ReactNode; label: string }[] = [
  { id: 'nosotros', icon: <HomeIcon />, label: t.tabs.nosotros },
  { id: 'calendario', icon: <CalendarIcon />, label: t.tabs.calendario },
  { id: 'consejos', icon: <IdeaIcon />, label: t.tabs.consejos },
  { id: 'ciclo', icon: <MoonIcon />, label: t.tabs.ciclo },
  { id: 'perfil', icon: <UserIcon />, label: t.tabs.perfil },
];

export function App() {
  // undefined = todavía cargando; null = sin sesión.
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('nosotros');
  const [week, setWeek] = useState<Checkin[]>([]);
  const [tip, setTip] = useState<TodayTip | null>(null);
  const [partnerCycle, setPartnerCycle] = useState<PartnerCycle | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

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

  // El ciclo de la pareja no llega por SSE: se vuelve a pedir al volver a "Nosotros".
  useEffect(() => {
    if (paired && tab === 'nosotros') api.partnerCycle().then(setPartnerCycle, () => undefined);
  }, [paired, tab]);

  useEffect(() => {
    if (!paired) return;
    refresh().catch(() => undefined);
    return subscribeToUpdates(() => refresh().catch(() => undefined));
  }, [paired, refresh]);

  if (me === undefined) {
    return (
      <div className="app splash">
        <main className="page center">
          <div className="brand">in2u</div>
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
            <div className="brand">in2u</div>
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
          <Home me={me} week={week} partnerCycle={partnerCycle} onCheckIn={() => setCheckingIn(true)} />
        )}
        {tab === 'calendario' && <Calendar me={me} />}
        {tab === 'consejos' && <TipsScreen tip={tip} />}
        {tab === 'ciclo' && <Cycle me={me} />}
        {tab === 'perfil' && <Profile me={me} onChange={setMe} onSignedOut={() => setMe(null)} />}
      </main>

      <nav className="nav" aria-label="Principal">
        <div className="nav-inner">
          {TABS.map((item) => (
            <button
              key={item.id}
              aria-current={tab === item.id ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
              onClick={() => setTab(item.id)}
            >
              {item.icon}
              <span className="label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

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
