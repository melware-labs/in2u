import { CARE_TIPS } from '../content/tips';
import type { PartnerCycle } from '../lib/api';
import { t } from '../lib/i18n';

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
