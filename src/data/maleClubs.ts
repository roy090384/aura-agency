import { Language } from '../types/player';

export type MaleYouthLeagueGroup = 'PREMIER' | 'NATIONAL' | 'CUSTOM';

export interface MaleClubOption {
  id: string;
  nameEn: string;
  nameHe: string;
  leagueGroup: MaleYouthLeagueGroup;
}

export const CUSTOM_MALE_CLUBS_STORAGE_KEY = 'aura_custom_male_clubs_v1';

export const ISRAELI_MALE_YOUTH_CLUBS: MaleClubOption[] = [
  // Israeli Premier League Youth Departments (מחלקות נוער - ליגת העל)
  { id: 'mpl-maccabi-ta', nameEn: 'Maccabi Tel Aviv', nameHe: 'מכבי תל אביב', leagueGroup: 'PREMIER' },
  { id: 'mpl-maccabi-haifa', nameEn: 'Maccabi Haifa', nameHe: 'מכבי חיפה', leagueGroup: 'PREMIER' },
  { id: 'mpl-hapoel-ta', nameEn: 'Hapoel Tel Aviv', nameHe: 'הפועל תל אביב', leagueGroup: 'PREMIER' },
  { id: 'mpl-beitar', nameEn: 'Beitar Jerusalem', nameHe: 'בית"ר ירושלים', leagueGroup: 'PREMIER' },
  { id: 'mpl-maccabi-pt', nameEn: 'Maccabi Petah Tikva', nameHe: 'מכבי פתח תקווה', leagueGroup: 'PREMIER' },
  { id: 'mpl-ashdod', nameEn: 'FC Ashdod', nameHe: 'מ.ס. אשדוד', leagueGroup: 'PREMIER' },
  { id: 'mpl-hbs', nameEn: "Hapoel Be'er Sheva", nameHe: 'הפועל באר שבע', leagueGroup: 'PREMIER' },
  { id: 'mpl-netanya', nameEn: 'Maccabi Netanya', nameHe: 'מכבי נתניה', leagueGroup: 'PREMIER' },
  { id: 'mpl-hapoel-haifa', nameEn: 'Hapoel Haifa', nameHe: 'הפועל חיפה', leagueGroup: 'PREMIER' },
  { id: 'mpl-hapoel-jerusalem', nameEn: 'Hapoel Jerusalem', nameHe: 'הפועל ירושלים', leagueGroup: 'PREMIER' },
  { id: 'mpl-hapoel-pt', nameEn: 'Hapoel Petah Tikva', nameHe: 'הפועל פתח תקווה', leagueGroup: 'PREMIER' },
  { id: 'mpl-sakhnin', nameEn: 'Bnei Sakhnin', nameHe: 'בני סכנין', leagueGroup: 'PREMIER' },
  { id: 'mpl-kiryat-shmona', nameEn: 'Hapoel Kiryat Shmona', nameHe: 'הפועל קריית שמונה', leagueGroup: 'PREMIER' },
  { id: 'mpl-hadera', nameEn: 'Hapoel Hadera', nameHe: 'הפועל חדרה', leagueGroup: 'PREMIER' },
  { id: 'mpl-raanana', nameEn: "Hapoel Ra'anana", nameHe: 'הפועל רעננה', leagueGroup: 'PREMIER' },
  { id: 'mpl-bnei-yehuda', nameEn: 'Bnei Yehuda Tel Aviv', nameHe: 'בני יהודה תל אביב', leagueGroup: 'PREMIER' },

  // Israeli National League Youth Departments (מחלקות נוער - ליגה לאומית)
  { id: 'mnl-kfar-saba', nameEn: 'Hapoel Kfar Saba', nameHe: 'הפועל כפר סבא', leagueGroup: 'NATIONAL' },
  { id: 'mnl-rishon', nameEn: 'Hapoel Rishon LeZion', nameHe: 'הפועל ראשון לציון', leagueGroup: 'NATIONAL' },
  { id: 'mnl-ramat-gan', nameEn: 'Hapoel Ramat Gan', nameHe: 'הפועל רמת גן', leagueGroup: 'NATIONAL' },
  { id: 'mnl-ramat-hasharon', nameEn: 'Hapoel Nir Ramat HaSharon', nameHe: 'הפועל ניר רמת השרון', leagueGroup: 'NATIONAL' },
  { id: 'mnl-herzliya', nameEn: 'Maccabi Herzliya', nameHe: 'מכבי הרצליה', leagueGroup: 'NATIONAL' },
  { id: 'mnl-tubruk', nameEn: 'Beitar Nes Tubruk', nameHe: 'בית"ר טוברוק', leagueGroup: 'NATIONAL' },
  { id: 'mnl-acre', nameEn: 'Hapoel Acre', nameHe: 'הפועל עכו', leagueGroup: 'NATIONAL' },
  { id: 'mnl-nof-hagalil', nameEn: 'Hapoel Nof HaGalil', nameHe: 'הפועל נוף הגליל', leagueGroup: 'NATIONAL' },
  { id: 'mnl-modiin', nameEn: "Ironi Modi'in", nameHe: 'עירוני מודיעין', leagueGroup: 'NATIONAL' },
  { id: 'mnl-afula', nameEn: 'Hapoel Afula', nameHe: 'הפועל עפולה', leagueGroup: 'NATIONAL' },
  { id: 'mnl-nes-tziona', nameEn: 'Sektzia Nes Tziona', nameHe: 'סקציה נס ציונה', leagueGroup: 'NATIONAL' },
  { id: 'mnl-yavne', nameEn: 'Maccabi Yavne', nameHe: 'מכבי יבנה', leagueGroup: 'NATIONAL' },
  { id: 'mnl-kiryat-ata', nameEn: 'Maccabi Ironi Kiryat Ata', nameHe: 'מכבי עירוני קריית אתא', leagueGroup: 'NATIONAL' },
  { id: 'mnl-jaffa', nameEn: 'Maccabi Kabilio Jaffa', nameHe: 'מכבי יפו', leagueGroup: 'NATIONAL' },
  { id: 'mnl-umm-al-fahm', nameEn: 'Hapoel Umm al-Fahm', nameHe: 'הפועל אום אל-פחם', leagueGroup: 'NATIONAL' },
  { id: 'mnl-kiryat-yam', nameEn: 'MS Kiryat Yam', nameHe: 'מ.ס. קריית ים', leagueGroup: 'NATIONAL' },
  { id: 'mnl-shimshon-ta', nameEn: 'Shimshon Tel Aviv', nameHe: 'שמשון תל אביב', leagueGroup: 'NATIONAL' }
];

export const MALE_PREMIER_CLUBS = ISRAELI_MALE_YOUTH_CLUBS.filter(c => c.leagueGroup === 'PREMIER');
export const MALE_NATIONAL_CLUBS = ISRAELI_MALE_YOUTH_CLUBS.filter(c => c.leagueGroup === 'NATIONAL');

export const MALE_OTHER_FREE_AGENT_VALUE = 'Other / Free Agent';

export function loadCustomMaleClubs(): MaleClubOption[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MALE_CLUBS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(c => c && typeof c.nameEn === 'string' && c.nameEn.trim().length > 0);
    }
  } catch (e) {
    console.error('Failed to load custom male clubs', e);
  }
  return [];
}

export function saveCustomMaleClub(name: string): MaleClubOption[] {
  const trimmed = name.trim();
  const existing = loadCustomMaleClubs();
  if (!trimmed) return existing;

  const dup = existing.find(
    c => c.nameEn.toLowerCase() === trimmed.toLowerCase() || c.nameHe.toLowerCase() === trimmed.toLowerCase()
  );
  if (dup) return existing;

  const newClub: MaleClubOption = {
    id: `custom-male-${Date.now()}`,
    nameEn: trimmed,
    nameHe: trimmed,
    leagueGroup: 'CUSTOM'
  };
  const updated = [newClub, ...existing];
  try {
    localStorage.setItem(CUSTOM_MALE_CLUBS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom male club', e);
  }
  return updated;
}

export function removeCustomMaleClub(id: string): MaleClubOption[] {
  const existing = loadCustomMaleClubs().filter(c => c.id !== id);
  try {
    localStorage.setItem(CUSTOM_MALE_CLUBS_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to remove custom male club', e);
  }
  return existing;
}

export function formatMaleClubValue(club: MaleClubOption, language: Language = 'en'): string {
  if (club.nameEn === club.nameHe) return club.nameEn;
  return language === 'he' ? `${club.nameHe} (${club.nameEn})` : `${club.nameEn} (${club.nameHe})`;
}

export function findMaleClubByString(value: string, customClubs: MaleClubOption[] = loadCustomMaleClubs()): MaleClubOption | undefined {
  const v = value.trim().toLowerCase();
  if (!v) return undefined;
  const all = [...ISRAELI_MALE_YOUTH_CLUBS, ...customClubs];
  return all.find(
    c =>
      c.nameEn.toLowerCase() === v ||
      c.nameHe.toLowerCase() === v ||
      `${c.nameEn} (${c.nameHe})`.toLowerCase() === v ||
      `${c.nameHe} (${c.nameEn})`.toLowerCase() === v
  );
}

export function getMaleLeagueLabel(group: MaleYouthLeagueGroup, language: Language = 'en'): string {
  if (group === 'PREMIER') {
    return language === 'he' ? 'ליגת העל לנוער' : 'Israeli Youth Premier League';
  }
  if (group === 'NATIONAL') {
    return language === 'he' ? 'ליגה לאומית לנוער' : 'Israeli Youth National League';
  }
  return '';
}
