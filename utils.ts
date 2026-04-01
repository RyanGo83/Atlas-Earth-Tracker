// --- SHARED TYPES ---
export type TimeRange = 'WTD' | 'MTD' | 'YTD' | 'ALL';

// --- DATE HELPERS ---

/**
 * Parse a YYYY-MM-DD string as local midnight instead of UTC.
 * 
 * Why this exists:
 * new Date("2026-04-01") → UTC midnight → March 31st 8pm in US Eastern
 * new Date("2026-04-01T00:00:00") → local midnight → April 1st 12am local
 * 
 * Without this, date filters (WTD, MTD, YTD) can accidentally exclude
 * today's entries due to timezone offset.
 */
export const parseLocalDate = (dateStr: string): Date => {
  return new Date(dateStr + 'T00:00:00');
};

/**
 * Get the cutoff date for a given time range.
 * Returns null for 'ALL' (no filtering needed).
 * 
 * WTD = Week to Date (Sunday of current week)
 * MTD = Month to Date (1st of current month)
 * YTD = Year to Date (January 1st of current year)
 */
export const getTimeRangeCutoff = (range: TimeRange): Date | null => {
  if (range === 'ALL') return null;

  const now = new Date();

  switch (range) {
    case 'WTD': {
      const firstOfWeek = new Date(now);
      firstOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      firstOfWeek.setHours(0, 0, 0, 0);
      return firstOfWeek;
    }
    case 'MTD':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'YTD':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
};

/**
 * Filter an array of items by a date field using the given time range.
 * 
 * Usage:
 *   filterByTimeRange(entries, 'date', timeRange)
 *   filterByTimeRange(history, 'dateSpotted', timeRange)
 */
export const filterByTimeRange = <T>(
  items: T[],
  dateField: keyof T,
  range: TimeRange
): T[] => {
  const cutoff = getTimeRangeCutoff(range);
  if (!cutoff) return items; // 'ALL' — no filtering

  return items.filter(item => {
    const dateStr = item[dateField] as string;
    return parseLocalDate(dateStr) >= cutoff;
  });
};
