import {
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
  ExpenseInput,
  ExpenseValidationErrors,
  ValidationResult,
  isValidCategory,
} from '../types/expense';

/**
 * Validates whether a date string is a real calendar date in YYYY-MM-DD or valid ISO format.
 * Correctly validates leap years (e.g. 2024-02-29 is valid, 2023-02-29 is invalid).
 */
export function isValidDateString(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string' || !dateStr.trim()) {
    return false;
  }

  const trimmed = dateStr.trim();
  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Use UTC to prevent local timezone boundary shifts
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  // Fallback for valid ISO strings or parsable dates
  const parsed = Date.parse(trimmed);
  if (isNaN(parsed)) {
    return false;
  }

  const dateObj = new Date(parsed);
  return !isNaN(dateObj.getTime());
}

/**
 * Validates an expense entry according to domain rules:
 * - amount must be a positive number (> 0)
 * - description must be non-empty
 * - category must be one of ('Food', 'Transport', 'Housing', 'Entertainment', 'Utilities', 'Other')
 * - date must be a valid calendar date
 */
export function validateExpense(
  entry: Partial<ExpenseInput | Expense> | null | undefined
): ValidationResult {
  const errors: ExpenseValidationErrors = {};

  if (!entry || typeof entry !== 'object') {
    return {
      isValid: false,
      errors: {
        amount: 'Amount is required and must be a positive number.',
        description: 'Description is required and cannot be empty.',
        category: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}.`,
        date: 'Date is required and must be a valid date.',
      },
    };
  }

  // Validate amount
  const { amount, description, category, date } = entry;

  if (amount === undefined || amount === null || (typeof amount === 'string' && (amount as string).trim() === '')) {
    errors.amount = 'Amount is required.';
  } else {
    const numericAmount = typeof amount === 'number' ? amount : Number(amount);
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      errors.amount = 'Amount must be a valid finite number.';
    } else if (numericAmount <= 0) {
      errors.amount = 'Amount must be a positive number greater than zero.';
    }
  }

  // Validate description
  if (description === undefined || description === null) {
    errors.description = 'Description is required.';
  } else if (typeof description !== 'string' || description.trim().length === 0) {
    errors.description = 'Description cannot be empty.';
  }

  // Validate category
  if (!category) {
    errors.category = 'Category is required.';
  } else if (!isValidCategory(category as ExpenseCategory)) {
    errors.category = `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}.`;
  }

  // Validate date
  if (!date) {
    errors.date = 'Date is required.';
  } else if (!isValidDateString(date)) {
    errors.date = 'Date must be a valid calendar date in YYYY-MM-DD format.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Type guard for checking if an object conforms to a valid Expense structure.
 */
export function isValidExpense(entry: unknown): entry is Expense {
  if (!entry || typeof entry !== 'object') return false;
  const exp = entry as Partial<Expense>;
  if (typeof exp.id !== 'string' || exp.id.trim() === '') return false;
  return validateExpense(exp).isValid;
}
