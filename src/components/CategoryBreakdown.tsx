import React from 'react';
import { CategoryBreakdownItem } from '../types/expense';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export interface CategoryBreakdownProps {
  breakdown: CategoryBreakdownItem[];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ breakdown }) => {
  return (
    <div className="category-breakdown">
      <h4 className="breakdown-title">Category Breakdown</h4>
      <div className="breakdown-list">
        {breakdown.map((item) => {
          const catClass = item.category.toLowerCase();
          return (
            <div
              key={item.category}
              className="breakdown-item"
              data-testid={`breakdown-${catClass}`}
            >
              <div className="breakdown-header">
                <span className="breakdown-category">
                  <span className={`category-dot dot-${catClass}`} />
                  {item.category}
                </span>
                <span className="breakdown-values">
                  <span className="breakdown-amount">{formatCurrency(item.total)}</span>
                  <span className="breakdown-percent">({formatPercentage(item.percentage)})</span>
                </span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label={`${item.category} spending percentage`}
                aria-valuenow={item.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`progress-fill fill-${catClass}`}
                  style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
