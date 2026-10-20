import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../src/App';
import { saveExpenses } from '../src/services/storage';
import { Expense } from '../src/types/expense';

describe('Issue #3 - UI, Expense Management & LocalStorage Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Feature 2: Expense Creation, Inline Validation & Prepending', () => {
    it('creates an expense on valid form submission, prepends to the list, updates dashboard and persists to localStorage', () => {
      render(<App initialMonth="2026-10" />);

      // Initial state
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$0.00');

      // Fill in valid expense
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '42.50' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Groceries at Market' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Food' } });
      fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-10-15' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

      // Form reset
      expect((screen.getByLabelText(/amount/i) as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText(/description/i) as HTMLInputElement).value).toBe('');

      // Prepended to list
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
      expect(within(rows[1]).getByText('Groceries at Market')).toBeInTheDocument();
      expect(within(rows[1]).getByText('$42.50')).toBeInTheDocument();
      expect(within(rows[1]).getByText('Food')).toBeInTheDocument();

      // Dashboard updated
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$42.50');

      // LocalStorage updated
      const rawStored = localStorage.getItem('expenses');
      expect(rawStored).toBeTruthy();
      const parsed = JSON.parse(rawStored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].description).toBe('Groceries at Market');
      expect(parsed[0].amount).toBe(42.50);
    });

    it('displays inline validation errors when submitting invalid inputs and prevents creation', () => {
      render(<App initialMonth="2026-10" />);

      // Submit empty form
      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

      // Check inline errors
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description cannot be empty/i)).toBeInTheDocument();
      expect(screen.getByText(/category is required/i)).toBeInTheDocument();

      // Nothing added to storage
      expect(localStorage.getItem('expenses')).toBe('[]');
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$0.00');
    });

    it('rejects negative amount and non-positive numbers with inline errors', () => {
      render(<App initialMonth="2026-10" />);

      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '-5.00' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Refund' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Other' } });
      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

      expect(screen.getByText(/greater than zero/i)).toBeInTheDocument();
      expect(localStorage.getItem('expenses')).toBe('[]');
    });
  });

  describe('Feature 3: Expense List Reverse Chronological Order & Deletion', () => {
    it('displays expenses in reverse chronological order', () => {
      const seed: Expense[] = [
        { id: '1', amount: 10, description: 'Old Coffee', category: 'Food', date: '2026-10-01' },
        { id: '2', amount: 90, description: 'Latest Dinner', category: 'Food', date: '2026-10-20' },
        { id: '3', amount: 30, description: 'Midday Lunch', category: 'Food', date: '2026-10-10' },
      ];
      saveExpenses(seed);

      render(<App initialMonth="2026-10" />);

      const rows = screen.getAllByRole('row');
      // row 0 is table header
      expect(rows[1]).toHaveTextContent('Latest Dinner');
      expect(rows[2]).toHaveTextContent('Midday Lunch');
      expect(rows[3]).toHaveTextContent('Old Coffee');
    });

    it('deleting an item removes it from list and immediately updates localStorage and dashboard totals', () => {
      const seed: Expense[] = [
        { id: 'exp-1', amount: 100, description: 'Rent portion', category: 'Housing', date: '2026-10-05' },
        { id: 'exp-2', amount: 50, description: 'Groceries', category: 'Food', date: '2026-10-12' },
      ];
      saveExpenses(seed);

      render(<App initialMonth="2026-10" />);

      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$150.00');
      expect(screen.getByText('Rent portion')).toBeInTheDocument();

      // Click delete for rent portion
      const deleteBtn = screen.getByRole('button', { name: /delete rent portion/i });
      fireEvent.click(deleteBtn);

      // Verify removed from screen
      expect(screen.queryByText('Rent portion')).not.toBeInTheDocument();
      expect(screen.getByText('Groceries')).toBeInTheDocument();

      // Verify dashboard immediately updated to $50.00
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$50.00');

      // Verify localStorage updated
      const stored = JSON.parse(localStorage.getItem('expenses')!);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('exp-2');
    });
  });

  describe('Feature 4: Monthly Dashboard Navigation & Category Breakdown', () => {
    it('allows navigating between months and displays accurate total spending and category breakdown percentages', () => {
      const multiMonthSeed: Expense[] = [
        { id: 'sep-1', amount: 200, description: 'September Rent', category: 'Housing', date: '2026-09-01' },
        { id: 'oct-1', amount: 75, description: 'October Utilities', category: 'Utilities', date: '2026-10-05' },
        { id: 'oct-2', amount: 25, description: 'October Lunch', category: 'Food', date: '2026-10-10' },
      ];
      saveExpenses(multiMonthSeed);

      render(<App initialMonth="2026-10" />);

      // October metrics: Total $100.00, Utilities $75 (75%), Food $25 (25%)
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$100.00');

      const utilitiesBreakdown = screen.getByTestId('breakdown-utilities');
      expect(within(utilitiesBreakdown).getByText('$75.00')).toBeInTheDocument();
      expect(within(utilitiesBreakdown).getByText('(75%)')).toBeInTheDocument();

      const foodBreakdown = screen.getByTestId('breakdown-food');
      expect(within(foodBreakdown).getByText('$25.00')).toBeInTheDocument();
      expect(within(foodBreakdown).getByText('(25%)')).toBeInTheDocument();

      // Navigate to Previous Month (September 2026)
      const prevBtn = screen.getByRole('button', { name: /previous month/i });
      fireEvent.click(prevBtn);

      // September metrics: Total $200.00, Housing $200 (100%)
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$200.00');
      const housingBreakdown = screen.getByTestId('breakdown-housing');
      expect(within(housingBreakdown).getByText('$200.00')).toBeInTheDocument();
      expect(within(housingBreakdown).getByText('(100%)')).toBeInTheDocument();
    });
  });

  describe('Data Persistence across mounts', () => {
    it('restores all saved expenses from localStorage on initial load', () => {
      const persistedExpenses: Expense[] = [
        { id: 'persist-1', amount: 88.0, description: 'Weekly Metro Pass', category: 'Transport', date: '2026-10-14' },
      ];
      saveExpenses(persistedExpenses);

      const { unmount } = render(<App initialMonth="2026-10" />);
      expect(screen.getByText('Weekly Metro Pass')).toBeInTheDocument();
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$88.00');

      // Unmount and remount (simulating browser page reload)
      unmount();

      render(<App initialMonth="2026-10" />);
      expect(screen.getByText('Weekly Metro Pass')).toBeInTheDocument();
      expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$88.00');
    });
  });
});
