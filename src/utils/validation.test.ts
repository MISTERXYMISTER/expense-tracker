import { describe, it, expect } from 'vitest';
import {
  validateExpense,
  isValidDateString,
  isValidExpense,
} from './validation';
import { ExpenseInput } from '../types/expense';

describe('Validation Utilities', () => {
  const validExpense: ExpenseInput = {
    amount: 49.99,
    description: 'Weekly groceries',
    category: 'Food',
    date: '2024-05-15',
  };

  describe('validateExpense', () => {
    it('succeeds for valid expense input', () => {
      const result = validateExpense(validExpense);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('fails when amount is zero or negative', () => {
      const zeroResult = validateExpense({ ...validExpense, amount: 0 });
      expect(zeroResult.isValid).toBe(false);
      expect(zeroResult.errors.amount).toMatch(/positive number greater than zero/i);

      const negativeResult = validateExpense({ ...validExpense, amount: -15.5 });
      expect(negativeResult.isValid).toBe(false);
      expect(negativeResult.errors.amount).toMatch(/positive number greater than zero/i);
    });

    it('fails when amount is missing or NaN', () => {
      const missingResult = validateExpense({ ...validExpense, amount: undefined as unknown as number });
      expect(missingResult.isValid).toBe(false);
      expect(missingResult.errors.amount).toBeDefined();

      const nanResult = validateExpense({ ...validExpense, amount: NaN });
      expect(nanResult.isValid).toBe(false);
      expect(nanResult.errors.amount).toBeDefined();
    });

    it('fails when description is empty or only whitespace', () => {
      const emptyResult = validateExpense({ ...validExpense, description: '' });
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors.description).toMatch(/cannot be empty/i);

      const whitespaceResult = validateExpense({ ...validExpense, description: '   ' });
      expect(whitespaceResult.isValid).toBe(false);
      expect(whitespaceResult.errors.description).toMatch(/cannot be empty/i);

      const nullResult = validateExpense({ ...validExpense, description: undefined as unknown as string });
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors.description).toBeDefined();
    });

    it('validates categories against allowed list', () => {
      const validCategories = [
        'Food',
        'Transport',
        'Housing',
        'Entertainment',
        'Utilities',
        'Other',
      ] as const;

      for (const cat of validCategories) {
        const res = validateExpense({ ...validExpense, category: cat });
        expect(res.isValid).toBe(true);
        expect(res.errors.category).toBeUndefined();
      }

      const invalidResult = validateExpense({ ...validExpense, category: 'InvalidCategory' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.category).toMatch(/category must be one of/i);
    });

    it('fails when date is invalid or missing', () => {
      const missingResult = validateExpense({ ...validExpense, date: '' });
      expect(missingResult.isValid).toBe(false);
      expect(missingResult.errors.date).toBeDefined();

      const invalidResult = validateExpense({ ...validExpense, date: 'not-a-date' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.date).toMatch(/valid calendar date/i);
    });

    it('handles null or non-object input gracefully', () => {
      const nullResult = validateExpense(null);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors.amount).toBeDefined();
      expect(nullResult.errors.description).toBeDefined();
      expect(nullResult.errors.category).toBeDefined();
      expect(nullResult.errors.date).toBeDefined();
    });
  });

  describe('isValidDateString & Leap Year Edge Cases', () => {
    it('validates leap years accurately', () => {
      // 2024 is a leap year (Feb 29 exists)
      expect(isValidDateString('2024-02-29')).toBe(true);
      // 2023 is not a leap year (Feb 29 does not exist)
      expect(isValidDateString('2023-02-29')).toBe(false);
      // 2000 is a century leap year
      expect(isValidDateString('2000-02-29')).toBe(true);
      // 1900 is not a leap year
      expect(isValidDateString('1900-02-29')).toBe(false);
    });

    it('rejects invalid day and month combinations', () => {
      expect(isValidDateString('2024-02-30')).toBe(false);
      expect(isValidDateString('2024-04-31')).toBe(false);
      expect(isValidDateString('2024-06-31')).toBe(false);
      expect(isValidDateString('2024-11-31')).toBe(false);
      expect(isValidDateString('2024-13-01')).toBe(false);
      expect(isValidDateString('2024-00-10')).toBe(false);
      expect(isValidDateString('2024-01-32')).toBe(false);
    });

    it('rejects non-date strings and empty values', () => {
      expect(isValidDateString('')).toBe(false);
      expect(isValidDateString('abc')).toBe(false);
      expect(isValidDateString(null)).toBe(false);
      expect(isValidDateString(undefined)).toBe(false);
    });
  });

  describe('isValidExpense type guard', () => {
    it('returns true for complete valid Expense entity', () => {
      const fullExpense = {
        id: 'exp-123',
        amount: 25.0,
        description: 'Coffee',
        category: 'Food' as const,
        date: '2024-05-10',
      };
      expect(isValidExpense(fullExpense)).toBe(true);
    });

    it('returns false when id is missing or empty', () => {
      const invalid = {
        amount: 25.0,
        description: 'Coffee',
        category: 'Food' as const,
        date: '2024-05-10',
      };
      expect(isValidExpense(invalid)).toBe(false);
    });
  });
});
