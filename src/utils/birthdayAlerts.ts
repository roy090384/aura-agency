import { Player } from '../types/player';

export interface BirthdayInfo {
  player: Player;
  birthDate: string;
  nextBirthdayDate: Date;
  daysUntil: number;
  upcomingAge: number;
  isToday: boolean;
  isThisWeek: boolean;
  formattedDate: string;
}

/**
 * Calculates accurate current age from birthdate string (YYYY-MM-DD)
 */
export function calculateAgeFromBirthDate(birthDateStr: string): number {
  if (!birthDateStr) return 20;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return 20;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(10, age);
}

/**
 * Calculates birthday countdown and upcoming age for a player
 */
export function getPlayerBirthdayInfo(player: Player): BirthdayInfo | null {
  if (!player.birthDate) return null;

  const birth = new Date(player.birthDate);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();
  const birthMonth = birth.getMonth();
  const birthDay = birth.getDate();

  // Birthday this year
  let nextBday = new Date(currentYear, birthMonth, birthDay);
  nextBday.setHours(0, 0, 0, 0);

  // If already occurred this year, next birthday is next year
  if (nextBday < today) {
    nextBday = new Date(currentYear + 1, birthMonth, birthDay);
  }

  const diffTime = nextBday.getTime() - today.getTime();
  const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const upcomingAge = nextBday.getFullYear() - birth.getFullYear();

  const isToday = daysUntil === 0;
  const isThisWeek = daysUntil > 0 && daysUntil <= 7;

  // Format month and day (e.g., "Nov 20" or "20 בנובמבר")
  const formattedDate = nextBday.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return {
    player,
    birthDate: player.birthDate,
    nextBirthdayDate: nextBday,
    daysUntil,
    upcomingAge,
    isToday,
    isThisWeek,
    formattedDate
  };
}

/**
 * Returns players sorted by closest upcoming birthday within threshold (default 30 days)
 */
export function getUpcomingBirthdays(players: Player[], thresholdDays: number = 30): BirthdayInfo[] {
  const list: BirthdayInfo[] = [];

  for (const p of players) {
    const info = getPlayerBirthdayInfo(p);
    if (info && info.daysUntil <= thresholdDays) {
      list.push(info);
    }
  }

  return list.sort((a, b) => a.daysUntil - b.daysUntil);
}
