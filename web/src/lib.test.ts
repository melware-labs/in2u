import { describe, expect, it } from 'vitest';

import type { Checkin } from './api';
import { firstName, localIsoDate, weekDays } from './lib';

const checkin = (date: string, mine: boolean, mood = 4): Checkin => ({
  id: date + mine,
  userId: mine ? 'me' : 'partner',
  mood,
  note: null,
  date,
  mine,
});

describe('weekDays', () => {
  const now = new Date(2026, 9, 17); // sábado 17 oct 2026, hora local

  it('devuelve 7 días terminando hoy, el más antiguo primero', () => {
    const days = weekDays([], now);
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe('2026-10-11');
    expect(days[6].date).toBe('2026-10-17');
    expect(days[6].isToday).toBe(true);
    expect(days.filter((d) => d.isToday)).toHaveLength(1);
  });

  it('asigna cada check-in a su día y a su dueño', () => {
    const days = weekDays([checkin('2026-10-16', true, 5), checkin('2026-10-16', false, 2)], now);
    const yesterday = days[5];
    expect(yesterday.mine?.mood).toBe(5);
    expect(yesterday.partner?.mood).toBe(2);
    expect(days[6].mine).toBeUndefined();
  });

  it('cruza el cambio de mes', () => {
    expect(weekDays([], new Date(2026, 10, 2))[0].date).toBe('2026-10-27');
  });
});

describe('helpers', () => {
  it('localIsoDate usa el día local, no UTC', () => {
    expect(localIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('firstName toma el primer nombre y cae al valor por defecto', () => {
    expect(firstName('Ana María López', 'Tu pareja')).toBe('Ana');
    expect(firstName('   ', 'Tu pareja')).toBe('Tu pareja');
    expect(firstName(null, 'Tu pareja')).toBe('Tu pareja');
  });
});
