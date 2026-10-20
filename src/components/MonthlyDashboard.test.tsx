import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthlyDashboard } from './MonthlyDashboard';
import { CategoryBreakdownItem } from '../types/expense';

describe('MonthlyDashboard Component', () => {
  const mockMonthChange = vi.fn();
  const sampleBreakdown: CategoryBreakdownItem[] = [
    { category: 'Food', total: 100, percentage: 50 },
    { category: 'Utilities', total: 100, percentage: 50 },
  ];

  it('renders total spending and expense count for the selected month and breakdown', () => {
    render(
      <MonthlyDashboard
        selectedMonth="2026-10"
        onMonthChange={mockMonthChange}
        totalSpend={200.0}
        expenseCount={3}
        breakdown={sampleBreakdown}
      />
    );

    expect(screen.getByText('October 2026')).toBeInTheDocument();
    expect(screen.getByTestId('monthly-total-value')).toHaveTextContent('$200.00');
    expect(screen.getByTestId('monthly-total-count')).toHaveTextContent('(3 expenses)');
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
  });

  it('navigates to previous and next months when buttons are clicked', () => {
    const { rerender } = render(
      <MonthlyDashboard
        selectedMonth="2026-10"
        onMonthChange={mockMonthChange}
        totalSpend={0}
        breakdown={[]}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /previous month/i });
    fireEvent.click(prevBtn);
    expect(mockMonthChange).toHaveBeenCalledWith('2026-09');

    const nextBtn = screen.getByRole('button', { name: /next month/i });
    fireEvent.click(nextBtn);
    expect(mockMonthChange).toHaveBeenCalledWith('2026-11');

    // Test year wrap-around
    rerender(
      <MonthlyDashboard
        selectedMonth="2026-01"
        onMonthChange={mockMonthChange}
        totalSpend={0}
        breakdown={[]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(mockMonthChange).toHaveBeenCalledWith('2025-12');
  });

  it('allows user to select month from available months dropdown', () => {
    render(
      <MonthlyDashboard
        selectedMonth="2026-10"
        onMonthChange={mockMonthChange}
        totalSpend={100}
        breakdown={sampleBreakdown}
        availableMonths={['2026-10', '2026-09', '2026-08']}
      />
    );

    const select = screen.getByRole('combobox', { name: /select month/i });
    fireEvent.change(select, { target: { value: '2026-09' } });

    expect(mockMonthChange).toHaveBeenCalledWith('2026-09');
  });
});
