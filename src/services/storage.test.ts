import { describe, it, expect, beforeEach } from 'vitest';
import { loadExpenses, saveExpenses, clearExpenses, STORAGE_KEY } from './storage';
import { Expense } from '../types/expense';

describe('LocalStorage Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleExpenses: Expense[] = [
    {
      id: 'exp-1',
      amount: 45.5,
      description: 'Groceries',
      category: 'Food',
      date: '2026-10-15',
    },
    {
      id: 'exp-2',
      amount: 15.0,
      description: 'Bus pass',
      category: 'Transport',
      date: '2026-10-18',
    },
  ];

  it('returns empty array when nothing is stored', () => {
    const loaded = loadExpenses();
    expect(loaded).toEqual([]);
  });

  it('saves and loads expenses successfully', () => {
    saveExpenses(sampleExpenses);
    const loaded = loadExpenses();
    expect(loaded).toEqual(sampleExpenses);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(sampleExpenses));
  });

  it('uses custom key when provided', () => {
    const customKey = 'my_custom_expenses';
    saveExpenses(sampleExpenses, customKey);
    expect(loadExpenses(customKey)).toEqual(sampleExpenses);
    expect(loadExpenses(STORAGE_KEY)).toEqual([]);
  });

  it('clears stored expenses', () => {
    saveExpenses(sampleExpenses);
    expect(loadExpenses()).toHaveLength(2);
    clearExpenses();
    expect(loadExpenses()).toEqual([]);
  });

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid-json');
    const loaded = loadExpenses();
    expect(loaded).toEqual([]);
  });

  it('handles non-array stored data gracefully', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ amount: 100 }));
    const loaded = loadExpenses();
    expect(loaded).toEqual([]);
  });

  it('filters out corrupted items in array', () => {
    const corruptedData = [
      { id: 'valid-1', amount: 20, description: 'Lunch', category: 'Food', date: '2026-10-10' },
      { id: '', amount: 50 }, // missing fields
      null,
      'just a string',
      { id: 'valid-2', amount: 35, description: 'Dinner', category: 'Food', date: '2026-10-11' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(corruptedData));
    const loaded = loadExpenses();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe('valid-1');
    expect(loaded[1].id).toBe('valid-2');
  });
});
