import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatYearMonth,
} from './formatters';

describe('Formatters Utilities', () => {
  describe('formatCurrency', () => {
    it('correctly formats values to standard currency format', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(5)).toBe('$5.00');
      expect(formatCurrency(99.9)).toBe('$99.90');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('handles negative currency amounts', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
      expect(formatCurrency(-0.5)).toBe('-$0.50');
    });

    it('handles numeric string inputs', () => {
      expect(formatCurrency('1234.56')).toBe('$1,234.56');
      expect(formatCurrency('50')).toBe('$50.00');
    });

    it('handles null, undefined, NaN, and invalid inputs gracefully', () => {
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
      expect(formatCurrency(NaN)).toBe('$0.00');
      expect(formatCurrency('invalid-amount')).toBe('$0.00');
    });

    it('handles floating point additions cleanly', () => {
      // 0.1 + 0.2 = 0.30000000000000004
      expect(formatCurrency(0.1 + 0.2)).toBe('$0.30');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentage values with decimal places', () => {
      expect(formatPercentage(25.5)).toBe('25.5%');
      expect(formatPercentage(50)).toBe('50%');
      expect(formatPercentage(0)).toBe('0%');
      expect(formatPercentage(33.33333, 2)).toBe('33.33%');
    });

    it('handles edge case inputs', () => {
      expect(formatPercentage(null)).toBe('0%');
      expect(formatPercentage(undefined)).toBe('0%');
      expect(formatPercentage(NaN)).toBe('0%');
    });
  });

  describe('formatDate', () => {
    it('formats date strings to readable format', () => {
      expect(formatDate('2024-05-15')).toBe('May 15, 2024');
      expect(formatDate('2024-02-29')).toBe('Feb 29, 2024');
    });

    it('handles empty and invalid values', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(null)).toBe('');
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  describe('formatYearMonth', () => {
    it('formats YYYY-MM to readable month and year', () => {
      expect(formatYearMonth('2024-05')).toBe('May 2024');
      expect(formatYearMonth('2024-12')).toBe('December 2024');
    });

    it('handles empty values', () => {
      expect(formatYearMonth('')).toBe('');
      expect(formatYearMonth(null)).toBe('');
    });
  });
});
