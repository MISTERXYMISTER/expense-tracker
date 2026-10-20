import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryBreakdown } from './CategoryBreakdown';
import { CategoryBreakdownItem } from '../types/expense';

describe('CategoryBreakdown Component', () => {
  const sampleBreakdown: CategoryBreakdownItem[] = [
    { category: 'Food', total: 150.0, percentage: 60.0 },
    { category: 'Transport', total: 75.0, percentage: 30.0 },
    { category: 'Other', total: 25.0, percentage: 10.0 },
  ];

  it('renders category names, dollar totals, and percentages', () => {
    render(<CategoryBreakdown breakdown={sampleBreakdown} />);

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('(60%)')).toBeInTheDocument();

    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('$75.00')).toBeInTheDocument();
    expect(screen.getByText('(30%)')).toBeInTheDocument();

    expect(screen.getByText('Other')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.getByText('(10%)')).toBeInTheDocument();
  });

  it('renders progressbars with appropriate aria attributes', () => {
    render(<CategoryBreakdown breakdown={sampleBreakdown} />);

    const foodProgress = screen.getByRole('progressbar', { name: /food spending percentage/i });
    expect(foodProgress).toHaveAttribute('aria-valuenow', '60');
    expect(foodProgress).toHaveAttribute('aria-valuemin', '0');
    expect(foodProgress).toHaveAttribute('aria-valuemax', '100');
  });

  it('handles zero spend gracefully', () => {
    const zeroBreakdown: CategoryBreakdownItem[] = [
      { category: 'Food', total: 0, percentage: 0 },
    ];
    render(<CategoryBreakdown breakdown={zeroBreakdown} />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('(0%)')).toBeInTheDocument();
  });
});
