/** Cliente de la API de Spring. Todo va al mismo origen (proxy de Vite / rewrites de Vercel). */

export type Person = { name: string | null; avatarUrl: string | null };

export type Me = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  timezone: string;
  /** none: sin código · waiting: esperando a la pareja · paired: vinculados */
  state: 'none' | 'waiting' | 'paired';
  inviteCode: string | null;
  partner: Person | null;
  gender: Gender | null;
  /** YYYY-MM-DD */
  birthDate: string | null;
  age: number | null;
  /** YYYY-MM-DD, compartida por la pareja. */
  togetherSince: string | null;
  /** false hasta completar el formulario de bienvenida. */
  profileComplete: boolean;
};

export type Gender = 'mujer' | 'hombre' | 'otro';
export const GENDERS: Gender[] = ['mujer', 'hombre', 'otro'];

export type ProfileInput = { name: string; gender: Gender; birthDate: string; togetherSince: string };

export type Checkin = {
  id: string;
  userId: string;
  mood: number;
  note: string | null;
  date: string;
  mine: boolean;
};

export type TodayTip = { tipKey: string; kicker: string; advice: string; source: string };

export type CoupleEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  visibility: 'solo_yo' | 'los_dos';
  mine: boolean;
  googleSyncEnabled: boolean;
};

export type Visibility = 'nada' | 'avisos' | 'fase_y_avisos';
export type Symptom = 'dolor' | 'sangrado' | 'sin_energia' | 'antojos' | 'insomnio';
export const SYMPTOMS: Symptom[] = ['dolor', 'sangrado', 'sin_energia', 'antojos', 'insomnio'];

export type OwnCycle = {
  cycleLengthDays: number;
  periodLengthDays: number;
  partnerVisibility: Visibility;
  /** YYYY-MM-DD, el más reciente primero. */
  periodStarts: string[];
  today: {
    dayOfCycle: number;
    cycleLength: number;
    phase: 'menstrual' | 'folicular' | 'ovulacion' | 'lutea';
    nextPeriodDate: string;
    daysUntilNextPeriod: number;
    fertileWindowStart: string;
    fertileWindowEnd: string;
  } | null;
  todaySymptoms: Symptom[];
};

/** Lo que la pareja decidió compartir; los campos ausentes no se enviaron. */
export type PartnerCycle = {
  visibility: Visibility;
  hasData?: boolean;
  careMode?: boolean;
  phase?: 'menstrual' | 'folicular' | 'ovulacion' | 'lutea';
  dayOfCycle?: number;
  cycleLength?: number;
  nextPeriodDate?: string;
  daysUntilNextPeriod?: number;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function xsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-XSRF-TOKEN'] = xsrfToken();

  const res = await fetch(path, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      // cuerpo vacío o no JSON: se queda el mensaje genérico
    }
    throw new ApiError(res.status, message);
  }
  // 204 o 200 sin cuerpo (p. ej. el logout): no hay JSON que leer.
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}

export const api = {
  /** null si no hay sesión (401). */
  async me(): Promise<Me | null> {
    try {
      return (await request<Me>('GET', '/api/me')) ?? null;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  },
  createCouple: () => request<Me>('POST', '/api/couple') as Promise<Me>,
  joinCouple: (code: string) => request<Me>('POST', '/api/couple/join', { code }) as Promise<Me>,
  saveProfile: (p: ProfileInput) =>
    request<Me>('PUT', '/api/me/profile', { ...p, name: p.name.trim() }) as Promise<Me>,
  setTimezone: (timezone: string) => request<Me>('PUT', '/api/me/timezone', { timezone }) as Promise<Me>,
  week: () => request<Checkin[]>('GET', '/api/mood/week') as Promise<Checkin[]>,
  saveMood: (mood: number, note: string) =>
    request<Checkin>('PUT', '/api/mood/today', { mood, note: note.trim() || null }) as Promise<Checkin>,
  todayTip: () => request<TodayTip>('GET', '/api/tips/today'),
  events: (from: Date, to: Date) =>
    request<CoupleEvent[]>(
      'GET',
      `/api/events?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
    ) as Promise<CoupleEvent[]>,
  createEvent: (e: { title: string; startsAt: string; endsAt: string; visibility: string }) =>
    request<CoupleEvent>('POST', '/api/events', e) as Promise<CoupleEvent>,
  deleteEvent: (id: string) => request<void>('DELETE', `/api/events/${id}`),
  cycle: () => request<OwnCycle>('GET', '/api/cycle') as Promise<OwnCycle>,
  cycleSettings: (cycleLengthDays: number, periodLengthDays: number, partnerVisibility: Visibility) =>
    request<OwnCycle>('PUT', '/api/cycle/settings', {
      cycleLengthDays,
      periodLengthDays,
      partnerVisibility,
    }) as Promise<OwnCycle>,
  addPeriod: (date: string) => request<OwnCycle>('POST', '/api/cycle/periods', { date }) as Promise<OwnCycle>,
  removePeriod: (date: string) => request<OwnCycle>('DELETE', `/api/cycle/periods/${date}`) as Promise<OwnCycle>,
  setSymptoms: (symptoms: Symptom[]) =>
    request<OwnCycle>('PUT', '/api/cycle/symptoms', { symptoms }) as Promise<OwnCycle>,
  partnerCycle: () => request<PartnerCycle>('GET', '/api/cycle/partner') as Promise<PartnerCycle>,
  devLogin: (email: string, name: string) => request<void>('POST', '/api/dev/login', { email, name }),
  logout: () => request<void>('POST', '/api/logout'),
};

/**
 * Tiempo real: el backend avisa por SSE cuando cambia un check-in o llega un
 * consejo. EventSource reconecta solo si se corta la conexión.
 */
export function subscribeToUpdates(onChange: () => void): () => void {
  const source = new EventSource('/api/mood/stream');
  source.addEventListener('mood', onChange);
  source.addEventListener('tip', onChange);
  // Al reconectar pudimos perdernos eventos: se refresca todo.
  source.addEventListener('open', onChange);
  return () => source.close();
}
