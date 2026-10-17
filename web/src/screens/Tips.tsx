import type { TodayTip } from '../api';
import { t } from '../i18n';
import { TIPS, tipByKey } from '../tips';

export function TipsScreen({ tip }: { tip: TodayTip | null }) {
  const curated = tip ? tipByKey(tip.tipKey) : undefined;

  return (
    <>
      <h1>{t.consejos.title}</h1>

      {tip ? (
        <section className="card" style={{ background: 'var(--selected)' }}>
          <p className="kicker">
            {t.consejos.forToday} · {tip.kicker}
          </p>
          {curated && <h2>{curated.title}</h2>}
          <p>{tip.advice}</p>
          {curated && <p className="muted small">{curated.body}</p>}
        </section>
      ) : (
        <section className="card">
          <p className="muted">{t.consejos.noneYet}</p>
        </section>
      )}

      <p className="kicker">{t.consejos.general}</p>
      {TIPS.map((item) => (
        <article key={item.key} className="card">
          <p className="kicker">{item.kicker}</p>
          <h2>{item.title}</h2>
          <p className="muted">{item.body}</p>
        </article>
      ))}
    </>
  );
}
