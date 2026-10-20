import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Smoke Test', () => {
  it('renders the Expense Tracker title and overview container', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /expense tracker/i })).toBeInTheDocument();
    expect(screen.getByText(/track your daily expenditures/i)).toBeInTheDocument();
  });
});
