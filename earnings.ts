// --- EARNINGS MATH ---
// Computes actual earnings from totalAccrued history snapshots (lifetime accrual deltas),
// and projection rates from current rent data.
//
// "Earnings for a period" = (totalAccrued at end of period) - (totalAccrued just before period).
// Falls back gracefully when snapshots are sparse, exposing a confidence flag so the UI
// can indicate when a number is exact vs estimated vs partial.

import { parseLocalDate } from './utils';

// --- TYPES ---
export interface EarningsHistoryItem {
  date: string;          // YYYY-MM-DD
  totalAccrued: number;  // dollars (lifetime accrual)
}

export type Confidence = 'exact' | 'estimate' | 'partial';

export interface PeriodEarnings {
  label: string;
  earned: number;            // dollars in this period (>= 0)
  daysInPeriod: number;      // span used for daily average
  dailyAverage: number;      // earned / daysInPeriod
  baselineDate: string | null;  // snapshot used as baseline
  endDate: string | null;       // snapshot used as end
  confidence: Confidence;    // see below
  baselineAge: number;       // days between period start and baseline date
                             //   >  0 = baseline is BEFORE period start (good)
                             //   == 0 = baseline is AT period start (perfect)
                             //   <  0 = baseline is INSIDE period (partial)
}

// Confidence guide:
//   exact    — baseline is at or within 1 day before the period start
//   estimate — baseline is more than 1 day before period start (a few days of drift)
//   partial  — no pre-period snapshot exists, so we use the earliest in-period snapshot
//              and only count earnings from that snapshot forward

export interface AllPeriodEarnings {
  today: PeriodEarnings | null;
  thisWeek: PeriodEarnings | null;
  thisMonth: PeriodEarnings | null;
  lastMonth: PeriodEarnings | null;
  thisYear: PeriodEarnings | null;
  last30: PeriodEarnings | null;
  prior30: PeriodEarnings | null;  // for momentum: 30 days BEFORE last30
  allTime: PeriodEarnings | null;
}

// --- DATE HELPERS ---
export const startOfDay = (d?: Date): Date => {
  const date = d || new Date();
  const out = new Date(date);
  out.setHours(0, 0, 0, 0);
  return out;
};

export const startOfWeek = (d?: Date): Date => {
  const date = d || new Date();
  const out = new Date(date);
  out.setDate(date.getDate() - date.getDay()); // Sunday
  out.setHours(0, 0, 0, 0);
  return out;
};

export const startOfMonth = (d?: Date): Date => {
  const date = d || new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const startOfYear = (d?: Date): Date => {
  const date = d || new Date();
  return new Date(date.getFullYear(), 0, 1);
};

export const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const tomorrowMidnight = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// --- INTERNAL HELPERS ---
const findSnapshotAtOrBefore = (
  sorted: EarningsHistoryItem[],
  cutoff: Date
): EarningsHistoryItem | null => {
  let best: EarningsHistoryItem | null = null;
  let bestTime = -Infinity;
  for (const h of sorted) {
    const t = parseLocalDate(h.date).getTime();
    if (t <= cutoff.getTime() && t > bestTime) {
      best = h;
      bestTime = t;
    }
  }
  return best;
};

const findSnapshotAtOrAfter = (
  sorted: EarningsHistoryItem[],
  start: Date
): EarningsHistoryItem | null => {
  let best: EarningsHistoryItem | null = null;
  let bestTime = Infinity;
  for (const h of sorted) {
    const t = parseLocalDate(h.date).getTime();
    if (t >= start.getTime() && t < bestTime) {
      best = h;
      bestTime = t;
    }
  }
  return best;
};

// --- PUBLIC: PERIOD EARNINGS ---

/**
 * Compute earnings for a date range based on totalAccrued deltas.
 * Returns null if not enough data exists at all.
 */
export const earningsForPeriod = (
  history: EarningsHistoryItem[],
  periodStart: Date,
  periodEnd: Date,
  label: string
): PeriodEarnings | null => {
  if (!history || history.length === 0) return null;

  // De-dupe by date (latest entry per date wins) and sort ascending
  const byDate: Record<string, EarningsHistoryItem> = {};
  history.forEach(h => {
    if (h.date && typeof h.totalAccrued === 'number') {
      byDate[h.date] = h;
    }
  });
  const sorted = Object.values(byDate).sort((a, b) =>
    parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
  );
  if (sorted.length === 0) return null;

  // Baseline: latest snapshot strictly BEFORE periodStart
  const baselineCutoff = new Date(periodStart.getTime() - 1);
  const preBaseline = findSnapshotAtOrBefore(sorted, baselineCutoff);

  // If no pre-period baseline, use earliest in-period snapshot
  const effectiveBaseline = preBaseline || findSnapshotAtOrAfter(sorted, periodStart);
  if (!effectiveBaseline) return null;

  // End: latest snapshot at-or-before periodEnd
  const endSnapshot = findSnapshotAtOrBefore(sorted, periodEnd);
  if (!endSnapshot) return null;

  // Compute baseline age (days between period start and baseline)
  const baselineDate = parseLocalDate(effectiveBaseline.date);
  const dayMs = 1000 * 60 * 60 * 24;
  const baselineAge = Math.floor(
    (periodStart.getTime() - baselineDate.getTime()) / dayMs
  );

  // Determine confidence
  let confidence: Confidence;
  if (!preBaseline) {
    confidence = 'partial';
  } else if (baselineAge <= 1) {
    confidence = 'exact';
  } else {
    confidence = 'estimate';
  }

  // If baseline is the same day as end, no measurable earnings yet
  if (effectiveBaseline.date === endSnapshot.date) {
    return {
      label,
      earned: 0,
      daysInPeriod: 0,
      dailyAverage: 0,
      baselineDate: effectiveBaseline.date,
      endDate: endSnapshot.date,
      confidence,
      baselineAge
    };
  }

  const earned = Math.max(0, endSnapshot.totalAccrued - effectiveBaseline.totalAccrued);

  // Days span: from baseline to end snapshot (or period start to end if baseline is in-period)
  const effectiveStart = preBaseline ? baselineDate : parseLocalDate(effectiveBaseline.date);
  const effectiveEnd = parseLocalDate(endSnapshot.date);
  const daysInPeriod = Math.max(
    1,
    Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / dayMs)
  );

  return {
    label,
    earned,
    daysInPeriod,
    dailyAverage: earned / daysInPeriod,
    baselineDate: effectiveBaseline.date,
    endDate: endSnapshot.date,
    confidence,
    baselineAge
  };
};

/**
 * Compute earnings for all the standard periods at once.
 */
export const computeAllPeriods = (history: EarningsHistoryItem[]): AllPeriodEarnings => {
  const tomorrow = tomorrowMidnight();
  const thisMonthStart = startOfMonth();
  const lastMonthStart = new Date(
    thisMonthStart.getFullYear(),
    thisMonthStart.getMonth() - 1,
    1
  );

  return {
    today:     earningsForPeriod(history, startOfDay(),    tomorrow,        'Today'),
    thisWeek:  earningsForPeriod(history, startOfWeek(),   tomorrow,        'This week'),
    thisMonth: earningsForPeriod(history, thisMonthStart,  tomorrow,        'This month'),
    lastMonth: earningsForPeriod(history, lastMonthStart,  thisMonthStart,  'Last month'),
    thisYear:  earningsForPeriod(history, startOfYear(),   tomorrow,        'This year'),
    last30:    earningsForPeriod(history, daysAgo(30),     tomorrow,        'Last 30 days'),
    prior30:   earningsForPeriod(history, daysAgo(60),     daysAgo(30),     'Prior 30 days'),
    allTime:   earningsForPeriod(history, new Date(2000, 0, 1), tomorrow,   'All time')
  };
};

// --- PROJECTION MATH ---
// Same logic as RentTracker's calculateAll, extracted so the Performance tab
// can compute "what your setup SHOULD be earning" without duplicating code.

export interface RentDataSnapshot {
  common?: number;
  rare?: number;
  epic?: number;
  legendary?: number;
  badgeCount?: number;
  boostAdHours?: number;
  srbHoursMonth?: number;
}

export interface Projection {
  totalParcels: number;
  badgeInfo: { level: number; boost: number; mult: number };
  adMult: number;
  hourlyTotal: number;
  avgDailyIncome: number;
  monthlyIncome: number;
  yearlyIncome: number;
  dailyIncomeNormal: number;  // a normal boosted day
  srbDailyIncome: number;     // a Super Rent Boost day
}

const RATES = {
  common: 0.0000000011,
  rare: 0.0000000016,
  epic: 0.0000000022,
  legendary: 0.0000000044
};

const getBadgeMultiplier = (count: number) => {
  if (count === 0) return { level: 0, boost: 0, mult: 1.00 };
  if (count <= 10) return { level: 1, boost: 5, mult: 1.05 };
  if (count <= 30) return { level: 2, boost: 10, mult: 1.10 };
  if (count <= 60) return { level: 3, boost: 15, mult: 1.15 };
  if (count <= 100) return { level: 4, boost: 20, mult: 1.20 };
  return { level: 5, boost: 25, mult: 1.25 };
};

const getAdBoostMultiplier = (parcels: number): number => {
  if (parcels <= 150) return 30;
  if (parcels <= 220) return 20;
  if (parcels <= 290) return 15;
  if (parcels <= 365) return 12;
  if (parcels <= 435) return 10;
  if (parcels <= 545) return 8;
  if (parcels <= 625) return 7;
  if (parcels <= 730) return 6;
  if (parcels <= 875) return 5;
  if (parcels <= 1100) return 4;
  if (parcels <= 1500) return 3;
  return 2;
};

export const projectionFromRentData = (data: RentDataSnapshot): Projection => {
  const common = data.common || 0;
  const rare = data.rare || 0;
  const epic = data.epic || 0;
  const legendary = data.legendary || 0;
  const badgeCount = data.badgeCount || 0;
  const boostAdHours = data.boostAdHours || 0;
  const srbHoursMonth = data.srbHoursMonth || 0;

  const totalParcels = common + rare + epic + legendary;
  const badgeInfo = getBadgeMultiplier(badgeCount);
  const adMult = getAdBoostMultiplier(totalParcels);

  const basePerSec =
    (common * RATES.common) +
    (rare * RATES.rare) +
    (epic * RATES.epic) +
    (legendary * RATES.legendary);

  const boostedPerSec = basePerSec * badgeInfo.mult * adMult;
  const normalPerSec = basePerSec * badgeInfo.mult;
  const srbPerSec = basePerSec * badgeInfo.mult * 50;

  const normalHours = 24 - boostAdHours;
  const dailyIncomeNormal = (normalPerSec * normalHours * 3600) + (boostedPerSec * boostAdHours * 3600);

  const srbDays = srbHoursMonth / 24;
  const normalDays = 30 - srbDays;
  const srbDailyIncome = (normalPerSec * normalHours * 3600) + (srbPerSec * boostAdHours * 3600);

  const monthlyIncome = (dailyIncomeNormal * normalDays) + (srbDailyIncome * srbDays);
  const avgDailyIncome = monthlyIncome / 30;

  return {
    totalParcels,
    badgeInfo,
    adMult,
    hourlyTotal: avgDailyIncome / 24,
    avgDailyIncome,
    monthlyIncome,
    yearlyIncome: avgDailyIncome * 365,
    dailyIncomeNormal,
    srbDailyIncome
  };
};

// --- COMPARISON HELPER ---
// Given a period earned amount and a projection's daily rate,
// return what the projection WOULD predict for that period (for side-by-side comparison).
export const projectedForDays = (projection: Projection, days: number): number => {
  return projection.avgDailyIncome * days;
};
