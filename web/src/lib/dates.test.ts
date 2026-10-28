import { describe, expect, it } from 'vitest';

import type { Checkin } from './api';
import { dayNumber, daysInMonth, daysSince, localIsoDate, monthGrid, ofTheDay, parseLocalDate, weekDays } from './dates';

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

describe('localIsoDate', () => {
  it('usa el día local, no UTC', () => {
    expect(localIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('monthGrid', () => {
  it('empieza en lunes y termina en domingo, con semanas completas', () => {
    const cells = monthGrid(2026, 9); // octubre 2026: el 1 es jueves, el 31 sábado
    expect(cells[0].dateKey).toBe('2026-09-28'); // lunes
    expect(cells[cells.length - 1].dateKey).toBe('2026-11-01'); // domingo
    expect(cells.length % 7).toBe(0);
    expect(cells.filter((c) => c.inMonth)).toHaveLength(31);
  });

  it('un mes que empieza en domingo arranca seis días antes', () => {
    const cells = monthGrid(2026, 1); // febrero 2026: el 1 es domingo
    expect(cells[0].dateKey).toBe('2026-01-26');
  });

  it('marca el día de hoy', () => {
    const cells = monthGrid(2026, 9, new Date(2026, 9, 17));
    expect(cells.filter((c) => c.isToday).map((c) => c.dateKey)).toEqual(['2026-10-17']);
  });
});

describe('parseLocalDate', () => {
  it('no corre el día por la zona horaria', () => {
    const d = parseLocalDate('2026-10-17');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 17]);
  });
});

describe('ofTheDay', () => {
  it('da lo mismo todo el día y cambia al día siguiente', () => {
    const items = ['a', 'b', 'c'];
    const morning = new Date(2026, 9, 17, 7);
    const night = new Date(2026, 9, 17, 23, 59);
    const tomorrow = new Date(2026, 9, 18, 7);
    expect(ofTheDay(items, morning)).toBe(ofTheDay(items, night));
    expect(dayNumber(tomorrow)).toBe(dayNumber(morning) + 1);
    expect(ofTheDay(items, tomorrow)).not.toBe(ofTheDay(items, morning));
  });

  it('daysInMonth contempla febrero bisiesto', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2026, 10)).toBe(31);
  });
});

describe('daysSince', () => {
  it('cuenta días de calendario, también cruzando el cambio de horario', () => {
    const now = new Date(2026, 9, 17, 23, 30);
    expect(daysSince('2026-10-17', now)).toBe(0);
    expect(daysSince('2026-10-16', now)).toBe(1);
    expect(daysSince('2025-10-17', now)).toBe(365);
    expect(daysSince('2026-03-01', now)).toBe(230);
  });
});
