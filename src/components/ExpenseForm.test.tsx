import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseForm } from './ExpenseForm';

describe('ExpenseForm Component', () => {
  it('renders all required form controls with labels', () => {
    const onAdd = vi.fn().mockReturnValue({ success: true });
    render(<ExpenseForm onAddExpense={onAdd} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
  });

  it('displays inline validation errors when submitting an empty form', () => {
    const onAdd = vi.fn().mockReturnValue({ success: true });
    render(<ExpenseForm onAddExpense={onAdd} />);

    const submitBtn = screen.getByRole('button', { name: /add expense/i });
    fireEvent.click(submitBtn);

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    expect(screen.getByText(/description cannot be empty/i)).toBeInTheDocument();
    expect(screen.getByText(/category is required/i)).toBeInTheDocument();
  });

  it('displays inline validation errors for negative amount', () => {
    const onAdd = vi.fn().mockReturnValue({ success: true });
    render(<ExpenseForm onAddExpense={onAdd} />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '-25' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Lunch' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Food' } });
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-10-15' } });

    fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText(/positive number greater than zero/i)).toBeInTheDocument();
  });

  it('submits valid input, calls onAddExpense, and resets fields', () => {
    const onAdd = vi.fn().mockReturnValue({ success: true });
    render(<ExpenseForm onAddExpense={onAdd} />);

    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
    const descInput = screen.getByLabelText(/description/i) as HTMLInputElement;
    const catSelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;

    fireEvent.change(amountInput, { target: { value: '45.50' } });
    fireEvent.change(descInput, { target: { value: 'Groceries' } });
    fireEvent.change(catSelect, { target: { value: 'Food' } });
    fireEvent.change(dateInput, { target: { value: '2026-10-20' } });

    fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

    expect(onAdd).toHaveBeenCalledWith({
      amount: 45.5,
      description: 'Groceries',
      category: 'Food',
      date: '2026-10-20',
    });

    // Form reset
    expect(amountInput.value).toBe('');
    expect(descInput.value).toBe('');
    expect(catSelect.value).toBe('');
  });

  it('clears inline errors as user types new input', () => {
    const onAdd = vi.fn().mockReturnValue({ success: true });
    render(<ExpenseForm onAddExpense={onAdd} />);

    // Trigger errors
    fireEvent.click(screen.getByRole('button', { name: /add expense/i }));
    expect(screen.getByText(/amount is required/i)).toBeInTheDocument();

    // Type into amount
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '15' } });
    expect(screen.queryByText(/amount is required/i)).not.toBeInTheDocument();
  });
});
