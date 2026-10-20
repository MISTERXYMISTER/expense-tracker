import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyTotal,
  calculateCategoryBreakdown,
  calculateCategoryTotals,
  filterExpensesByMonth,
  normalizeYearMonth,
  getExpenseYearMonth,
  formatCurrency,
  formatPercentage,
  formatDate,
  formatYearMonth,
  validateExpense,
  isValidDateString,
  isValidExpense,
  EXPENSE_CATEGORIES,
} from '../../src/utils';
import { Expense, ExpenseInput } from '../../src/types/expense';

describe('QA Adversarial Test Suite - Issue #2 (Expense Engine & Aggregations)', () => {
  describe('1. Adversarial Validation & Boundary Tests', () => {
    const baseValidInput: ExpenseInput = {
      amount: 100.5,
      description: 'Office Supplies',
      category: 'Other',
      date: '2024-05-15',
    };

    describe('Amount Validation Edge Cases', () => {
      it('rejects zero amount', () => {
        const res = validateExpense({ ...baseValidInput, amount: 0 });
        expect(res.isValid).toBe(false);
        expect(res.errors.amount).toMatch(/greater than zero/i);
      });

      it('rejects negative numbers and negative zero', () => {
        const negRes = validateExpense({ ...baseValidInput, amount: -0.01 });
        expect(negRes.isValid).toBe(false);
        expect(negRes.errors.amount).toMatch(/greater than zero/i);

        const negZeroRes = validateExpense({ ...baseValidInput, amount: -0 });
        expect(negZeroRes.isValid).toBe(false);
        expect(negZeroRes.errors.amount).toMatch(/greater than zero/i);
      });

      it('rejects non-finite amounts (NaN, Infinity, -Infinity)', () => {
        expect(validateExpense({ ...baseValidInput, amount: NaN }).isValid).toBe(false);
        expect(validateExpense({ ...baseValidInput, amount: Infinity }).isValid).toBe(false);
        expect(validateExpense({ ...baseValidInput, amount: -Infinity }).isValid).toBe(false);
      });

      it('rejects empty strings or whitespace-only string amounts', () => {
        expect(validateExpense({ ...baseValidInput, amount: '' as unknown as number }).isValid).toBe(false);
        expect(validateExpense({ ...baseValidInput, amount: '   ' as unknown as number }).isValid).toBe(false);
        expect(validateExpense({ ...baseValidInput, amount: 'not-a-number' as unknown as number }).isValid).toBe(false);
      });

      it('accepts valid small sub-cent and large boundary positive amounts', () => {
        expect(validateExpense({ ...baseValidInput, amount: 0.001 }).isValid).toBe(true);
        expect(validateExpense({ ...baseValidInput, amount: 999999999.99 }).isValid).toBe(true);
      });
    });

    describe('Description Validation Edge Cases', () => {
      it('rejects empty and whitespace-only descriptions', () => {
        expect(validateExpense({ ...baseValidInput, description: '' }).isValid).toBe(false);
        expect(validateExpense({ ...baseValidInput, description: '   ' }).isValid).toBe(false);
        expect(validateExpense({ ...baseValidInput, description: '\t\n\r' }).isValid).toBe(false);
      });

      it('rejects undefined and null descriptions', () => {
        expect(validateExpense({ ...baseValidInput, description: undefined as unknown as string }).isValid).toBe(false);
        expect(validateExpense({ ...baseValidInput, description: null as unknown as string }).isValid).toBe(false);
      });

      it('accepts descriptions with special characters, unicode, emojis, and length boundary', () => {
        const special = '☕ Coffee & Pastry <tag> "quotes" \'single\' $100 & % * !';
        expect(validateExpense({ ...baseValidInput, description: special }).isValid).toBe(true);

        const longDescription = 'A'.repeat(5000);
        expect(validateExpense({ ...baseValidInput, description: longDescription }).isValid).toBe(true);
      });
    });

    describe('Category Validation Edge Cases', () => {
      it('accepts only exact case-sensitive allowed categories', () => {
        for (const cat of EXPENSE_CATEGORIES) {
          expect(validateExpense({ ...baseValidInput, category: cat }).isValid).toBe(true);
        }
      });

      it('rejects disallowed, misspelled, or lowercase categories', () => {
        const disallowed = ['food', 'FOOD', 'Food ', ' Groceries', 'General', 'Salary', 'Misc', '', 'null'];
        for (const cat of disallowed) {
          const res = validateExpense({ ...baseValidInput, category: cat });
          expect(res.isValid).toBe(false);
          expect(res.errors.category).toBeDefined();
        }
      });
    });

    describe('Calendar Date & Leap Year Boundary Validation', () => {
      it('accepts leap year day 2024-02-29 and 2000-02-29 (divisible by 400)', () => {
        expect(isValidDateString('2024-02-29')).toBe(true);
        expect(isValidDateString('2000-02-29')).toBe(true);
        expect(validateExpense({ ...baseValidInput, date: '2024-02-29' }).isValid).toBe(true);
      });

      it('rejects non-leap year Feb 29 for common years and century years not divisible by 400', () => {
        expect(isValidDateString('2023-02-29')).toBe(false);
        expect(isValidDateString('1900-02-29')).toBe(false);
        expect(isValidDateString('2100-02-29')).toBe(false);
        expect(validateExpense({ ...baseValidInput, date: '2023-02-29' }).isValid).toBe(false);
      });

      it('rejects impossible days in months with 30 days', () => {
        expect(isValidDateString('2024-04-31')).toBe(false); // April
        expect(isValidDateString('2024-06-31')).toBe(false); // June
        expect(isValidDateString('2024-09-31')).toBe(false); // September
        expect(isValidDateString('2024-11-31')).toBe(false); // November
      });

      it('rejects out of range months and days', () => {
        expect(isValidDateString('2024-00-15')).toBe(false);
        expect(isValidDateString('2024-13-01')).toBe(false);
        expect(isValidDateString('2024-01-00')).toBe(false);
        expect(isValidDateString('2024-01-32')).toBe(false);
      });

      it('rejects non-date or malformed strings', () => {
        expect(isValidDateString('2024-99-99')).toBe(false);
        expect(isValidDateString('not-a-date')).toBe(false);
        expect(isValidDateString('abc')).toBe(false);
        expect(isValidDateString('   ')).toBe(false);
        expect(isValidDateString('')).toBe(false);
        expect(isValidDateString(null)).toBe(false);
        expect(isValidDateString(undefined)).toBe(false);
      });
    });

    describe('Compound & Null Payload Validation', () => {
      it('returns comprehensive descriptive errors for completely invalid payload', () => {
        const res = validateExpense({
          amount: -50,
          description: '',
          category: 'Invalid',
          date: '2024-02-30',
        });
        expect(res.isValid).toBe(false);
        expect(res.errors.amount).toBeDefined();
        expect(res.errors.description).toBeDefined();
        expect(res.errors.category).toBeDefined();
        expect(res.errors.date).toBeDefined();
      });

      it('handles null, undefined, or empty object gracefully without throwing', () => {
        expect(validateExpense(null).isValid).toBe(false);
        expect(validateExpense(undefined).isValid).toBe(false);
        expect(validateExpense({}).isValid).toBe(false);
      });

      it('type guard isValidExpense checks both ID and valid fields', () => {
        expect(isValidExpense({ id: 'valid-id', ...baseValidInput })).toBe(true);
        expect(isValidExpense({ id: '', ...baseValidInput })).toBe(false);
        expect(isValidExpense({ id: '   ', ...baseValidInput })).toBe(false);
        expect(isValidExpense(null)).toBe(false);
      });
    });
  });

  describe('2. Adversarial Aggregation & Calculation Tests', () => {
    describe('calculateMonthlyTotal Edge Cases', () => {
      it('returns 0 for empty array, null, undefined, or no matching month', () => {
        expect(calculateMonthlyTotal([], '2024-05')).toBe(0);
        expect(calculateMonthlyTotal(null, '2024-05')).toBe(0);
        expect(calculateMonthlyTotal(undefined, '2024-05')).toBe(0);

        const exp: Expense[] = [
          { id: '1', amount: 100, description: 'Lunch', category: 'Food', date: '2024-04-30' },
        ];
        expect(calculateMonthlyTotal(exp, '2024-05')).toBe(0);
      });

      it('prevents IEEE-754 floating point rounding errors', () => {
        // Standard FP issue: 0.1 + 0.2 = 0.30000000000000004
        const fpExpenses: Expense[] = [
          { id: '1', amount: 0.1, description: 'A', category: 'Other', date: '2024-05-01' },
          { id: '2', amount: 0.2, description: 'B', category: 'Other', date: '2024-05-02' },
        ];
        expect(calculateMonthlyTotal(fpExpenses, '2024-05')).toBe(0.3);

        // Sum of ten 0.07 amounts = 0.70 (not 0.7000000000000001)
        const tenItems: Expense[] = Array.from({ length: 10 }, (_, i) => ({
          id: `item-${i}`,
          amount: 0.07,
          description: `Item ${i}`,
          category: 'Other' as const,
          date: '2024-05-10',
        }));
        expect(calculateMonthlyTotal(tenItems, '2024-05')).toBe(0.7);
      });

      it('strictly distinguishes same month across different years', () => {
        const yearExpenses: Expense[] = [
          { id: '1', amount: 100, description: '2023 spend', category: 'Food', date: '2023-05-15' },
          { id: '2', amount: 250, description: '2024 spend', category: 'Food', date: '2024-05-15' },
        ];
        expect(calculateMonthlyTotal(yearExpenses, '2024-05')).toBe(250);
        expect(calculateMonthlyTotal(yearExpenses, '2023-05')).toBe(100);
      });

      it('correctly aggregates leap day expenses', () => {
        const leapExpenses: Expense[] = [
          { id: '1', amount: 45.5, description: 'Leap', category: 'Transport', date: '2024-02-29' },
          { id: '2', amount: 54.5, description: 'Norm', category: 'Transport', date: '2024-02-01' },
        ];
        expect(calculateMonthlyTotal(leapExpenses, '2024-02')).toBe(100);
      });

      it('ignores corrupted or non-numeric amounts in records gracefully', () => {
        const mixedExpenses = [
          { id: '1', amount: 50, description: 'Valid', category: 'Food', date: '2024-05-01' },
          { id: '2', amount: NaN as unknown as number, description: 'Corrupt', category: 'Food', date: '2024-05-02' },
          { id: '3', amount: 25.5, description: 'Valid 2', category: 'Food', date: '2024-05-03' },
        ] as Expense[];
        expect(calculateMonthlyTotal(mixedExpenses, '2024-05')).toBe(75.5);
      });
    });

    describe('calculateCategoryBreakdown Edge Cases', () => {
      it('handles zero total spending gracefully without NaN or Infinity', () => {
        const breakdown = calculateCategoryBreakdown([], '2024-05');
        expect(Array.isArray(breakdown)).toBe(true);
        expect(breakdown.length).toBe(EXPENSE_CATEGORIES.length);

        for (const item of breakdown) {
          expect(item.total).toBe(0);
          expect(item.percentage).toBe(0);
          expect(Number.isNaN(item.percentage)).toBe(false);
          expect(Number.isFinite(item.percentage)).toBe(true);
        }

        // Direct property access
        expect(breakdown.Food.total).toBe(0);
        expect(breakdown.Food.percentage).toBe(0);
        expect(breakdown.Housing.total).toBe(0);
        expect(breakdown.Housing.percentage).toBe(0);
      });

      it('calculates accurate percentages with 100% single-category expenditure', () => {
        const singleCategory: Expense[] = [
          { id: '1', amount: 500, description: 'Rent', category: 'Housing', date: '2024-05-01' },
        ];
        const breakdown = calculateCategoryBreakdown(singleCategory, '2024-05');
        expect(breakdown.Housing.total).toBe(500);
        expect(breakdown.Housing.percentage).toBe(100);
        expect(breakdown.Food.percentage).toBe(0);
        expect(breakdown.Transport.percentage).toBe(0);
      });

      it('calculates fractional percentages accurately rounded to 2 decimal places', () => {
        // Total = 300, Food = 100 (33.33%), Transport = 200 (66.67%)
        const expenses: Expense[] = [
          { id: '1', amount: 100, description: 'Food', category: 'Food', date: '2024-05-01' },
          { id: '2', amount: 200, description: 'Train', category: 'Transport', date: '2024-05-02' },
        ];
        const breakdown = calculateCategoryBreakdown(expenses, '2024-05');
        expect(breakdown.Food.total).toBe(100);
        expect(breakdown.Food.percentage).toBe(33.33);
        expect(breakdown.Transport.total).toBe(200);
        expect(breakdown.Transport.percentage).toBe(66.67);
      });

      it('calculateCategoryTotals returns plain record matching totals', () => {
        const expenses: Expense[] = [
          { id: '1', amount: 75.25, description: 'Food', category: 'Food', date: '2024-05-01' },
          { id: '2', amount: 24.75, description: 'Bus', category: 'Transport', date: '2024-05-02' },
        ];
        const totals = calculateCategoryTotals(expenses, '2024-05');
        expect(totals.Food).toBe(75.25);
        expect(totals.Transport).toBe(24.75);
        expect(totals.Utilities).toBe(0);
      });
    });

    describe('filterExpensesByMonth Ordering & Immutability', () => {
      it('orders strictly in reverse chronological order (latest date first)', () => {
        const unsortedExpenses: Expense[] = [
          { id: '1', amount: 10, description: 'Start of month', category: 'Food', date: '2024-05-01' },
          { id: '2', amount: 20, description: 'End of month', category: 'Food', date: '2024-05-31' },
          { id: '3', amount: 30, description: 'Mid month', category: 'Food', date: '2024-05-15' },
          { id: '4', amount: 40, description: 'Different month', category: 'Food', date: '2024-06-01' },
        ];
        const filtered = filterExpensesByMonth(unsortedExpenses, '2024-05');
        expect(filtered).toHaveLength(3);
        expect(filtered[0].id).toBe('2'); // May 31
        expect(filtered[1].id).toBe('3'); // May 15
        expect(filtered[2].id).toBe('1'); // May 01
      });

      it('does not mutate the original array when filtering/sorting', () => {
        const expenses: Expense[] = [
          { id: '1', amount: 10, description: 'A', category: 'Food', date: '2024-05-01' },
          { id: '2', amount: 20, description: 'B', category: 'Food', date: '2024-05-15' },
        ];
        const snapshot = JSON.stringify(expenses);
        filterExpensesByMonth(expenses, '2024-05');
        expect(JSON.stringify(expenses)).toBe(snapshot);
      });

      it('returns empty array for invalid inputs without crashing', () => {
        expect(filterExpensesByMonth([], '2024-05')).toEqual([]);
        expect(filterExpensesByMonth(null, '2024-05')).toEqual([]);
        expect(filterExpensesByMonth(undefined, '2024-05')).toEqual([]);
        expect(filterExpensesByMonth([], '')).toEqual([]);
      });
    });

    describe('Formatters Edge Cases', () => {
      it('formats currency with commas, exact decimals, and negative amounts', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56');
        expect(formatCurrency(0)).toBe('$0.00');
        expect(formatCurrency(5)).toBe('$5.00');
        expect(formatCurrency(99.9)).toBe('$99.90');
        expect(formatCurrency(1000000)).toBe('$1,000,000.00');
        expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
      });

      it('handles null, undefined, NaN, and empty string in formatCurrency', () => {
        expect(formatCurrency(null)).toBe('$0.00');
        expect(formatCurrency(undefined)).toBe('$0.00');
        expect(formatCurrency(NaN)).toBe('$0.00');
        expect(formatCurrency('')).toBe('$0.00');
        expect(formatCurrency('abc')).toBe('$0.00');
      });

      it('handles formatPercentage edge cases', () => {
        expect(formatPercentage(50)).toBe('50%');
        expect(formatPercentage(33.3333, 2)).toBe('33.33%');
        expect(formatPercentage(null)).toBe('0%');
        expect(formatPercentage(undefined)).toBe('0%');
        expect(formatPercentage(NaN)).toBe('0%');
      });

      it('handles formatDate and formatYearMonth edge cases', () => {
        expect(formatDate('2024-05-15')).toBe('May 15, 2024');
        expect(formatDate('')).toBe('');
        expect(formatDate(null)).toBe('');
        expect(formatDate('invalid')).toBe('');

        expect(formatYearMonth('2024-05')).toBe('May 2024');
        expect(formatYearMonth('')).toBe('');
        expect(formatYearMonth(null)).toBe('');
      });
    });

    describe('normalizeYearMonth and getExpenseYearMonth', () => {
      it('normalizes single-digit months and dates correctly', () => {
        expect(normalizeYearMonth('2024-5')).toBe('2024-05');
        expect(normalizeYearMonth('2024-05')).toBe('2024-05');
        expect(normalizeYearMonth(new Date(2024, 0, 1))).toBe('2024-01');
        expect(normalizeYearMonth('')).toBe('');
        expect(normalizeYearMonth(null)).toBe('');

        expect(getExpenseYearMonth('2024-05-20')).toBe('2024-05');
        expect(getExpenseYearMonth('')).toBe('');
        expect(getExpenseYearMonth(null)).toBe('');
      });
    });
  });
});
