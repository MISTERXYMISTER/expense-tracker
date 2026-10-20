import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from '../../src/App';

describe('QA Edge Case & Boundary Verification - Issue #1 Skeleton', () => {
  it('detects uncleaned body elements when run in isolation or between suites', () => {
    expect(document.body.innerHTML).toBe('');
  });

  it('renders application shell properly with expected semantic structure', () => {
    const { container } = render(<App />);
    
    // Verify container and core structure
    const appContainer = container.querySelector('.app-container');
    expect(appContainer).toBeInTheDocument();
    
    const header = container.querySelector('header.header');
    expect(header).toBeInTheDocument();

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();

    const card = container.querySelector('section.card');
    expect(card).toBeInTheDocument();

    // Verify typography and headings
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Expense Tracker');

    const h2 = screen.getByRole('heading', { level: 2 });
    expect(h2).toHaveTextContent('Overview');
  });

  it('handles multiple consecutive mounts and cleanups without DOM residue', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    cleanup();
    expect(document.body.innerHTML).toBe('');

    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    cleanup();
    expect(document.body.innerHTML).toBe('');
  });

  it('verifies App module exports both default and named components', async () => {
    const module = await import('../../src/App');
    expect(module.default).toBeDefined();
    expect(module.App).toBeDefined();
    expect(typeof module.default).toBe('function');
    expect(typeof module.App).toBe('function');
  });

  it('renders with correct CSS classes for styling shell', () => {
    const { container } = render(<App />);
    expect(container.getElementsByClassName('app-container').length).toBe(1);
    expect(container.getElementsByClassName('header').length).toBe(1);
    expect(container.getElementsByClassName('card').length).toBe(1);
    expect(container.getElementsByClassName('empty-state').length).toBe(1);
  });
});
