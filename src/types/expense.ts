export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Entertainment',
  'Utilities',
  'Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export function isValidCategory(category: unknown): category is ExpenseCategory {
  return (
    typeof category === 'string' &&
    EXPENSE_CATEGORIES.includes(category as ExpenseCategory)
  );
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string; // ISO date string: YYYY-MM-DD
  createdAt?: string;
}

export interface ExpenseInput {
  amount: number;
  description: string;
  category: ExpenseCategory | string;
  date: string;
}

export interface ExpenseValidationErrors {
  amount?: string;
  description?: string;
  category?: string;
  date?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ExpenseValidationErrors;
}

export interface CategoryBreakdownItem {
  category: ExpenseCategory;
  total: number;
  percentage: number;
}

export type CategoryBreakdown = CategoryBreakdownItem[] &
  Record<ExpenseCategory, CategoryBreakdownItem>;
