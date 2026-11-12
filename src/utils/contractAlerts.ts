import { ContractUrgency } from '../types/player';

export function getContractDaysRemaining(expiryDateStr: string): number {
  if (!expiryDateStr) return 999;
  const targetDate = new Date(expiryDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getContractUrgency(expiryDateStr: string): ContractUrgency {
  const days = getContractDaysRemaining(expiryDateStr);
  if (days < 0) return 'EXPIRED';
  if (days <= 30) return 'CRITICAL_1_MONTH'; // 1 month before expiration alert
  if (days <= 90) return 'APPROACHING_3_MONTHS';
  return 'HEALTHY';
}

export function getUrgencyBadgeConfig(urgency: ContractUrgency, days: number) {
  switch (urgency) {
    case 'EXPIRED':
      return {
        label: `${Math.abs(days)}d Overdue`,
        shortLabel: 'Expired',
        badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50',
        dotClass: 'bg-rose-600',
        textClass: 'text-rose-700 dark:text-rose-400 font-semibold',
        alertLevel: 'danger',
      };
    case 'CRITICAL_1_MONTH':
      return {
        label: days === 0 ? 'Expires Today' : `${days}d left (Action Required)`,
        shortLabel: `${days}d left`,
        badgeClass: 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
        dotClass: 'bg-amber-500',
        textClass: 'text-amber-700 dark:text-amber-400 font-semibold',
        alertLevel: 'warning',
      };
    case 'APPROACHING_3_MONTHS':
      return {
        label: `${days}d left (~${Math.round(days / 30)}mo)`,
        shortLabel: `${days}d left`,
        badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50',
        dotClass: 'bg-sky-500',
        textClass: 'text-sky-700 dark:text-sky-400',
        alertLevel: 'info',
      };
    case 'HEALTHY':
    default:
      const years = (days / 365).toFixed(1);
      return {
        label: days > 365 ? `${years} yrs (${days}d)` : `${days}d left`,
        shortLabel: 'Secure',
        badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40',
        dotClass: 'bg-emerald-500',
        textClass: 'text-slate-600 dark:text-slate-400',
        alertLevel: 'success',
      };
  }
}

export function formatDatePretty(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
