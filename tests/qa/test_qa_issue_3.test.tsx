import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../src/App';
import { Expense } from '../../src/types/expense';
import { saveExpenses, loadExpenses, STORAGE_KEY } from '../../src/services/storage';

describe('QA Adversarial Test Suite - Issue #3 (UI, Expense Management & LocalStorage Persistence)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Adversarial Form Submission & Inline Validation', () => {
    it('displays all 4 inline validation errors when submitting an entirely blank form', () => {
      render(<App initialMonth="2026-10" />);

      // Clear the default date to trigger all 4 errors simultaneously
      fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      // Verify inline error alerts
      const amountError = screen.getByText(/amount is required/i);
      const descError = screen.getByText(/description cannot be empty/i);
      const catError = screen.getByText(/category is required/i);
      const dateError = screen.getByText(/date is required/i);

      expect(amountError).toBeInTheDocument();
      expect(amountError).toHaveAttribute('role', 'alert');
      expect(descError).toBeInTheDocument();
      expect(descError).toHaveAttribute('role', 'alert');
      expect(catError).toBeInTheDocument();
      expect(catError).toHaveAttribute('role', 'alert');
      expect(dateError).toBeInTheDocument();
      expect(dateError).toHaveAttribute('role', 'alert');

      // Verify inputs have aria-invalid="true"
      expect(screen.getByLabelText(/amount/i)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText(/description/i)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText(/category/i)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText(/date/i)).toHaveAttribute('aria-invalid', 'true');

      // Ensure no expense was saved
      expect(screen.getByText(/no expenses found/i)).toBeInTheDocument();
      expect(loadExpenses()).toHaveLength(0);
    });

    it('rejects zero, negative, and non-numeric amount values with inline error', () => {
      render(<App initialMonth="2026-10" />);

      const amountInput = screen.getByLabelText(/amount/i);
      const descInput = screen.getByLabelText(/description/i);
      const catSelect = screen.getByLabelText(/category/i);
      const dateInput = screen.getByLabelText(/date/i);
      const submitButton = screen.getByRole('button', { name: /add expense/i });

      fireEvent.change(descInput, { target: { value: 'Test Zero' } });
      fireEvent.change(catSelect, { target: { value: 'Food' } });
      fireEvent.change(dateInput, { target: { value: '2026-10-15' } });

      // Zero amount
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.click(submitButton);
      expect(screen.getByText(/positive number greater than zero/i)).toBeInTheDocument();
      expect(loadExpenses()).toHaveLength(0);

      // Negative amount
      fireEvent.change(amountInput, { target: { value: '-12.50' } });
      fireEvent.click(submitButton);
      expect(screen.getByText(/positive number greater than zero/i)).toBeInTheDocument();
      expect(loadExpenses()).toHaveLength(0);
    });

    it('rejects whitespace-only descriptions', () => {
      render(<App initialMonth="2026-10" />);

      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '15.00' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '     ' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Food' } });
      fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-10-15' } });

      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

      expect(screen.getByText(/description cannot be empty/i)).toBeInTheDocument();
      expect(loadExpenses()).toHaveLength(0);
    });

    it('rejects invalid non-leap-year date strings (e.g. 2023-02-29)', () => {
      render(<App initialMonth="2026-10" />);

      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '25.00' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Invalid Leap Day' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Utilities' } });
      fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2023-02-29' } });

      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

      expect(screen.getByText(/date is (required|invalid)/i)).toBeInTheDocument();
      expect(loadExpenses()).toHaveLength(0);
    });

    it('clears inline errors immediately as the user edits each invalid field', () => {
      render(<App initialMonth="2026-10" />);

      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description cannot be empty/i)).toBeInTheDocument();
      expect(screen.getByText(/category is required/i)).toBeInTheDocument();

      // Type amount -> amount error clears
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '10' } });
      expect(screen.queryByText(/amount is required/i)).not.toBeInTheDocument();
      expect(screen.getByText(/description cannot be empty/i)).toBeInTheDocument();

      // Type description -> description error clears
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Snack' } });
      expect(screen.queryByText(/description cannot be empty/i)).not.toBeInTheDocument();

      // Select category -> category error clears
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Food' } });
      expect(screen.queryByText(/category is required/i)).not.toBeInTheDocument();
    });

    it('trims leading and trailing whitespace from description upon saving', () => {
      render(<App initialMonth="2026-10" />);

      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '19.99' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '   Coffee and bagel   ' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Food' } });
      fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-10-10' } });

      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

      const stored = loadExpenses();
      expect(stored).toHaveLength(1);
      expect(stored[0].description).toBe('Coffee and bagel');
      expect(screen.getByText('Coffee and bagel')).toBeInTheDocument();
    });

    it('handles special characters and potential script injection strings safely in description', () => {
      render(<App initialMonth="2026-10" />);

      const scriptPayload = '<script>alert("xss")</script> & "Quotes" & Café ☕';
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '75.25' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: scriptPayload } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Entertainment' } });
      fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-10-12' } });

      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

      expect(screen.getByText(scriptPayload)).toBeInTheDocument();
      const stored = loadExpenses();
      expect(stored[0].description).toBe(scriptPayload);
    });

    it('resets form inputs to blank/today after valid submission', () => {
      render(<App initialMonth="2026-10" />);

      const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
      const descInput = screen.getByLabelText(/description/i) as HTMLInputElement;
      const catSelect = screen.getByLabelText(/category/i) as HTMLSelectElement;

      fireEvent.change(amountInput, { target: { value: '55.00' } });
      fireEvent.change(descInput, { target: { value: 'Gym Membership' } });
      fireEvent.change(catSelect, { target: { value: 'Other' } });

      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

      expect(amountInput.value).toBe('');
      expect(descInput.value).toBe('');
      expect(catSelect.value).toBe('');
    });
  });

  describe('2. Reverse Chronological Ordering & Multiple Entries', () => {
    it('maintains strict reverse chronological order across dates regardless of insertion order', () => {
      render(<App initialMonth="2026-10" />);

      const entries = [
        { amount: '10', desc: 'Oldest', date: '2026-10-01', cat: 'Food' },
        { amount: '30', desc: 'Newest', date: '2026-10-25', cat: 'Transport' },
        { amount: '20', desc: 'Middle', date: '2026-10-15', cat: 'Utilities' },
      ];

      for (const item of entries) {
        fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: item.amount } });
        fireEvent.change(screen.getByLabelText(/description/i), { target: { value: item.desc } });
        fireEvent.change(screen.getByLabelText(/category/i), { target: { value: item.cat } });
        fireEvent.change(screen.getByLabelText(/date/i), { target: { value: item.date } });
        fireEvent.click(screen.getByRole('button', { name: /add expense/i }));
      }

      const rows = screen.getAllByRole('row');
      // rows[0] is header
      expect(rows[1]).toHaveTextContent('Newest');
      expect(rows[2]).toHaveTextContent('Middle');
      expect(rows[3]).toHaveTextContent('Oldest');
    });

    it('orders same-day expenses by creation time (most recently created first)', () => {
      render(<App initialMonth="2026-10" />);

      const sameDayEntries = ['First Added', 'Second Added', 'Third Added'];

      for (const desc of sameDayEntries) {
        fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '15.00' } });
        fireEvent.change(screen.getByLabelText(/description/i), { target: { value: desc } });
        fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Food' } });
        fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-10-15' } });
        fireEvent.click(screen.getByRole('button', { name: /add expense/i }));
      }

      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Third Added');
      expect(rows[2]).toHaveTextContent('Second Added');
      expect(rows[3]).toHaveTextContent('First Added');
    });

    it('formats large amounts and cents with proper currency symbols', () => {
      const largeExpense: Expense[] = [
        { id: '1', amount: 1250000.5, description: 'House Deposit', category: 'Housing', date: '2026-10-01' },
      ];
      saveExpenses(largeExpense);

      render(<App initialMonth="2026-10" />);

      const amounts = screen.getAllByText('$1,250,000.50');
      expect(amounts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$1,250,000.50');
    });
  });

  describe('3. Deletion Edge Cases & Instant Reactive Updates', () => {
    it('deleting an item removes it and reverts to empty state when it was the only expense', () => {
      const singleExpense: Expense[] = [
        { id: 'lone-exp', amount: 49.99, description: 'Solo Item', category: 'Other', date: '2026-10-10' },
      ];
      saveExpenses(singleExpense);

      render(<App initialMonth="2026-10" />);

      expect(screen.getByText('Solo Item')).toBeInTheDocument();
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$49.99');

      const deleteBtn = screen.getByRole('button', { name: /delete solo item/i });
      fireEvent.click(deleteBtn);

      expect(screen.queryByText('Solo Item')).not.toBeInTheDocument();
      expect(screen.getByText(/no expenses found/i)).toBeInTheDocument();
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$0.00');
      expect(loadExpenses()).toEqual([]);
    });

    it('sequentially deletes multiple items maintaining dashboard accuracy throughout', () => {
      const expenses: Expense[] = [
        { id: 'exp-1', amount: 10, description: 'Item 1', category: 'Food', date: '2026-10-01' },
        { id: 'exp-2', amount: 20, description: 'Item 2', category: 'Food', date: '2026-10-02' },
        { id: 'exp-3', amount: 30, description: 'Item 3', category: 'Food', date: '2026-10-03' },
      ];
      saveExpenses(expenses);

      render(<App initialMonth="2026-10" />);
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$60.00');

      // Delete middle item
      fireEvent.click(screen.getByRole('button', { name: /delete item 2/i }));
      expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$40.00');
      expect(loadExpenses()).toHaveLength(2);

      // Delete first item
      fireEvent.click(screen.getByRole('button', { name: /delete item 1/i }));
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$30.00');
      expect(loadExpenses()).toHaveLength(1);
    });

    it('deleting an expense from another month does not corrupt current month metrics', () => {
      const multiMonthExpenses: Expense[] = [
        { id: 'oct-exp', amount: 50, description: 'October Expense', category: 'Food', date: '2026-10-10' },
        { id: 'nov-exp', amount: 100, description: 'November Expense', category: 'Housing', date: '2026-11-05' },
      ];
      saveExpenses(multiMonthExpenses);

      render(<App initialMonth="2026-10" />);
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$50.00');

      // The expense list shows ALL expenses
      expect(screen.getByText('November Expense')).toBeInTheDocument();

      // Delete the November expense while viewing October
      fireEvent.click(screen.getByRole('button', { name: /delete november expense/i }));

      // October total remains $50.00
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$50.00');
      expect(screen.queryByText('November Expense')).not.toBeInTheDocument();
      expect(loadExpenses()).toHaveLength(1);
    });
  });

  describe('4. Monthly Dashboard Navigation & Boundary Conditions', () => {
    it('handles year rollover navigation correctly (Jan <-> Dec)', () => {
      const { container } = render(<App initialMonth="2026-01" />);

      const monthDisplay = container.querySelector('.current-month-display');
      expect(monthDisplay).toHaveTextContent('January 2026');

      // Navigate back from Jan 2026 -> Dec 2025
      const prevBtn = screen.getByRole('button', { name: /previous month/i });
      fireEvent.click(prevBtn);
      expect(monthDisplay).toHaveTextContent('December 2025');

      // Navigate forward from Dec 2025 -> Jan 2026
      const nextBtn = screen.getByRole('button', { name: /next month/i });
      fireEvent.click(nextBtn);
      expect(monthDisplay).toHaveTextContent('January 2026');

      // Navigate forward to Dec 2026 and then Jan 2027
      for (let i = 0; i < 11; i++) {
        fireEvent.click(nextBtn);
      }
      expect(monthDisplay).toHaveTextContent('December 2026');

      fireEvent.click(nextBtn);
      expect(monthDisplay).toHaveTextContent('January 2027');
    });

    it('switches automatically to the new expense month when adding an expense for a different month', () => {
      const { container } = render(<App initialMonth="2026-10" />);
      const monthDisplay = container.querySelector('.current-month-display');
      expect(monthDisplay).toHaveTextContent('October 2026');

      // Add expense in December 2026
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '300.00' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Holiday Gifts' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Entertainment' } });
      fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-12-25' } });

      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

      // Dashboard automatically focused on December 2026
      expect(monthDisplay).toHaveTextContent('December 2026');
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$300.00');
    });

    it('calculates category breakdown percentages and renders progressbars accurately without NaN or rounding errors', () => {
      const expenses: Expense[] = [
        { id: '1', amount: 10, description: 'Coffee', category: 'Food', date: '2026-10-01' },
        { id: '2', amount: 10, description: 'Bus', category: 'Transport', date: '2026-10-02' },
        { id: '3', amount: 10, description: 'Book', category: 'Entertainment', date: '2026-10-03' },
      ];
      saveExpenses(expenses);

      render(<App initialMonth="2026-10" />);

      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$30.00');

      // Each category is 33.33%
      const foodBar = screen.getByRole('progressbar', { name: /food spending percentage/i });
      expect(foodBar).toHaveAttribute('aria-valuenow', '33.33');
      expect(foodBar).toHaveAttribute('aria-valuemin', '0');
      expect(foodBar).toHaveAttribute('aria-valuemax', '100');

      // Month with 0 spend shows $0.00 and no NaN
      fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$0.00');
      expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    });

    it('allows selection from the available months dropdown', () => {
      const expenses: Expense[] = [
        { id: '1', amount: 50, description: 'July Treat', category: 'Food', date: '2026-07-15' },
        { id: '2', amount: 100, description: 'August Bill', category: 'Utilities', date: '2026-08-20' },
      ];
      saveExpenses(expenses);

      const { container } = render(<App initialMonth="2026-10" />);
      const monthSelect = screen.getByRole('combobox', { name: /select month/i });
      expect(monthSelect).toBeInTheDocument();

      // Switch to July 2026
      fireEvent.change(monthSelect, { target: { value: '2026-07' } });
      const monthDisplay = container.querySelector('.current-month-display');
      expect(monthDisplay).toHaveTextContent('July 2026');
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$50.00');
    });
  });

  describe('5. LocalStorage Resilience & Malformed Data Handling', () => {
    it('recovers gracefully when localStorage contains corrupted invalid JSON syntax', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(STORAGE_KEY, '{ broken-json string ]');

      render(<App initialMonth="2026-10" />);

      expect(screen.getByText(/no expenses found/i)).toBeInTheDocument();
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$0.00');

      warnSpy.mockRestore();
    });

    it('filters out corrupted or partial expense objects stored in localStorage', () => {
      const corruptedData = [
        null,
        123,
        { id: 'valid-1', amount: 45, description: 'Valid One', category: 'Food', date: '2026-10-01' },
        { id: '', amount: 50, description: 'Empty ID', category: 'Food', date: '2026-10-02' },
        { id: 'bad-amount', amount: 'forty', description: 'String Amount', category: 'Food', date: '2026-10-03' },
        { id: 'missing-date', amount: 20, description: 'No Date', category: 'Food' },
        { id: 'valid-2', amount: 60, description: 'Valid Two', category: 'Housing', date: '2026-10-05' },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(corruptedData));

      render(<App initialMonth="2026-10" />);

      // Only the two valid items should be rendered
      expect(screen.getByText('Valid One')).toBeInTheDocument();
      expect(screen.getByText('Valid Two')).toBeInTheDocument();
      expect(screen.queryByText('Empty ID')).not.toBeInTheDocument();
      expect(screen.queryByText('String Amount')).not.toBeInTheDocument();
      expect(screen.queryByText('No Date')).not.toBeInTheDocument();

      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$105.00');
    });

    it('supports custom storageKey prop without colliding with default storage', () => {
      const customKey = 'my_custom_expenses_key';
      const customData: Expense[] = [
        { id: 'custom-1', amount: 77.0, description: 'Custom Item', category: 'Transport', date: '2026-10-18' },
      ];
      saveExpenses(customData, customKey);

      render(<App storageKey={customKey} initialMonth="2026-10" />);

      expect(screen.getByText('Custom Item')).toBeInTheDocument();
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$77.00');

      // Default key remains untouched
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('6. Semantic HTML & Accessibility Compliance', () => {
    it('has proper form labels, table headers, and aria relationships', () => {
      const sample: Expense[] = [
        { id: 'acc-1', amount: 20.0, description: 'Lunch', category: 'Food', date: '2026-10-10' },
      ];
      saveExpenses(sample);

      const { container } = render(<App initialMonth="2026-10" />);
      const amountInput = screen.getByLabelText(/amount/i);
      expect(amountInput).toHaveAttribute('id', 'amount');
      expect(amountInput).toHaveAttribute('name', 'amount');

      const descInput = screen.getByLabelText(/description/i);
      expect(descInput).toHaveAttribute('id', 'description');

      const catSelect = screen.getByLabelText(/category/i);
      expect(catSelect).toHaveAttribute('id', 'category');

      const dateInput = screen.getByLabelText(/date/i);
      expect(dateInput).toHaveAttribute('id', 'date');

      // Check table headers
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(5);
      expect(headers[0]).toHaveTextContent('Date');
      expect(headers[1]).toHaveTextContent('Description');
      expect(headers[2]).toHaveTextContent('Category');
      expect(headers[3]).toHaveTextContent('Amount');
      expect(headers[4]).toHaveTextContent('Actions');

      // Check delete button has specific accessible name
      expect(screen.getByRole('button', { name: 'Delete Lunch' })).toBeInTheDocument();

      // Check month display has aria-live="polite"
      const monthDisplay = container.querySelector('.current-month-display');
      expect(monthDisplay).toHaveAttribute('aria-live', 'polite');
      expect(monthDisplay).toHaveTextContent('October 2026');
    });
  });
});
