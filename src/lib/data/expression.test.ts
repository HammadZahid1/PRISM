import { describe, expect, it } from 'vitest';
import { compileExpression } from './expression';

describe('safe expression language', () => {
  it('evaluates arithmetic with correct precedence', () => {
    const evaluate = compileExpression('[price] * [qty] + 5', ['price', 'qty']);
    expect(evaluate({ price: 3, qty: 4 })).toBe(17);
    expect(compileExpression('10 - 2 * 3', [])()).toBe(4);
    expect(compileExpression('-(2 + 3)', [])()).toBe(-5);
  });

  it('supports comparisons and boolean operators', () => {
    expect(compileExpression('[score] >= 10 && [active] == 1', ['score', 'active'])({ score: 12, active: 1 })).toBe(true);
    expect(compileExpression('[score] > 10 or [score] < 2', ['score'])({ score: 1 })).toBe(true);
    expect(compileExpression('[score] == 5', ['score'])({ score: 4 })).toBe(false);
  });

  it('provides pure helper functions', () => {
    expect(compileExpression('round([value], 2)', ['value'])({ value: 1.236 })).toBe(1.24);
    expect(compileExpression('max([a], [b], 2)', ['a', 'b'])({ a: 4, b: 9 })).toBe(9);
    expect(compileExpression('if([a] > 2, 100, 0)', ['a'])({ a: 3 })).toBe(100);
    expect(compileExpression('abs(-7)', [])()).toBe(7);
  });

  it('handles missing values without throwing', () => {
    expect(compileExpression('[value] + 1', ['value'])({})).toBe(1);
    expect(compileExpression('[value] / 0', ['value'])({ value: 5 })).toBe(0);
  });

  it('rejects unknown columns, functions, and JavaScript syntax', () => {
    expect(() => compileExpression('[missing] + 1', [])).toThrow(/Unknown column/);
    expect(() => compileExpression('fetch("http://x")', [])).toThrow(/Unknown function/);
    expect(() => compileExpression('[a]; alert(1)', ['a'])).toThrow(/Unexpected character/);
    expect(() => compileExpression('([a] + 1', ['a'])).toThrow(/Missing closing parenthesis/);
  });
});
