import { describe, expect, it } from 'vitest';

import { cycleGrid, phaseForOffset } from './cycle';

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
