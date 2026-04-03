/**
 * Date utility functions for handling UTC to local timezone conversions
 *
 * Backend always returns UTC dates, frontend converts to local time
 */

/**
 * Parse a UTC date string from the backend and return a local Date object
 * Handles both ISO 8601 formats (with/without timezone info)
 *
 * @param dateString - UTC date string from backend (e.g., "2024-04-03T12:00:00Z" or "2024-04-03T12:00:00")
 * @returns Date object in local timezone
 */
export function parseUTCDate(dateString: string): Date {
  // If the date string doesn't have timezone info, assume UTC
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    // Add Z to indicate UTC
    if (dateString.includes('T')) {
      dateString = dateString + 'Z';
    } else {
      // Date only (YYYY-MM-DD), assume UTC midnight
      dateString = dateString + 'T00:00:00Z';
    }
  }

  return new Date(dateString);
}

/**
 * Format a UTC date string from backend to a localized date string
 *
 * @param dateString - UTC date string from backend
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string in local timezone
 */
export function formatUTCDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const date = parseUTCDate(dateString);
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a UTC date string to show relative time (e.g., "5m ago", "2h ago")
 * Used for timestamps like notification creation times
 *
 * @param dateString - UTC date string from backend
 * @returns Human-readable relative time string
 */
export function formatTimeAgo(dateString: string): string {
  const date = parseUTCDate(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  // For older dates, show the formatted date
  return formatUTCDate(dateString, { month: 'short', day: 'numeric' });
}

/**
 * Format a UTC datetime to include both date and time
 *
 * @param dateString - UTC date string from backend
 * @returns Formatted datetime string in local timezone
 */
export function formatUTCDateTime(dateString: string): string {
  const date = parseUTCDate(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date for input fields (YYYY-MM-DD format)
 * Converts a local date to the format expected by date inputs
 *
 * @param date - Date object in local timezone
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start and end dates for common date ranges
 * Used for dashboard and report filters
 */
export function getDateRange(range: string): { startDate: string; endDate: string } {
  const today = new Date();
  let startDate: Date;
  let endDate = today;

  switch (range) {
    case 'current_month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'last_3_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      break;
    case 'current_year':
    case 'year_to_date':
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return {
    startDate: formatDateForInput(startDate),
    endDate: formatDateForInput(endDate),
  };
}
