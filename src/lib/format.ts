const WEEKDAYS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

/** "mar 1 sep" */
export function formatDayHeader(date: Date = new Date()): string {
  return date
    .toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace('.', '');
}

/** "hace 20 min" / "hace 3 h" / "hace 2 d" */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'recién';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

/** Lunes a domingo de la semana que contiene `date`, como Date[] de 7 elementos. */
export function currentWeekDays(date: Date = new Date()): Date[] {
  const day = date.getDay(); // 0 = domingo
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function weekdayLetter(date: Date): string {
  return WEEKDAYS_SHORT[date.getDay()];
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
