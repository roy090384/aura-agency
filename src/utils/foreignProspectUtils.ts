import { ForeignProspect } from '../types/player';

export const FOREIGN_STATUS_STALE_DAYS = 5;

/**
 * Parses a date string (YYYY-MM-DD or full ISO timestamp) and returns
 * whole days elapsed since the prospect's negotiation status was last set/changed.
 */
export function getDaysSinceForeignStatusChange(
  prospect: ForeignProspect,
  referenceDate: Date = new Date()
): number {
  const refStr = prospect.statusUpdatedAt || prospect.updatedAt || prospect.createdAt;
  if (!refStr) return 0;

  // Normalize YYYY-MM-DD to local start-of-day, or parse ISO timestamp directly
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(refStr.trim())
    ? new Date(`${refStr.trim()}T00:00:00`)
    : new Date(refStr);

  if (isNaN(parsed.getTime())) return 0;

  const refDayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const parsedDayStart = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );

  const diffMs = refDayStart.getTime() - parsedDayStart.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function isForeignProspectStatusStale(
  prospect: ForeignProspect,
  thresholdDays: number = FOREIGN_STATUS_STALE_DAYS,
  referenceDate: Date = new Date()
): boolean {
  return getDaysSinceForeignStatusChange(prospect, referenceDate) >= thresholdDays;
}
