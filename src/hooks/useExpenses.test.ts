import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExpenses, AddExpenseResult } from './useExpenses';
import { Expense } from '../types/expense';
import { loadExpenses, saveExpenses, STORAGE_KEY } from '../services/storage';

describe('useExpenses Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleExpense1: Expense = {
    id: 'exp-1',
    amount: 50.0,
    description: 'Groceries',
    category: 'Food',
    date: '2026-10-15',
  };

  const sampleExpense2: Expense = {
    id: 'exp-2',
    amount: 30.0,
    description: 'Gas',
    category: 'Transport',
    date: '2026-09-20',
  };

  it('initializes with empty expenses when localStorage is empty', () => {
    const { result } = renderHook(() => useExpenses());
    expect(result.current.expenses).toEqual([]);
    expect(result.current.monthlyTotal).toBe(0);
  });

  it('restores existing expenses from localStorage on mount', () => {
    saveExpenses([sampleExpense1, sampleExpense2]);
    const { result } = renderHook(() => useExpenses({ initialMonth: '2026-10' }));

    expect(result.current.expenses).toHaveLength(2);
    expect(result.current.monthlyExpenses).toHaveLength(1);
    expect(result.current.monthlyExpenses[0].id).toBe('exp-1');
    expect(result.current.monthlyTotal).toBe(50.0);
  });

  it('adds a valid expense, prepends it, updates monthly total and persists', () => {
    const { result } = renderHook(() => useExpenses({ initialMonth: '2026-10' }));

    let res: AddExpenseResult | undefined;
    act(() => {
      res = result.current.addExpense({
        amount: 25.5,
        description: 'Coffee',
        category: 'Food',
        date: '2026-10-20',
      });
    });

    expect(res?.success).toBe(true);
    expect(result.current.expenses).toHaveLength(1);
    expect(result.current.expenses[0].description).toBe('Coffee');
    expect(result.current.monthlyTotal).toBe(25.5);

    // Verify persisted to localStorage
    const stored = loadExpenses();
    expect(stored).toHaveLength(1);
    expect(stored[0].description).toBe('Coffee');
  });

  it('prepends subsequent expenses to the list', () => {
    const { result } = renderHook(() => useExpenses({ initialMonth: '2026-10' }));

    act(() => {
      result.current.addExpense({
        amount: 10,
        description: 'First',
        category: 'Food',
        date: '2026-10-01',
      });
    });

    act(() => {
      result.current.addExpense({
        amount: 20,
        description: 'Second',
        category: 'Food',
        date: '2026-10-02',
      });
    });

    expect(result.current.expenses).toHaveLength(2);
    expect(result.current.expenses[0].description).toBe('Second');
    expect(result.current.expenses[1].description).toBe('First');
  });

  it('rejects invalid expense input without modifying state', () => {
    const { result } = renderHook(() => useExpenses());

    let res: AddExpenseResult | undefined;
    act(() => {
      res = result.current.addExpense({
        amount: -10,
        description: '',
        category: 'InvalidCat',
        date: 'not-a-date',
      });
    });

    expect(res?.success).toBe(false);
    expect(res?.errors).toBeDefined();
    expect(res?.errors?.amount).toBeDefined();
    expect(res?.errors?.description).toBeDefined();
    expect(res?.errors?.category).toBeDefined();
    expect(res?.errors?.date).toBeDefined();

    expect(result.current.expenses).toEqual([]);
    expect(loadExpenses()).toEqual([]);
  });

  it('deletes an expense by id and updates monthly aggregations and localStorage', () => {
    saveExpenses([sampleExpense1, sampleExpense2]);
    const { result } = renderHook(() => useExpenses({ initialMonth: '2026-10' }));

    expect(result.current.expenses).toHaveLength(2);
    expect(result.current.monthlyTotal).toBe(50.0);

    act(() => {
      result.current.deleteExpense('exp-1');
    });

    expect(result.current.expenses).toHaveLength(1);
    expect(result.current.expenses[0].id).toBe('exp-2');
    expect(result.current.monthlyTotal).toBe(0);

    const stored = loadExpenses(STORAGE_KEY);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('exp-2');
  });

  it('switches selected month and recomputes monthly metrics correctly', () => {
    saveExpenses([sampleExpense1, sampleExpense2]);
    const { result } = renderHook(() => useExpenses({ initialMonth: '2026-10' }));

    expect(result.current.selectedMonth).toBe('2026-10');
    expect(result.current.monthlyTotal).toBe(50.0);

    act(() => {
      result.current.setSelectedMonth('2026-09');
    });

    expect(result.current.selectedMonth).toBe('2026-09');
    expect(result.current.monthlyTotal).toBe(30.0);
    expect(result.current.monthlyExpenses).toHaveLength(1);
    expect(result.current.monthlyExpenses[0].id).toBe('exp-2');
  });

  it('derives category breakdown correctly', () => {
    saveExpenses([
      { id: '1', amount: 50, description: 'Lunch', category: 'Food', date: '2026-10-01' },
      { id: '2', amount: 50, description: 'Subway', category: 'Transport', date: '2026-10-02' },
    ]);
    const { result } = renderHook(() => useExpenses({ initialMonth: '2026-10' }));

    const breakdown = result.current.categoryBreakdown;
    const foodItem = breakdown.find((b) => b.category === 'Food');
    const transportItem = breakdown.find((b) => b.category === 'Transport');

    expect(foodItem?.total).toBe(50);
    expect(foodItem?.percentage).toBe(50);
    expect(transportItem?.total).toBe(50);
    expect(transportItem?.percentage).toBe(50);
  });
});
