import { describe, expect, it } from 'vitest';

import type { Checkin } from './api';
import { dayNumber, firstName, localIsoDate, ofTheDay, weekDays } from './lib';

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

import { cycleGrid, monthGrid, parseLocalDate, phaseForOffset } from './lib';

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

describe('ciclo', () => {
  // Mismos límites que CyclePhaseCalculatorTest.java para un ciclo de 29 días con 5 de período.
  it('phaseForOffset coincide con el backend', () => {
    const at = (d: number) => phaseForOffset(d, 29, 5);
    expect([at(0), at(4)]).toEqual(['menstrual', 'menstrual']);
    expect([at(5), at(12)]).toEqual(['folicular', 'folicular']);
    expect([at(13), at(16)]).toEqual(['ovulacion', 'ovulacion']);
    expect([at(17), at(28)]).toEqual(['lutea', 'lutea']);
  });

  it('cycleGrid usa el período registrado más reciente como ancla y no extrapola hacia atrás', () => {
    const cells = cycleGrid(2026, 9, ['2026-10-10'], 29, 5, new Date(2026, 9, 17));
    const by = Object.fromEntries(cells.map((c) => [c.dateKey, c]));
    expect(by['2026-10-09'].phase).toBeNull();
    expect(by['2026-10-10'].phase).toBe('menstrual');
    expect(by['2026-10-10'].isRegisteredStart).toBe(true);
    expect(by['2026-10-15'].phase).toBe('folicular');
    expect(by['2026-10-23'].phase).toBe('ovulacion');
    expect(by['2026-10-27'].phase).toBe('lutea');
    expect(by['2026-11-01'].phase).toBe('lutea');
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
});
