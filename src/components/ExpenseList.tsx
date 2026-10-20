import React, { useMemo } from 'react';
import { Expense } from '../types/expense';
import { formatCurrency, formatDate } from '../utils/formatters';

export interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense }) => {
  // Ensure expenses are ordered in reverse chronological order (newest first)
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
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
      return 0;
    });
  }, [expenses]);

  if (sortedExpenses.length === 0) {
    return (
      <div className="empty-list-notice">
        <p>No expenses found.</p>
      </div>
    );
  }

  return (
    <div className="expense-table-wrapper">
      <table className="expense-table" aria-label="Expenses list">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Category</th>
            <th scope="col" className="text-right">Amount</th>
            <th scope="col" className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedExpenses.map((expense) => (
            <tr key={expense.id} data-testid={`expense-item-${expense.id}`}>
              <td className="expense-date">
                <time dateTime={expense.date}>{formatDate(expense.date) || expense.date}</time>
              </td>
              <td className="expense-description">{expense.description}</td>
              <td className="expense-category">
                <span className={`category-badge category-${expense.category.toLowerCase()}`}>
                  {expense.category}
                </span>
              </td>
              <td className="expense-amount text-right">
                {formatCurrency(expense.amount)}
              </td>
              <td className="expense-actions text-center">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => onDeleteExpense(expense.id)}
                  aria-label={`Delete ${expense.description}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
