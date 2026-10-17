/** Logo de in2u: el símbolo (sin fondo) y el nombre en Fredoka, con el "2" del color del tema. */
export function Brand({ withMark = false }: { withMark?: boolean }) {
  return (
    <div className="brand-lockup">
      {withMark && <img className="brand-mark" src="/logo.svg" alt="" />}
      <div className="brand" aria-label="in2u">
        in<span className="two">2</span>u
      </div>
    </div>
  );
}
