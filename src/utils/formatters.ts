/**
 * Formats a numeric amount to standard currency format (e.g. $1,234.56).
 * Handles edge cases like zero, negative numbers, numeric strings, and floating-point inputs.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '$0.00';
  }

  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Formats a percentage value (0-100) to a display string (e.g. "25.0%" or "25%").
 */
export function formatPercentage(
  percentage: number | null | undefined,
  decimals: number = 1
): string {
  if (percentage === null || percentage === undefined || isNaN(percentage) || !isFinite(percentage)) {
    return '0%';
  }
  return `${Number(percentage.toFixed(decimals))}%`;
}

/**
 * Formats a YYYY-MM-DD date string into a user-friendly localized date string (e.g. "Jan 15, 2024").
 */
export function formatDate(
  dateStr: string | Date | null | undefined,
  locale: string = 'en-US'
): string {
  if (!dateStr) return '';
  const dateObj = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(dateObj.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(dateObj);
}

/**
 * Formats a YYYY-MM yearMonth string to "Month YYYY" (e.g. "2024-05" -> "May 2024").
 */
export function formatYearMonth(
  yearMonth: string | Date | null | undefined,
  locale: string = 'en-US'
): string {
  if (!yearMonth) return '';
  let y: number;
  let m: number;

  if (yearMonth instanceof Date) {
    y = yearMonth.getFullYear();
    m = yearMonth.getMonth() + 1;
  } else {
    const match = /^(\d{4})[-/.](\d{1,2})/.exec(yearMonth.trim());
    if (!match) return yearMonth;
    y = parseInt(match[1], 10);
    m = parseInt(match[2], 10);
  }

  const dateObj = new Date(Date.UTC(y, m - 1, 1));
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(dateObj);
}
