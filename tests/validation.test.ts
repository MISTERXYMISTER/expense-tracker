import { describe, it, expect } from 'vitest';
import { validateExpense, isValidDateString } from '../src/utils/validation';

describe('Unit Tests: Validation (tests/validation.test.ts)', () => {
  it('validates a correct expense entry', () => {
    const res = validateExpense({
      amount: 100,
      description: 'Dinner',
      category: 'Food',
      date: '2024-05-15',
    });
    expect(res.isValid).toBe(true);
    expect(Object.keys(res.errors)).toHaveLength(0);
  });

  it('rejects invalid amounts with descriptive errors', () => {
    const resNegative = validateExpense({
      amount: -10,
      description: 'Dinner',
      category: 'Food',
      date: '2024-05-15',
    });
    expect(resNegative.isValid).toBe(false);
    expect(resNegative.errors.amount).toBeDefined();

    const resZero = validateExpense({
      amount: 0,
      description: 'Dinner',
      category: 'Food',
      date: '2024-05-15',
    });
    expect(resZero.isValid).toBe(false);
    expect(resZero.errors.amount).toBeDefined();
  });

  it('rejects invalid dates including non-leap years', () => {
    expect(isValidDateString('2024-02-29')).toBe(true);
    expect(isValidDateString('2023-02-29')).toBe(false);
    expect(isValidDateString('invalid')).toBe(false);
  });
});
