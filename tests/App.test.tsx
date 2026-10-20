import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';
import { Expense } from '../src/types/expense';

describe('Project Skeleton Smoke Test', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mounts the application root and verifies core elements exist', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: 'Expense Tracker' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument();
  });

  describe('Issue #7 - Expense count next to total amount', () => {
    it('displays 0 expenses adjacent to total sum when there are no expenses', () => {
      render(<App initialMonth="2026-10" />);
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$0.00');
      expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(0 expenses)');
    });

    it('displays singular expense count when there is 1 expense in the selected month', () => {
      const expenses: Expense[] = [
        { id: '1', amount: 50, description: 'Lunch', category: 'Food', date: '2026-10-12' },
      ];
      render(<App initialMonth="2026-10" initialExpenses={expenses} />);
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$50.00');
      expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(1 expense)');
    });

    it('displays plural count when there are multiple expenses in the selected month', () => {
      const expenses: Expense[] = [
        { id: '1', amount: 50, description: 'Groceries', category: 'Food', date: '2026-10-10' },
        { id: '2', amount: 70, description: 'Utilities bill', category: 'Utilities', date: '2026-10-15' },
        { id: '3', amount: 200, description: 'Old rent', category: 'Housing', date: '2026-09-01' },
      ];
      render(<App initialMonth="2026-10" initialExpenses={expenses} />);
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$120.00');
      expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(2 expenses)');
    });
  });
});
