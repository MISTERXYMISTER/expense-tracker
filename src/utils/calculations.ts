import {
  EXPENSE_CATEGORIES,
  CategoryBreakdown,
  CategoryBreakdownItem,
  Expense,
  ExpenseCategory,
} from '../types/expense';
import { formatCurrency } from './formatters';
import { validateExpense, isValidExpense } from './validation';

export { formatCurrency, validateExpense, isValidExpense, EXPENSE_CATEGORIES };

/**
 * Normalizes a yearMonth input (e.g. "2024-5", "2024-05", "2024/05", or Date) to standard "YYYY-MM" format.
 */
export function normalizeYearMonth(yearMonth: string | Date | null | undefined): string {
  if (!yearMonth) return '';
  if (yearMonth instanceof Date) {
    const y = yearMonth.getFullYear();
    const m = String(yearMonth.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  const cleaned = yearMonth.trim();
  const match = /^(\d{4})[-/.](\d{1,2})/.exec(cleaned);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    return `${y}-${m}`;
  }

  return cleaned;
}

/**
 * Extracts the YYYY-MM component from an expense's date string.
 */
export function getExpenseYearMonth(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const match = /^(\d{4})[-/.](\d{1,2})/.exec(dateStr.trim());
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}`;
  }
  return '';
}

/**
 * Filters expenses belonging to a specific month and orders them in reverse chronological order (newest first).
 */
export function filterExpensesByMonth(
  expenses: readonly Expense[] | Expense[] | null | undefined,
  yearMonth: string | Date
): Expense[] {
  if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
    return [];
  }

  const targetYM = normalizeYearMonth(yearMonth);
  if (!targetYM) return [];

  const matched = expenses.filter(
    (exp) => exp && getExpenseYearMonth(exp.date) === targetYM
  );

  return matched.sort((a, b) => {
    // Reverse chronological order: newest date first
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();

    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
      return timeB - timeA;
    }

    const dateCmp = (b.date || '').localeCompare(a.date || '');
    if (dateCmp !== 0) return dateCmp;

    if (a.createdAt && b.createdAt) {
      return b.createdAt.localeCompare(a.createdAt);
    }
    if (a.id && b.id) {
      return b.id.localeCompare(a.id);
    }
    return 0;
  });
}

/**
 * Calculates the total expenditure for a given month, handling floating-point precision cleanly.
 * Returns 0 if no expenses match or if expenses list is empty.
 */
export function calculateMonthlyTotal(
  expenses: readonly Expense[] | Expense[] | null | undefined,
  yearMonth: string | Date
): number {
  if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
    return 0;
  }

  const targetYM = normalizeYearMonth(yearMonth);
  if (!targetYM) return 0;

  let sum = 0;
  for (const exp of expenses) {
    if (exp && getExpenseYearMonth(exp.date) === targetYM) {
      const amt = Number(exp.amount);
      if (!isNaN(amt) && isFinite(amt)) {
        sum += amt;
      }
    }
  }

  // Round to 2 decimal places to prevent IEEE 754 precision artifacts (e.g. 0.1 + 0.2 = 0.30000000000000004)
  return Math.round((sum + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates category-by-category totals and spending percentage for a given month.
 * Handles zero total spending gracefully (0% for all categories).
 * The returned array also permits direct category key lookup (e.g. breakdown.Food or breakdown['Food']).
 */
export function calculateCategoryBreakdown(
  expenses: readonly Expense[] | Expense[] | null | undefined,
  yearMonth: string | Date
): CategoryBreakdown {
  const targetYM = normalizeYearMonth(yearMonth);
  const monthlyTotal = calculateMonthlyTotal(expenses, targetYM);

  const categoryTotals: Record<string, number> = {};
  for (const cat of EXPENSE_CATEGORIES) {
    categoryTotals[cat] = 0;
  }

  if (expenses && Array.isArray(expenses)) {
    for (const exp of expenses) {
      if (exp && getExpenseYearMonth(exp.date) === targetYM && exp.category) {
        const amt = Number(exp.amount);
        if (!isNaN(amt) && isFinite(amt)) {
          categoryTotals[exp.category] =
            (categoryTotals[exp.category] || 0) + amt;
        }
      }
    }
  }

  // Build standard list containing all default categories
  const resultList: CategoryBreakdownItem[] = EXPENSE_CATEGORIES.map((category) => {
    const rawTotal = categoryTotals[category] || 0;
    const total = Math.round((rawTotal + Number.EPSILON) * 100) / 100;
    const percentage =
      monthlyTotal > 0
        ? Math.round(((total / monthlyTotal) * 100 + Number.EPSILON) * 100) / 100
        : 0;

    return {
      category,
      total,
      percentage,
    };
  });

  // Include any custom categories present in the data that are not in EXPENSE_CATEGORIES
  for (const [cat, rawTotal] of Object.entries(categoryTotals)) {
    if (!EXPENSE_CATEGORIES.includes(cat as ExpenseCategory)) {
      const total = Math.round((rawTotal + Number.EPSILON) * 100) / 100;
      const percentage =
        monthlyTotal > 0
          ? Math.round(((total / monthlyTotal) * 100 + Number.EPSILON) * 100) / 100
          : 0;
      resultList.push({
        category: cat as ExpenseCategory,
        total,
        percentage,
      });
    }
  }

  const breakdown = resultList as CategoryBreakdown;

  // Provide category lookup properties directly on the breakdown object
  for (const item of resultList) {
    Object.defineProperty(breakdown, item.category, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: item,
    });
    const lower = item.category.toLowerCase();
    if (!(lower in breakdown)) {
      Object.defineProperty(breakdown, lower, {
        enumerable: false,
        configurable: true,
        writable: true,
        value: item,
      });
    }
  }

  return breakdown;
}

/**
 * Calculates raw category totals for a given month as a Record<ExpenseCategory, number>.
 */
export function calculateCategoryTotals(
  expenses: readonly Expense[] | Expense[] | null | undefined,
  yearMonth: string | Date
): Record<ExpenseCategory, number> {
  const breakdown = calculateCategoryBreakdown(expenses, yearMonth);
  const result = {} as Record<ExpenseCategory, number>;
  for (const item of breakdown) {
    result[item.category] = item.total;
  }
  return result;
}
