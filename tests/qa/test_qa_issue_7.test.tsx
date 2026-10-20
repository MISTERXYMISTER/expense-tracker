import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { MonthlyDashboard } from '../../src/components/MonthlyDashboard';
import { Expense } from '../../src/types/expense';

describe('QA Edge Case & Boundary Verification - Issue #7 (Expense Count next to Total)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('MonthlyDashboard Component Edge Cases', () => {
    it('defaults expenseCount to 0 when expenseCount is omitted or undefined', () => {
      render(
        <MonthlyDashboard
          selectedMonth="2026-10"
          onMonthChange={() => {}}
          totalSpend={0}
          breakdown={[]}
        />
      );

      const countElement = screen.getByTestId('monthly-total-count');
      expect(countElement).toBeInTheDocument();
      expect(countElement).toHaveTextContent('(0 expenses)');
    });

    it('renders singular "(1 expense)" correctly when expenseCount is 1', () => {
      render(
        <MonthlyDashboard
          selectedMonth="2026-10"
          onMonthChange={() => {}}
          totalSpend={45.5}
          expenseCount={1}
          breakdown={[]}
        />
      );

      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$45.50');
      expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(1 expense)');
    });

    it('renders plural "(2 expenses)" correctly when expenseCount is 2', () => {
      render(
        <MonthlyDashboard
          selectedMonth="2026-10"
          onMonthChange={() => {}}
          totalSpend={99.99}
          expenseCount={2}
          breakdown={[]}
        />
      );

      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$99.99');
      expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(2 expenses)');
    });

    it('handles large expense counts correctly (e.g. 1000 expenses)', () => {
      render(
        <MonthlyDashboard
          selectedMonth="2026-10"
          onMonthChange={() => {}}
          totalSpend={50000}
          expenseCount={1000}
          breakdown={[]}
        />
      );

      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$50,000.00');
      expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(1000 expenses)');
    });

    it('displays total amount and expense count in adjacent structure within the total-spending-row', () => {
      render(
        <MonthlyDashboard
          selectedMonth="2026-10"
          onMonthChange={() => {}}
          totalSpend={120}
          expenseCount={3}
          breakdown={[]}
        />
      );

      const totalVal = screen.getByTestId('monthly-total-value');
      const totalCount = screen.getByTestId('monthly-total-count');
      const parentRow = totalVal.closest('.total-spending-row');

      expect(parentRow).toBeInTheDocument();
      expect(parentRow).toContainElement(totalVal);
      expect(parentRow).toContainElement(totalCount);
      expect(parentRow?.textContent).toContain('$120.00');
      expect(parentRow?.textContent).toContain('(3 expenses)');
    });
  });

  describe('Full Application Integration and Reactive State Changes', () => {
    it('verifies count is 0 expenses when expense list is empty', () => {
      render(<App initialMonth="2026-10" initialExpenses={[]} />);

      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$0.00');
      expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(0 expenses)');
    });

    it('updates expense count dynamically when a new expense is added in the current month', async () => {
      render(<App initialMonth="2026-10" initialExpenses={[]} />);

      expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(0 expenses)');

      // Fill in and submit expense form
      const amountInput = screen.getByLabelText(/amount/i);
      const descInput = screen.getByLabelText(/description/i);
      const categorySelect = screen.getByLabelText(/category/i);
      const dateInput = screen.getByLabelText(/date/i);
      const submitBtn = screen.getByRole('button', { name: /add expense/i });

      fireEvent.change(amountInput, { target: { value: '25.50' } });
      fireEvent.change(descInput, { target: { value: 'Coffee and Snack' } });
      fireEvent.change(categorySelect, { target: { value: 'Food' } });
      fireEvent.change(dateInput, { target: { value: '2026-10-05' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$25.50');
        expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(1 expense)');
      });

      // Add a second expense in the same month
      fireEvent.change(amountInput, { target: { value: '50.00' } });
      fireEvent.change(descInput, { target: { value: 'Internet' } });
      fireEvent.change(categorySelect, { target: { value: 'Utilities' } });
      fireEvent.change(dateInput, { target: { value: '2026-10-10' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$75.50');
        expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(2 expenses)');
      });
    });

    it('automatically switches selected month to new expense month and updates count', async () => {
      render(<App initialMonth="2026-10" initialExpenses={[]} />);

      expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(0 expenses)');

      const amountInput = screen.getByLabelText(/amount/i);
      const descInput = screen.getByLabelText(/description/i);
      const categorySelect = screen.getByLabelText(/category/i);
      const dateInput = screen.getByLabelText(/date/i);
      const submitBtn = screen.getByRole('button', { name: /add expense/i });

      // Add expense for November 2026 while October 2026 was initially selected
      fireEvent.change(amountInput, { target: { value: '100.00' } });
      fireEvent.change(descInput, { target: { value: 'November Rent' } });
      fireEvent.change(categorySelect, { target: { value: 'Housing' } });
      fireEvent.change(dateInput, { target: { value: '2026-11-01' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        // useExpenses auto-navigates to the month of the newly added expense (November 2026)
        expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$100.00');
        expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(1 expense)');
      });

      // Switch back to October 2026 to verify October is still 0 expenses
      const prevBtn = screen.getByRole('button', { name: /previous month/i });
      fireEvent.click(prevBtn);

      await waitFor(() => {
        expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$0.00');
        expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(0 expenses)');
      });
    });

    it('updates expense count dynamically when an expense is deleted', async () => {
      const initialExpenses: Expense[] = [
        { id: 'exp-1', amount: 30, description: 'Book', category: 'Entertainment', date: '2026-10-02' },
        { id: 'exp-2', amount: 45, description: 'Dinner', category: 'Food', date: '2026-10-03' },
      ];

      render(<App initialMonth="2026-10" initialExpenses={initialExpenses} />);

      expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(2 expenses)');
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$75.00');

      // Delete one expense
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(1 expense)');
      });

      // Delete remaining expense
      const remainingDeleteBtn = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(remainingDeleteBtn);

      await waitFor(() => {
        expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(0 expenses)');
        expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$0.00');
      });
    });

    it('switches count when navigating between months', async () => {
      const expenses: Expense[] = [
        { id: '1', amount: 10, description: 'Sep 1', category: 'Food', date: '2026-09-10' },
        { id: '2', amount: 20, description: 'Oct 1', category: 'Food', date: '2026-10-05' },
        { id: '3', amount: 30, description: 'Oct 2', category: 'Utilities', date: '2026-10-12' },
        { id: '4', amount: 40, description: 'Nov 1', category: 'Entertainment', date: '2026-11-20' },
      ];

      render(<App initialMonth="2026-10" initialExpenses={expenses} />);

      // In October: 2 expenses
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$50.00');
      expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(2 expenses)');

      // Navigate to previous month (September)
      const prevBtn = screen.getByRole('button', { name: /previous month/i });
      fireEvent.click(prevBtn);

      await waitFor(() => {
        expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$10.00');
        expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(1 expense)');
      });

      // Navigate back to October
      const nextBtn = screen.getByRole('button', { name: /next month/i });
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$50.00');
        expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(2 expenses)');
      });

      // Navigate to November
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$40.00');
        expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(1 expense)');
      });

      // Navigate to December (empty)
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$0.00');
        expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(0 expenses)');
      });
    });
  });
});
