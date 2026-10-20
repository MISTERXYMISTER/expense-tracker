import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyTotal,
  calculateCategoryBreakdown,
  calculateCategoryTotals,
  filterExpensesByMonth,
  formatCurrency,
  formatPercentage,
  formatDate,
  validateExpense,
  isValidDateString,
  isValidExpense,
  EXPENSE_CATEGORIES,
} from '../src/utils';
import { Expense, ExpenseInput } from '../src/types/expense';

describe('Expense Engine Acceptance Criteria Suite (Issue #2)', () => {
  const multiMonthExpenses: Expense[] = [
    {
      id: 'e1',
      amount: 150.25,
      description: 'Grocery shopping',
      category: 'Food',
      date: '2024-03-05',
    },
    {
      id: 'e2',
      amount: 45.0,
      description: 'Metro pass',
      category: 'Transport',
      date: '2024-03-12',
    },
    {
      id: 'e3',
      amount: 1200.0,
      description: 'Apartment rent',
      category: 'Housing',
      date: '2024-03-01',
    },
    {
      id: 'e4',
      amount: 85.5,
      description: 'Internet bill',
      category: 'Utilities',
      date: '2024-03-18',
    },
    {
      id: 'e5',
      amount: 60.0,
      description: 'Cinema tickets',
      category: 'Entertainment',
      date: '2024-03-22',
    },
    {
      id: 'e6',
      amount: 25.75,
      description: 'Pharmacy',
      category: 'Other',
      date: '2024-03-29',
    },
    // Another month
    {
      id: 'e7',
      amount: 200.0,
      description: 'April groceries',
      category: 'Food',
      date: '2024-04-03',
    },
  ];

  describe('Validation Requirements', () => {
    it('succeeds if amount is a positive number, description is non-empty, date is valid, and category is allowed', () => {
      const input: ExpenseInput = {
        amount: 89.99,
        description: 'Team lunch',
        category: 'Food',
        date: '2024-03-15',
      };
      const res = validateExpense(input);
      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors)).toHaveLength(0);
      expect(isValidExpense({ id: 'test-1', ...input })).toBe(true);
    });

    it('fails and returns descriptive error messages for negative/zero amounts', () => {
      const zeroInput: ExpenseInput = {
        amount: 0,
        description: 'Free coffee',
        category: 'Food',
        date: '2024-03-15',
      };
      const resZero = validateExpense(zeroInput);
      expect(resZero.isValid).toBe(false);
      expect(resZero.errors.amount).toBeDefined();
      expect(resZero.errors.amount).toContain('greater than zero');

      const negInput: ExpenseInput = {
        amount: -25,
        description: 'Refund',
        category: 'Food',
        date: '2024-03-15',
      };
      const resNeg = validateExpense(negInput);
      expect(resNeg.isValid).toBe(false);
      expect(resNeg.errors.amount).toContain('greater than zero');
    });

    it('fails and returns descriptive error messages for missing descriptions', () => {
      const emptyDesc: ExpenseInput = {
        amount: 20,
        description: '   ',
        category: 'Food',
        date: '2024-03-15',
      };
      const res = validateExpense(emptyDesc);
      expect(res.isValid).toBe(false);
      expect(res.errors.description).toContain('empty');
    });

    it('fails and returns descriptive error messages for invalid dates', () => {
      const invalidDate: ExpenseInput = {
        amount: 20,
        description: 'Test',
        category: 'Food',
        date: '2023-02-29', // non-leap year
      };
      const res = validateExpense(invalidDate);
      expect(res.isValid).toBe(false);
      expect(res.errors.date).toBeDefined();
    });

    it('fails when category is not one of allowed categories', () => {
      const invalidCat: ExpenseInput = {
        amount: 20,
        description: 'Test',
        category: 'Crypto' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        date: '2024-03-15',
      };
      const res = validateExpense(invalidCat);
      expect(res.isValid).toBe(false);
      expect(res.errors.category).toBeDefined();
    });
  });

  describe('Aggregation & Calculation Requirements', () => {
    it('calculateMonthlyTotal accurately sums the expenditure amounts for the selected month', () => {
      // March 2024 total = 150.25 + 45.0 + 1200.0 + 85.5 + 60.0 + 25.75 = 1566.5
      const marchTotal = calculateMonthlyTotal(multiMonthExpenses, '2024-03');
      expect(marchTotal).toBe(1566.5);

      // April 2024 total = 200.0
      const aprilTotal = calculateMonthlyTotal(multiMonthExpenses, '2024-04');
      expect(aprilTotal).toBe(200.0);
    });

    it('calculateCategoryBreakdown returns totals and spending percentage for each category within that month', () => {
      const breakdown = calculateCategoryBreakdown(multiMonthExpenses, '2024-03');

      // Check all 6 standard categories
      expect(breakdown.Food.total).toBe(150.25);
      expect(breakdown.Food.percentage).toBe(9.59); // 150.25 / 1566.5 * 100 = 9.5914% -> 9.59%

      expect(breakdown.Transport.total).toBe(45.0);
      expect(breakdown.Transport.percentage).toBe(2.87); // 45 / 1566.5 * 100 = 2.8726% -> 2.87%

      expect(breakdown.Housing.total).toBe(1200.0);
      expect(breakdown.Housing.percentage).toBe(76.6); // 1200 / 1566.5 * 100 = 76.6038% -> 76.6%

      expect(breakdown.Utilities.total).toBe(85.5);
      expect(breakdown.Utilities.percentage).toBe(5.46); // 85.5 / 1566.5 * 100 = 5.4580% -> 5.46%

      expect(breakdown.Entertainment.total).toBe(60.0);
      expect(breakdown.Entertainment.percentage).toBe(3.83); // 60 / 1566.5 * 100 = 3.8299% -> 3.83%

      expect(breakdown.Other.total).toBe(25.75);
      expect(breakdown.Other.percentage).toBe(1.64); // 25.75 / 1566.5 * 100 = 1.6437% -> 1.64%

      // Verify sum of percentages is close to 100%
      const totalPercentage = Object.values(breakdown)
        .filter((item) => typeof item === 'object' && 'percentage' in item)
        .reduce((sum, item) => sum + (item as any).percentage, 0); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(totalPercentage).toBeCloseTo(100, 0);
    });

    it('filterExpensesByMonth filters and orders expenses in reverse chronological order', () => {
      const marchList = filterExpensesByMonth(multiMonthExpenses, '2024-03');
      expect(marchList).toHaveLength(6);

      // Verify descending order of dates
      for (let i = 0; i < marchList.length - 1; i++) {
        const currentDate = new Date(marchList[i].date).getTime();
        const nextDate = new Date(marchList[i + 1].date).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }

      // Check exact sequence
      expect(marchList[0].id).toBe('e6'); // 2024-03-29
      expect(marchList[1].id).toBe('e5'); // 2024-03-22
      expect(marchList[2].id).toBe('e4'); // 2024-03-18
      expect(marchList[3].id).toBe('e2'); // 2024-03-12
      expect(marchList[4].id).toBe('e1'); // 2024-03-05
      expect(marchList[5].id).toBe('e3'); // 2024-03-01
    });

    it('formatCurrency correctly formats values to standard currency format (e.g. $1,234.56)', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(50)).toBe('$50.00');
      expect(formatCurrency(1566.5)).toBe('$1,566.50');
      expect(formatPercentage(50)).toBe('50%');
      expect(formatDate('2024-03-05')).toBe('Mar 5, 2024');
    });

    it('calculateCategoryTotals returns a record of totals', () => {
      const totals = calculateCategoryTotals(multiMonthExpenses, '2024-03');
      expect(totals.Housing).toBe(1200.0);
      expect(totals.Food).toBe(150.25);
    });
  });

  describe('Edge Cases Verification', () => {
    it('handles zero spending cleanly across all functions', () => {
      expect(calculateMonthlyTotal([], '2024-03')).toBe(0);
      expect(filterExpensesByMonth([], '2024-03')).toEqual([]);

      const breakdown = calculateCategoryBreakdown([], '2024-03');
      for (const cat of EXPENSE_CATEGORIES) {
        expect(breakdown[cat].total).toBe(0);
        expect(breakdown[cat].percentage).toBe(0);
      }
    });

    it('handles leap years accurately (e.g. 2024-02-29 vs 2023-02-29)', () => {
      expect(isValidDateString('2024-02-29')).toBe(true);
      expect(isValidDateString('2023-02-29')).toBe(false);

      const leapExpense: Expense = {
        id: 'leap-1',
        amount: 250,
        description: 'Leap day celebration',
        category: 'Entertainment',
        date: '2024-02-29',
      };
      expect(calculateMonthlyTotal([leapExpense], '2024-02')).toBe(250);
      expect(filterExpensesByMonth([leapExpense], '2024-02')).toHaveLength(1);
    });

    it('handles floating-point precision issues cleanly', () => {
      const precisionList: Expense[] = [
        { id: 'p1', amount: 0.1, description: 'Item 1', category: 'Food', date: '2024-01-01' },
        { id: 'p2', amount: 0.2, description: 'Item 2', category: 'Food', date: '2024-01-02' },
      ];
      expect(calculateMonthlyTotal(precisionList, '2024-01')).toBe(0.3);
      expect(formatCurrency(0.1 + 0.2)).toBe('$0.30');

      const breakdown = calculateCategoryBreakdown(precisionList, '2024-01');
      expect(breakdown.Food.total).toBe(0.3);
      expect(breakdown.Food.percentage).toBe(100);
    });
  });
});
