import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Expense,
  ExpenseCategory,
  ExpenseInput,
  ExpenseValidationErrors,
  CategoryBreakdown,
} from '../types/expense';
import {
  calculateMonthlyTotal,
  calculateCategoryBreakdown,
  filterExpensesByMonth,
  normalizeYearMonth,
  getExpenseYearMonth,
} from '../utils/calculations';
import { validateExpense } from '../utils/validation';
import { loadExpenses, saveExpenses, STORAGE_KEY } from '../services/storage';

export interface UseExpensesOptions {
  storageKey?: string;
  initialExpenses?: Expense[];
  initialMonth?: string;
}

export interface AddExpenseResult {
  success: boolean;
  expense?: Expense;
  errors?: ExpenseValidationErrors;
}

export function useExpenses(options?: UseExpensesOptions) {
  const storageKey = options?.storageKey ?? STORAGE_KEY;

  // Initialize expenses state from options or localStorage
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (options?.initialExpenses) {
      return options.initialExpenses;
    }
    return loadExpenses(storageKey);
  });

  // Track the currently selected month in "YYYY-MM" format
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (options?.initialMonth) {
      return normalizeYearMonth(options.initialMonth);
    }
    const today = new Date();
    return normalizeYearMonth(today);
  });

  // Automatically save to localStorage whenever expenses change
  useEffect(() => {
    saveExpenses(expenses, storageKey);
  }, [expenses, storageKey]);

  // Derived: Expenses for the selected month in reverse chronological order
  const monthlyExpenses = useMemo<Expense[]>(() => {
    return filterExpensesByMonth(expenses, selectedMonth);
  }, [expenses, selectedMonth]);

  // Derived: Total spending for the selected month
  const monthlyTotal = useMemo<number>(() => {
    return calculateMonthlyTotal(expenses, selectedMonth);
  }, [expenses, selectedMonth]);

  // Derived: Category breakdown for the selected month
  const categoryBreakdown = useMemo<CategoryBreakdown>(() => {
    return calculateCategoryBreakdown(expenses, selectedMonth);
  }, [expenses, selectedMonth]);

  // Derived: List of available months (YYYY-MM), sorted newest first
  const availableMonths = useMemo<string[]>(() => {
    const monthSet = new Set<string>();
    const currentYM = normalizeYearMonth(new Date());
    if (currentYM) monthSet.add(currentYM);
    if (selectedMonth) monthSet.add(selectedMonth);

    for (const exp of expenses) {
      const ym = getExpenseYearMonth(exp.date);
      if (ym) monthSet.add(ym);
    }

    return Array.from(monthSet).sort().reverse();
  }, [expenses, selectedMonth]);

  /**
   * Adds a new expense after validating inputs.
   * If valid, prepends to expense list and updates storage.
   */
  const addExpense = useCallback(
    (input: ExpenseInput): AddExpenseResult => {
      const validation = validateExpense(input);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const newExpense: Expense = {
        id,
        amount: Number(input.amount),
        description: input.description.trim(),
        category: input.category as ExpenseCategory,
        date: input.date.trim(),
        createdAt: new Date().toISOString(),
      };

      setExpenses((prev) => [newExpense, ...prev]);

      // Automatically switch selectedMonth to match the new expense's month
      const expenseMonth = getExpenseYearMonth(newExpense.date);
      if (expenseMonth) {
        setSelectedMonth(expenseMonth);
      }

      return {
        success: true,
        expense: newExpense,
      };
    },
    []
  );

  /**
   * Deletes an expense by its ID.
   */
  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  }, []);

  /**
   * Clears all expenses.
   */
  const clearAllExpenses = useCallback(() => {
    setExpenses([]);
  }, []);

  return {
    expenses,
    monthlyExpenses,
    selectedMonth,
    setSelectedMonth,
    monthlyTotal,
    categoryBreakdown,
    availableMonths,
    addExpense,
    deleteExpense,
    clearAllExpenses,
    setExpenses,
  };
}
