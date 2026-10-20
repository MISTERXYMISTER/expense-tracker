import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyTotal,
  calculateCategoryBreakdown,
  calculateCategoryTotals,
  filterExpensesByMonth,
} from '../src/utils/calculations';
import { Expense } from '../src/types/expense';

describe('Unit Tests: Calculations (tests/calculations.test.ts)', () => {
  const expenses: Expense[] = [
    { id: '1', amount: 100, description: 'Groceries', category: 'Food', date: '2024-05-10' },
    { id: '2', amount: 50, description: 'Gas', category: 'Transport', date: '2024-05-20' },
    { id: '3', amount: 200, description: 'Rent', category: 'Housing', date: '2024-06-01' },
  ];

  it('calculates monthly total accurately', () => {
    expect(calculateMonthlyTotal(expenses, '2024-05')).toBe(150);
    expect(calculateMonthlyTotal(expenses, '2024-06')).toBe(200);
  });

  it('calculates category breakdown accurately with totals and percentages', () => {
    const breakdown = calculateCategoryBreakdown(expenses, '2024-05');
    expect(breakdown.Food.total).toBe(100);
    expect(breakdown.Food.percentage).toBeCloseTo(66.67, 1);
    expect(breakdown.Transport.total).toBe(50);
    expect(breakdown.Transport.percentage).toBeCloseTo(33.33, 1);
  });

  it('filters expenses by month in reverse chronological order', () => {
    const filtered = filterExpensesByMonth(expenses, '2024-05');
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('2'); // May 20
    expect(filtered[1].id).toBe('1'); // May 10
  });

  it('calculates category totals record', () => {
    const totals = calculateCategoryTotals(expenses, '2024-05');
    expect(totals.Food).toBe(100);
    expect(totals.Transport).toBe(50);
    expect(totals.Housing).toBe(0);
  });
});
