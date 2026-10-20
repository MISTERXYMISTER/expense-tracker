import { Expense } from '../types/expense';

export const STORAGE_KEY = 'expenses';

/**
 * Safely loads expenses from browser localStorage.
 * Returns an empty array if storage is empty, inaccessible, or corrupted.
 */
export function loadExpenses(key: string = STORAGE_KEY): Expense[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Filter and sanitize valid expense items
    return parsed.filter((item): item is Expense => {
      return (
        item !== null &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        item.id.trim().length > 0 &&
        typeof item.amount === 'number' &&
        !isNaN(item.amount) &&
        typeof item.description === 'string' &&
        typeof item.category === 'string' &&
        typeof item.date === 'string'
      );
    });
  } catch (error) {
    console.warn('Failed to load expenses from localStorage:', error);
    return [];
  }
}

/**
 * Safely persists expenses to browser localStorage.
 */
export function saveExpenses(expenses: Expense[], key: string = STORAGE_KEY): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(expenses));
  } catch (error) {
    console.warn('Failed to save expenses to localStorage:', error);
  }
}

/**
 * Clears stored expenses from localStorage.
 */
export function clearExpenses(key: string = STORAGE_KEY): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear expenses from localStorage:', error);
  }
}
