import { TrackerCategory, TrackedPlayer } from '../types/player';

/**
 * Returns regulation game duration in minutes based on category:
 * - U15 & U16: 80 minutes
 * - U17 & U19: 90 minutes
 * - Woman's: 90 minutes
 */
export function getGameDurationMinutes(category: TrackerCategory): number {
  switch (category) {
    case 'U15':
    case 'U16':
      return 80;
    case 'U17':
    case 'U19':
    case 'Womans':
    default:
      return 90;
  }
}

/**
 * Returns total potential minutes player could have played:
 * (matchesEligible * matchDuration)
 * If matchesEligible is 0, falls back to matchesPlayed * matchDuration (or at least 1 match duration if minutes > 0).
 */
export function getTotalPossibleMinutes(
  matchesEligible: number,
  category: TrackerCategory,
  minutesPlayed: number = 0
): number {
  const duration = getGameDurationMinutes(category);
  const baseMatches = Math.max(matchesEligible, 0);
  if (baseMatches === 0) {
    if (minutesPlayed > 0) {
      return Math.max(Math.ceil(minutesPlayed / duration) * duration, duration);
    }
    return 0;
  }
  return baseMatches * duration;
}

/**
 * Calculates play time in percentage of total minutes they can play:
 * (minutesPlayed / totalPossibleMinutes) * 100%
 */
export function calculatePlayTimePercentage(
  minutesPlayed: number,
  matchesEligible: number,
  category: TrackerCategory
): number {
  const totalPossible = getTotalPossibleMinutes(matchesEligible, category, minutesPlayed);
  if (totalPossible <= 0) {
    return minutesPlayed > 0 ? 100 : 0;
  }
  const pct = Math.round((minutesPlayed / totalPossible) * 100);
  return Math.min(pct, 100);
}

/**
 * Total goals they were involved in: Goals + Assists
 */
export function calculateGoalInvolvements(goals: number, assists: number): number {
  return (goals || 0) + (assists || 0);
}

/**
 * Color class helper for percentage badge
 */
export function getPercentageColor(percentage: number): {
  bg: string;
  text: string;
  barColor: string;
} {
  if (percentage >= 80) {
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      barColor: 'bg-emerald-500',
    };
  }
  if (percentage >= 50) {
    return {
      bg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800',
      text: 'text-sky-700 dark:text-sky-300',
      barColor: 'bg-sky-500',
    };
  }
  if (percentage >= 25) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-300',
      barColor: 'bg-amber-500',
    };
  }
  return {
    bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
    barColor: 'bg-rose-500',
  };
}

export interface TargetProgressResult {
  hasTarget: boolean;
  target: number;
  actual: number;
  percentage: number;
  remaining: number;
  isReached: boolean;
  isExceeded: boolean;
  exceededBy: number;
}

/**
 * Calculates goal involvement target progress (Goals + Assists vs Target)
 */
export function calculateTargetProgress(
  goals: number = 0,
  assists: number = 0,
  target?: number
): TargetProgressResult {
  const actual = calculateGoalInvolvements(goals, assists);
  const targetNum = target && target > 0 ? target : 0;
  
  if (targetNum <= 0) {
    return {
      hasTarget: false,
      target: 0,
      actual,
      percentage: 0,
      remaining: 0,
      isReached: false,
      isExceeded: false,
      exceededBy: 0,
    };
  }

  const percentage = Math.round((actual / targetNum) * 100);
  const isReached = actual >= targetNum;
  const isExceeded = actual > targetNum;
  const remaining = Math.max(0, targetNum - actual);
  const exceededBy = Math.max(0, actual - targetNum);

  return {
    hasTarget: true,
    target: targetNum,
    actual,
    percentage,
    remaining,
    isReached,
    isExceeded,
    exceededBy,
  };
}

/**
 * Color class helper for target progress bar & badges
 */
export function getTargetProgressColor(progress: TargetProgressResult): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barColor: string;
} {
  if (!progress.hasTarget) {
    return {
      badgeBg: 'bg-slate-100 dark:bg-slate-800',
      badgeText: 'text-slate-600 dark:text-slate-400',
      badgeBorder: 'border-slate-200 dark:border-slate-700',
      barColor: 'bg-slate-400',
    };
  }

  if (progress.isReached) {
    return {
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
      badgeText: 'text-emerald-800 dark:text-emerald-200',
      badgeBorder: 'border-emerald-300 dark:border-emerald-700',
      barColor: 'bg-emerald-500',
    };
  }

  if (progress.percentage >= 60) {
    return {
      badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80',
      badgeText: 'text-indigo-800 dark:text-indigo-200',
      badgeBorder: 'border-indigo-300 dark:border-indigo-700',
      barColor: 'bg-indigo-500',
    };
  }

  if (progress.percentage >= 30) {
    return {
      badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
      badgeText: 'text-amber-800 dark:text-amber-200',
      badgeBorder: 'border-amber-300 dark:border-amber-700',
      barColor: 'bg-amber-500',
    };
  }

  return {
    badgeBg: 'bg-rose-100 dark:bg-rose-950/80',
    badgeText: 'text-rose-800 dark:text-rose-200',
    badgeBorder: 'border-rose-300 dark:border-rose-700',
    barColor: 'bg-rose-500',
  };
}

