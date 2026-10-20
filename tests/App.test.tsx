import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('Project Skeleton Smoke Test', () => {
  it('mounts the application root and verifies core elements exist', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: 'Expense Tracker' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument();
  });
});
