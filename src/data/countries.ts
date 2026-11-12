export interface Country {
  name: string;
  code: string;
  flag: string;
  hebrewName: string;
}

export const COUNTRIES: Country[] = [
  // Common / Home Nations
  { name: 'Israel', code: 'IL', flag: '🇮🇱', hebrewName: 'ישראל' },
  { name: 'England', code: 'GB', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', hebrewName: 'אנגליה' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', hebrewName: 'ספרד' },
  { name: 'United States', code: 'US', flag: '🇺🇸', hebrewName: 'ארצות הברית' },
  { name: 'France', code: 'FR', flag: '🇫🇷', hebrewName: 'צרפת' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', hebrewName: 'גרמניה' },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪', hebrewName: 'שוודיה' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱', hebrewName: 'הולנד' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', hebrewName: 'אוסטרליה' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', hebrewName: 'קנדה' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', hebrewName: 'ברזיל' },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴', hebrewName: 'קולומביה' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', hebrewName: 'יפן' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', hebrewName: 'איטליה' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹', hebrewName: 'פורטוגל' },
  { name: 'Norway', code: 'NO', flag: '🇳🇴', hebrewName: 'נורווגיה' },
  { name: 'Denmark', code: 'DK', flag: '🇩🇰', hebrewName: 'דנמרק' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭', hebrewName: 'שוויץ' },
  { name: 'Austria', code: 'AT', flag: '🇦🇹', hebrewName: 'אוסטריה' },
  { name: 'Belgium', code: 'BE', flag: '🇧🇪', hebrewName: 'בלגיה' },
  { name: 'Scotland', code: 'SCT', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', hebrewName: 'סקוטלנד' },
  { name: 'Wales', code: 'WLS', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', hebrewName: 'ויילס' },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪', hebrewName: 'אירלנד' },
  { name: 'Northern Ireland', code: 'NIR', flag: '🇬🇧', hebrewName: 'צפון אירלנד' },
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬', hebrewName: 'ניגריה' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', hebrewName: 'דרום אפריקה' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭', hebrewName: 'גאנה' },
  { name: 'Morocco', code: 'MA', flag: '🇲🇦', hebrewName: 'מרוקו' },
  { name: 'Zambia', code: 'ZM', flag: '🇿🇲', hebrewName: 'זמביה' },
  { name: 'Argentina', code: 'AR', flag: '🇦🇷', hebrewName: 'ארגנטינה' },
  { name: 'Chile', code: 'CL', flag: '🇨🇱', hebrewName: 'צ׳ילה' },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽', hebrewName: 'מקסיקו' },
  { name: 'Jamaica', code: 'JM', flag: '🇯🇲', hebrewName: 'ג׳מייקה' },
  { name: 'Haiti', code: 'HT', flag: '🇭🇹', hebrewName: 'האיטי' },
  { name: 'Costa Rica', code: 'CR', flag: '🇨🇷', hebrewName: 'קוסטה ריקה' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷', hebrewName: 'דרום קוריאה' },
  { name: 'China', code: 'CN', flag: '🇨🇳', hebrewName: 'סין' },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿', hebrewName: 'ניו זילנד' },
  { name: 'Poland', code: 'PL', flag: '🇵🇱', hebrewName: 'פולין' },
  { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿', hebrewName: 'צ׳כיה' },
  { name: 'Croatia', code: 'HR', flag: '🇭🇷', hebrewName: 'קרואטיה' },
  { name: 'Serbia', code: 'RS', flag: '🇷🇸', hebrewName: 'סרביה' },
  { name: 'Greece', code: 'GR', flag: '🇬🇷', hebrewName: 'יוון' },
  { name: 'Cyprus', code: 'CY', flag: '🇨🇾', hebrewName: 'קפריסין' },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷', hebrewName: 'טורקיה' },
  { name: 'Romania', code: 'RO', flag: '🇷🇴', hebrewName: 'רומניה' },
  { name: 'Hungary', code: 'HU', flag: '🇭🇺', hebrewName: 'הונגריה' },
  { name: 'Finland', code: 'FI', flag: '🇫🇮', hebrewName: 'פינלנד' },
  { name: 'Iceland', code: 'IS', flag: '🇮🇸', hebrewName: 'איסלנד' },
  { name: 'Ukraine', code: 'UA', flag: '🇺🇦', hebrewName: 'אוקראינה' },
  { name: 'Georgia', code: 'GE', flag: '🇬🇪', hebrewName: 'גאורגיה' },
];

export function findCountry(query: string): Country | undefined {
  if (!query) return undefined;
  const lower = query.trim().toLowerCase();
  return COUNTRIES.find(
    c => c.name.toLowerCase() === lower || 
         c.code.toLowerCase() === lower || 
         c.hebrewName === query.trim()
  );
}
