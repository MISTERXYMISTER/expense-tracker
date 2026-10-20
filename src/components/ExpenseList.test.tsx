import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseList } from './ExpenseList';
import { Expense } from '../types/expense';

describe('ExpenseList Component', () => {
  const mockDelete = vi.fn();

  const sampleExpenses: Expense[] = [
    {
      id: 'exp-older',
      amount: 15.5,
      description: 'Coffee',
      category: 'Food',
      date: '2026-10-01',
    },
    {
      id: 'exp-newer',
      amount: 120.0,
      description: 'Electricity Bill',
      category: 'Utilities',
      date: '2026-10-18',
    },
    {
      id: 'exp-mid',
      amount: 45.0,
      description: 'Train pass',
      category: 'Transport',
      date: '2026-10-10',
    },
  ];

  it('renders notice when expense list is empty', () => {
    render(<ExpenseList expenses={[]} onDeleteExpense={mockDelete} />);
    expect(screen.getByText(/no expenses found/i)).toBeInTheDocument();
  });

  it('renders expenses in reverse chronological order', () => {
    render(<ExpenseList expenses={sampleExpenses} onDeleteExpense={mockDelete} />);

    const rows = screen.getAllByRole('row');
    // First row is the thead header row, remaining are tbody rows
    expect(rows).toHaveLength(4);

    // Newest: 2026-10-18 (Electricity Bill)
    expect(rows[1]).toHaveTextContent('Electricity Bill');
    expect(rows[1]).toHaveTextContent('$120.00');
    expect(rows[1]).toHaveTextContent('Utilities');

    // Middle: 2026-10-10 (Train pass)
    expect(rows[2]).toHaveTextContent('Train pass');
    expect(rows[2]).toHaveTextContent('$45.00');
    expect(rows[2]).toHaveTextContent('Transport');

    // Oldest: 2026-10-01 (Coffee)
    expect(rows[3]).toHaveTextContent('Coffee');
    expect(rows[3]).toHaveTextContent('$15.50');
    expect(rows[3]).toHaveTextContent('Food');
  });

  it('triggers onDeleteExpense with correct ID when Delete button is clicked', () => {
    render(<ExpenseList expenses={sampleExpenses} onDeleteExpense={mockDelete} />);

    const deleteBtn = screen.getByRole('button', { name: /delete electricity bill/i });
    fireEvent.click(deleteBtn);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith('exp-newer');
  });
});
