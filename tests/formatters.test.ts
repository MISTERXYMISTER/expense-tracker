import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatYearMonth,
} from '../src/utils/formatters';

describe('Unit Tests: Formatters (tests/formatters.test.ts)', () => {
  it('formats currency values properly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(42.5)).toBe('$42.50');
  });

  it('formats percentage values properly', () => {
    expect(formatPercentage(25.5)).toBe('25.5%');
    expect(formatPercentage(50)).toBe('50%');
  });

  it('formats date and year-month strings properly', () => {
    expect(formatDate('2024-05-15')).toBe('May 15, 2024');
    expect(formatYearMonth('2024-05')).toBe('May 2024');
  });
});
