import { useCallback, useEffect, useState } from 'react';

import { api, type Checkin, type Me, type TodayTip, subscribeToUpdates } from './api';
import { t } from './i18n';
import { localIsoDate } from './lib';
import { CheckInSheet } from './screens/CheckInSheet';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Onboarding } from './screens/Onboarding';
import { Profile } from './screens/Profile';
import { TipsScreen } from './screens/Tips';

type Tab = 'nosotros' | 'consejos' | 'perfil';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'nosotros', icon: '💞', label: t.tabs.nosotros },
  { id: 'consejos', icon: '💡', label: t.tabs.consejos },
  { id: 'perfil', icon: '👤', label: t.tabs.perfil },
];

export function App() {
  // undefined = todavía cargando; null = sin sesión.
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('nosotros');
  const [week, setWeek] = useState<Checkin[]>([]);
  const [tip, setTip] = useState<TodayTip | null>(null);
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
    const [w, tp] = await Promise.all([api.week(), api.todayTip()]);
    setWeek(w);
    setTip(tp);
  }, []);

  useEffect(() => {
    if (!paired) return;
    refresh().catch(() => undefined);
    return subscribeToUpdates(() => refresh().catch(() => undefined));
  }, [paired, refresh]);

  if (me === undefined) {
    return (
      <div className="app">
        <main className="page center">
          <p className="muted">{t.loading}</p>
        </main>
      </div>
    );
  }

  if (me === null) return <Login />;
  if (me.state !== 'paired') return <Onboarding me={me} onChange={setMe} />;

  return (
    <div className="app">
      <main className="page">
        {tab === 'nosotros' && <Home me={me} week={week} onCheckIn={() => setCheckingIn(true)} />}
        {tab === 'consejos' && <TipsScreen tip={tip} />}
        {tab === 'perfil' && <Profile me={me} onSignedOut={() => setMe(null)} />}
      </main>

      <nav className="nav" aria-label="Principal">
        <div className="nav-inner">
          {TABS.map((item) => (
            <button
              key={item.id}
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
            >
              <span className="ico" aria-hidden>
                {item.icon}
              </span>
              {item.label}
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
