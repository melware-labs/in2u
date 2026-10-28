/** Primer nombre de una persona, o `fallback` si no tiene. */
export function firstName(name: string | null | undefined, fallback: string): string {
  const n = name?.trim().split(/\s+/)[0];
  return n || fallback;
}
