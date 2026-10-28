// Emojis con el dibujo de iPhone en cualquier celular o compu: se muestran las
// imágenes del set de Apple (public/emoji, sacadas de emoji-datasource-apple)
// en lugar de la fuente de emojis del sistema.
const codepoint = (emoji: string) =>
  [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((c) => c !== 'fe0f')
    .join('-');

export function Emoji({ char, label }: { char: string; label?: string }) {
  if (char === '·') return <>{char}</>;
  return (
    <img
      className="emoji"
      src={`/emoji/${codepoint(char)}.png`}
      alt={label ?? char}
      aria-hidden={label ? undefined : true}
      draggable={false}
    />
  );
}
