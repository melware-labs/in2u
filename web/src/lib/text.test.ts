import { describe, expect, it } from 'vitest';

import { firstName } from './text';

describe('firstName', () => {
  it('toma el primer nombre y cae al valor por defecto', () => {
    expect(firstName('Ana María López', 'Tu pareja')).toBe('Ana');
    expect(firstName('   ', 'Tu pareja')).toBe('Tu pareja');
    expect(firstName(null, 'Tu pareja')).toBe('Tu pareja');
  });
});
