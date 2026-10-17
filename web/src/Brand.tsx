import { HeartsLoop } from './icons';

/** Logo de in2u: el símbolo (sin fondo) y el nombre en Fredoka. */
export function Brand({ withMark = false }: { withMark?: boolean }) {
  return (
    <div className="brand-lockup">
      {withMark && <HeartsLoop />}
      <div className="brand" aria-label="in2u">
        in<span className="two">2</span>u
      </div>
    </div>
  );
}
