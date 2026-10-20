import React from 'react';
import { CategoryBreakdownItem } from '../types/expense';
import { CategoryBreakdown } from './CategoryBreakdown';
import { formatCurrency, formatYearMonth } from '../utils/formatters';

export interface MonthlyDashboardProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  totalSpend: number;
  breakdown: CategoryBreakdownItem[];
  availableMonths?: string[];
}

export const MonthlyDashboard: React.FC<MonthlyDashboardProps> = ({
  selectedMonth,
  onMonthChange,
  totalSpend,
  breakdown,
  availableMonths = [],
}) => {
  const handlePrevMonth = () => {
    const match = /^(\d{4})-(\d{2})$/.exec(selectedMonth);
    if (!match) return;
    let year = parseInt(match[1], 10);
    let month = parseInt(match[2], 10) - 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    onMonthChange(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const match = /^(\d{4})-(\d{2})$/.exec(selectedMonth);
    if (!match) return;
    let year = parseInt(match[1], 10);
    let month = parseInt(match[2], 10) + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    onMonthChange(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) {
      onMonthChange(e.target.value);
    }
  };

  const handleMonthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onMonthChange(e.target.value);
    }
  };

  const formattedMonth = formatYearMonth(selectedMonth);

  return (
    <div className="monthly-dashboard" data-testid="monthly-dashboard">
      <div className="dashboard-controls">
        <div className="month-navigation">
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            title="Previous month"
          >
            &larr;
          </button>

          <span className="current-month-display" aria-live="polite">
            {formattedMonth || selectedMonth}
          </span>

          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={handleNextMonth}
            aria-label="Next month"
            title="Next month"
          >
            &rarr;
          </button>
        </div>

        <div className="month-picker-container">
          {availableMonths.length > 0 ? (
            <select
              aria-label="Select month"
              value={selectedMonth}
              onChange={handleSelectChange}
              className="month-select"
            >
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatYearMonth(ym)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="month"
              aria-label="Select month"
              value={selectedMonth}
              onChange={handleMonthInputChange}
              className="month-input"
            />
          )}
        </div>
      </div>

      <div className="total-spending-card" data-testid="total-spending-card">
        <span className="total-spending-label">
          Total Spent ({formattedMonth || selectedMonth})
        </span>
        <span className="total-spending-amount" data-testid="monthly-total-value">
          {formatCurrency(totalSpend)}
        </span>
      </div>

      <CategoryBreakdown breakdown={breakdown} />
    </div>
  );
};
