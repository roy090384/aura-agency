import { Language } from '../types/player';

export type WomenLeagueGroup = 'PREMIER' | 'NATIONAL';

export interface WomenClubOption {
  id: string;
  nameEn: string;
  nameHe: string;
  leagueGroup: WomenLeagueGroup;
}

export const ISRAELI_WOMEN_CLUBS: WomenClubOption[] = [
  // Israeli Women's Premier League (ליגת העל לנשים)
  { id: 'wpl-kiryat-gat', nameEn: 'Kiryat Gat', nameHe: 'מ.ס. קריית גת', leagueGroup: 'PREMIER' },
  { id: 'wpl-maccabi-ta', nameEn: 'Maccabi Tel Aviv', nameHe: 'אס"א מכבי תל אביב', leagueGroup: 'PREMIER' },
  { id: 'wpl-hadera', nameEn: 'Maccabi Kishronot Hadera', nameHe: 'מכבי כישרונות חדרה', leagueGroup: 'PREMIER' },
  { id: 'wpl-katamon', nameEn: 'Hapoel Katamon Jerusalem', nameHe: 'הפועל קטמון ירושלים', leagueGroup: 'PREMIER' },
  { id: 'wpl-holon', nameEn: 'Maccabi Holon', nameHe: 'מכבי חולון', leagueGroup: 'PREMIER' },
  { id: 'wpl-ramat-hasharon', nameEn: 'Ramat HaSharon', nameHe: 'מ.כ. רמת השרון', leagueGroup: 'PREMIER' },
  { id: 'wpl-hbs', nameEn: "Hapoel Be'er Sheva", nameHe: 'הפועל באר שבע', leagueGroup: 'PREMIER' },
  { id: 'wpl-netanya', nameEn: 'Bnot Netanya', nameHe: 'בנות נתניה', leagueGroup: 'PREMIER' },

  // Israeli Women's National League (ליגה לאומית לנשים)
  { id: 'wnl-raanana', nameEn: "Hapoel Ra'anana", nameHe: 'הפועל רעננה', leagueGroup: 'NATIONAL' },
  { id: 'wnl-ashdod', nameEn: 'Maccabi Panterot Ashdod', nameHe: 'מכבי פנתרות אשדוד', leagueGroup: 'NATIONAL' },
  { id: 'wnl-hta', nameEn: 'Hapoel Tel Aviv', nameHe: 'הפועל תל אביב', leagueGroup: 'NATIONAL' },
  { id: 'wnl-mbs', nameEn: "Maccabi Be'er Sheva", nameHe: 'מכבי באר שבע', leagueGroup: 'NATIONAL' },
  { id: 'wnl-marmorek', nameEn: 'Hapoel Marmorek', nameHe: 'הפועל מרמורק', leagueGroup: 'NATIONAL' },
  { id: 'wnl-eilat', nameEn: 'Bnot Eilat', nameHe: 'בנות אילת', leagueGroup: 'NATIONAL' },
  { id: 'wnl-tzur-shalom', nameEn: 'Maccabi Tzur Shalom Bialik', nameHe: 'מכבי צור שלום ביאליק', leagueGroup: 'NATIONAL' },
  { id: 'wnl-beitar', nameEn: 'Beitar Jerusalem', nameHe: 'בית"ר ירושלים', leagueGroup: 'NATIONAL' },
  { id: 'wnl-acre', nameEn: 'Hapoel Acre', nameHe: 'הפועל עכו', leagueGroup: 'NATIONAL' },
  { id: 'wnl-bnot-yehuda', nameEn: 'Bnot Yehuda', nameHe: 'בנות יהודה', leagueGroup: 'NATIONAL' }
];

export const PREMIER_LEAGUE_CLUBS = ISRAELI_WOMEN_CLUBS.filter(c => c.leagueGroup === 'PREMIER');
export const NATIONAL_LEAGUE_CLUBS = ISRAELI_WOMEN_CLUBS.filter(c => c.leagueGroup === 'NATIONAL');

export const OTHER_FREE_AGENT_VALUE = 'Other / Free Agent';

export function formatWomenClubValue(club: WomenClubOption, language: Language = 'en'): string {
  return language === 'he' ? `${club.nameHe} (${club.nameEn})` : `${club.nameEn} (${club.nameHe})`;
}

export function findWomenClubByString(value: string): WomenClubOption | undefined {
  const v = value.trim().toLowerCase();
  if (!v) return undefined;
  return ISRAELI_WOMEN_CLUBS.find(
    c =>
      c.nameEn.toLowerCase() === v ||
      c.nameHe.toLowerCase() === v ||
      `${c.nameEn} (${c.nameHe})`.toLowerCase() === v ||
      `${c.nameHe} (${c.nameEn})`.toLowerCase() === v
  );
}

export function getWomenLeagueLabel(group: WomenLeagueGroup, language: Language = 'en'): string {
  if (group === 'PREMIER') {
    return language === 'he' ? 'ליגת העל לנשים' : "Israeli Women's Premier League";
  }
  return language === 'he' ? 'ליגה לאומית לנשים' : "Israeli Women's National League";
}
