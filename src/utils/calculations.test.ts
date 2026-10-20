import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyTotal,
  calculateCategoryBreakdown,
  calculateCategoryTotals,
  filterExpensesByMonth,
  normalizeYearMonth,
  getExpenseYearMonth,
} from './calculations';
import { Expense } from '../types/expense';

describe('Calculations Utilities', () => {
  const sampleExpenses: Expense[] = [
    {
      id: '1',
      amount: 45.5,
      description: 'Groceries',
      category: 'Food',
      date: '2024-05-02',
    },
    {
      id: '2',
      amount: 15.0,
      description: 'Bus Pass',
      category: 'Transport',
      date: '2024-05-10',
    },
    {
      id: '3',
      amount: 120.0,
      description: 'Dinner Party',
      category: 'Food',
      date: '2024-05-25',
    },
    {
      id: '4',
      amount: 50.0,
      description: 'Concert',
      category: 'Entertainment',
      date: '2024-06-01',
    },
    {
      id: '5',
      amount: 300.0,
      description: 'Electricity',
      category: 'Utilities',
      date: '2024-04-28',
    },
  ];

  describe('calculateMonthlyTotal', () => {
    it('accurately sums the expenditure amounts for the selected month', () => {
      // 45.5 + 15.0 + 120.0 = 180.5
      const total = calculateMonthlyTotal(sampleExpenses, '2024-05');
      expect(total).toBe(180.5);
    });

    it('returns 0 for months with zero spending', () => {
      expect(calculateMonthlyTotal(sampleExpenses, '2024-07')).toBe(0);
      expect(calculateMonthlyTotal([], '2024-05')).toBe(0);
      expect(calculateMonthlyTotal(null, '2024-05')).toBe(0);
      expect(calculateMonthlyTotal(undefined, '2024-05')).toBe(0);
    });

    it('handles floating-point precision without precision errors', () => {
      const precisionExpenses: Expense[] = [
        { id: '1', amount: 0.1, description: 'Candy', category: 'Food', date: '2024-05-01' },
        { id: '2', amount: 0.2, description: 'Gum', category: 'Food', date: '2024-05-02' },
      ];
      // In JS, 0.1 + 0.2 === 0.30000000000000004
      const total = calculateMonthlyTotal(precisionExpenses, '2024-05');
      expect(total).toBe(0.3);
    });

    it('handles various yearMonth formats like YYYY-M or Date object', () => {
      expect(calculateMonthlyTotal(sampleExpenses, '2024-5')).toBe(180.5);
      expect(calculateMonthlyTotal(sampleExpenses, '2024/05')).toBe(180.5);
      expect(calculateMonthlyTotal(sampleExpenses, new Date(2024, 4, 15))).toBe(180.5);
    });

    it('includes expenses on leap days (e.g. 2024-02-29)', () => {
      const leapExpenses: Expense[] = [
        { id: '1', amount: 99.99, description: 'Leap Buy', category: 'Other', date: '2024-02-29' },
        { id: '2', amount: 10.01, description: 'Early Buy', category: 'Other', date: '2024-02-01' },
      ];
      expect(calculateMonthlyTotal(leapExpenses, '2024-02')).toBe(110);
    });
  });

  describe('calculateCategoryBreakdown', () => {
    it('returns totals and spending percentage for each category within that month', () => {
      // 2024-05: Total = 180.5
      // Food = 45.5 + 120 = 165.5 (165.5 / 180.5 = 91.6897...% -> 91.69%)
      // Transport = 15.0 (15 / 180.5 = 8.3102...% -> 8.31%)
      const breakdown = calculateCategoryBreakdown(sampleExpenses, '2024-05');

      expect(breakdown.Food.total).toBe(165.5);
      expect(breakdown.Food.percentage).toBe(91.69);

      expect(breakdown.Transport.total).toBe(15);
      expect(breakdown.Transport.percentage).toBe(8.31);

      expect(breakdown.Housing.total).toBe(0);
      expect(breakdown.Housing.percentage).toBe(0);

      expect(breakdown.Entertainment.total).toBe(0);
      expect(breakdown.Entertainment.percentage).toBe(0);

      expect(breakdown.Utilities.total).toBe(0);
      expect(breakdown.Utilities.percentage).toBe(0);

      expect(breakdown.Other.total).toBe(0);
      expect(breakdown.Other.percentage).toBe(0);
    });

    it('handles zero spending without dividing by zero or producing NaN', () => {
      const breakdown = calculateCategoryBreakdown(sampleExpenses, '2024-12');
      expect(breakdown.Food.total).toBe(0);
      expect(breakdown.Food.percentage).toBe(0);
      expect(breakdown.Transport.total).toBe(0);
      expect(breakdown.Transport.percentage).toBe(0);

      // Verify no NaN or Infinity anywhere
      for (const item of breakdown) {
        expect(Number.isNaN(item.total)).toBe(false);
        expect(Number.isNaN(item.percentage)).toBe(false);
        expect(Number.isFinite(item.total)).toBe(true);
        expect(Number.isFinite(item.percentage)).toBe(true);
      }
    });

    it('supports array iteration, find, and mapping', () => {
      const breakdown = calculateCategoryBreakdown(sampleExpenses, '2024-05');
      expect(Array.isArray(breakdown)).toBe(true);
      expect(breakdown.length).toBeGreaterThanOrEqual(6);

      const foodItem = breakdown.find((b) => b.category === 'Food');
      expect(foodItem).toBeDefined();
      expect(foodItem?.total).toBe(165.5);

      const mapped = breakdown.map((b) => b.category);
      expect(mapped).toContain('Food');
      expect(mapped).toContain('Transport');
    });

    it('calculates 100% when all expenditures belong to a single category', () => {
      const singleCategoryExpenses: Expense[] = [
        { id: '1', amount: 50, description: 'Dinner', category: 'Food', date: '2024-05-01' },
        { id: '2', amount: 50, description: 'Lunch', category: 'Food', date: '2024-05-02' },
      ];
      const breakdown = calculateCategoryBreakdown(singleCategoryExpenses, '2024-05');
      expect(breakdown.Food.total).toBe(100);
      expect(breakdown.Food.percentage).toBe(100);
      expect(breakdown.Transport.percentage).toBe(0);
    });
  });

  describe('calculateCategoryTotals', () => {
    it('returns a record of numeric totals keyed by category', () => {
      const totals = calculateCategoryTotals(sampleExpenses, '2024-05');
      expect(totals.Food).toBe(165.5);
      expect(totals.Transport).toBe(15);
      expect(totals.Housing).toBe(0);
    });
  });

  describe('filterExpensesByMonth', () => {
    it('filters and orders expenses in reverse chronological order', () => {
      const filtered = filterExpensesByMonth(sampleExpenses, '2024-05');
      expect(filtered).toHaveLength(3);
      // Expected reverse chronological order: May 25, May 10, May 02
      expect(filtered[0].id).toBe('3');
      expect(filtered[0].date).toBe('2024-05-25');
      expect(filtered[1].id).toBe('2');
      expect(filtered[1].date).toBe('2024-05-10');
      expect(filtered[2].id).toBe('1');
      expect(filtered[2].date).toBe('2024-05-02');
    });

    it('returns an empty array when no expenses match the month', () => {
      expect(filterExpensesByMonth(sampleExpenses, '2025-01')).toEqual([]);
      expect(filterExpensesByMonth([], '2024-05')).toEqual([]);
      expect(filterExpensesByMonth(null, '2024-05')).toEqual([]);
    });

    it('does not mutate the original array', () => {
      const originalCopy = [...sampleExpenses];
      filterExpensesByMonth(sampleExpenses, '2024-05');
      expect(sampleExpenses).toEqual(originalCopy);
    });
  });

  describe('normalizeYearMonth and getExpenseYearMonth', () => {
    it('normalizes various formats to YYYY-MM', () => {
      expect(normalizeYearMonth('2024-5')).toBe('2024-05');
      expect(normalizeYearMonth('2024-05')).toBe('2024-05');
      expect(normalizeYearMonth('2024/7')).toBe('2024-07');
      expect(normalizeYearMonth(new Date(2024, 0, 1))).toBe('2024-01');
    });

    it('extracts year-month from expense date strings', () => {
      expect(getExpenseYearMonth('2024-05-15')).toBe('2024-05');
      expect(getExpenseYearMonth('2024-12-31T23:59:59Z')).toBe('2024-12');
      expect(getExpenseYearMonth('')).toBe('');
      expect(getExpenseYearMonth(null)).toBe('');
    });
  });
});
