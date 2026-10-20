import React, { useState } from 'react';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  ExpenseInput,
  ExpenseValidationErrors,
} from '../types/expense';
import { validateExpense } from '../utils/validation';

export interface ExpenseFormProps {
  onAddExpense: (input: ExpenseInput) => {
    success: boolean;
    errors?: ExpenseValidationErrors;
  };
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense }) => {
  const getTodayDate = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDate);
  const [errors, setErrors] = useState<ExpenseValidationErrors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedAmount = amount.trim();
    const numericAmount = trimmedAmount === '' ? (undefined as unknown as number) : Number(trimmedAmount);
    const input: ExpenseInput = {
      amount: numericAmount,
      description,
      category: category as ExpenseCategory,
      date,
    };

    const validation = validateExpense(input);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const result = onAddExpense(input);
    if (!result.success) {
      if (result.errors) {
        setErrors(result.errors);
      }
      return;
    }

    // Success - reset form
    setAmount('');
    setDescription('');
    setCategory('');
    setDate(getTodayDate());
    setErrors({});
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    if (errors.date) {
      setErrors((prev) => ({ ...prev, date: undefined }));
    }
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="amount">Amount ($)</label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={handleAmountChange}
          aria-invalid={!!errors.amount}
          aria-describedby={errors.amount ? 'amount-error' : undefined}
          className={errors.amount ? 'input-error' : ''}
        />
        {errors.amount && (
          <span className="field-error" role="alert" id="amount-error">
            {errors.amount}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          name="description"
          type="text"
          placeholder="e.g. Groceries"
          value={description}
          onChange={handleDescriptionChange}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          className={errors.description ? 'input-error' : ''}
        />
        {errors.description && (
          <span className="field-error" role="alert" id="description-error">
            {errors.description}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={category}
          onChange={handleCategoryChange}
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? 'category-error' : undefined}
          className={errors.category ? 'input-error' : ''}
        >
          <option value="">Select a category</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {errors.category && (
          <span className="field-error" role="alert" id="category-error">
            {errors.category}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="date">Date</label>
        <input
          id="date"
          name="date"
          type="date"
          value={date}
          onChange={handleDateChange}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'date-error' : undefined}
          className={errors.date ? 'input-error' : ''}
        />
        {errors.date && (
          <span className="field-error" role="alert" id="date-error">
            {errors.date}
          </span>
        )}
      </div>

      <button type="submit" className="btn btn-primary submit-btn">
        Add Expense
      </button>
    </form>
  );
};
