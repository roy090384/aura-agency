export interface ClubVisualTheme {
  primary: string;
  secondary: string;
  text: string;
  monogram: string;
}

const CLUB_COLOR_RULES: Array<{
  pattern: RegExp;
  primary: string;
  secondary: string;
  text: string;
}> = [
  // Maccabi Haifa (Green & White)
  { pattern: /מכבי חיפה|מ\.?\s*חיפה|maccabi haifa/i, primary: '#047857', secondary: '#FFFFFF', text: '#FFFFFF' },
  // Maccabi Tel Aviv (Yellow & Royal Blue)
  { pattern: /מכבי ת["'״׳]?א|מכבי תל אביב|maccabi tel aviv/i, primary: '#1D4ED8', secondary: '#FACC15', text: '#FEF08A' },
  // Beitar Jerusalem / Maccabi Netanya / Kiryat Ata (Black & Gold/Yellow)
  { pattern: /בית["'״׳]?ר י|בית["'״׳]?ר|beitar/i, primary: '#18181B', secondary: '#FACC15', text: '#FDE047' },
  { pattern: /מכבי נתניה|netanya/i, primary: '#FACC15', secondary: '#18181B', text: '#18181B' },
  // Bnei Yehuda (Orange & Black)
  { pattern: /בני יהודה|bnei yehuda/i, primary: '#EA580C', secondary: '#18181B', text: '#FFFFFF' },
  // Maccabi Petah Tikva / Hapoel Petah Tikva (Royal / Sky Blue)
  { pattern: /מכבי פ["'״׳]?ת|מכבי פתח|maccabi petah/i, primary: '#1E40AF', secondary: '#FFFFFF', text: '#FFFFFF' },
  { pattern: /הפועל פ["'״׳]?ת|הפועל פתח|הפ['"״׳]?\s*פ["'״׳]?ת|hapoel petah/i, primary: '#0284C7', secondary: '#FFFFFF', text: '#FFFFFF' },
  // Hapoel Rishon LeZion (Orange-Red)
  { pattern: /ראשל["'״׳]?צ|ראשון לציון|rishon/i, primary: '#EA580C', secondary: '#FFFFFF', text: '#FFFFFF' },
  // Hapoel Kfar Saba (Green & White)
  { pattern: /הפועל\s*כפ["'״׳]?ס|הפ['"״׳]?\s*כפ["'״׳]?ס|כפר סבא|kfar saba/i, primary: '#15803D', secondary: '#FFFFFF', text: '#FFFFFF' },
  // Hapoel Ra'anana (Red & Black)
  { pattern: /רעננה|ra.?anana/i, primary: '#B91C1C', secondary: '#18181B', text: '#FFFFFF' },
  // FC Ashdod (Red & Gold)
  { pattern: /אשדוד|ashdod/i, primary: '#DC2626', secondary: '#FACC15', text: '#FEF08A' },
  // Hapoel clubs (Crimson Red & White: Tel Aviv, Be'er Sheva, Haifa, Jerusalem, Hadera, Acre, Nof HaGalil, Afula, Ramat Gan, Ramat HaSharon, Kiryat Shmona)
  { pattern: /הפועל|הפ['"״׳]\s|hapoel/i, primary: '#DC2626', secondary: '#FFFFFF', text: '#FFFFFF' },
  // Bnei Sakhnin (Crimson & White)
  { pattern: /סכנין|sakhnin/i, primary: '#BE123C', secondary: '#FFFFFF', text: '#FFFFFF' },
  // Maccabi Herzliya / Maccabi Yavne / Maccabi Jaffa / Maccabi clubs (Blue/Navy & White)
  { pattern: /מכבי|מ\.?\s*הרצליה|maccabi/i, primary: '#2563EB', secondary: '#FFFFFF', text: '#FFFFFF' },
  // Ironi clubs (Indigo & White)
  { pattern: /עירוני|ironi|מודיעין|טבריה/i, primary: '#4338CA', secondary: '#FFFFFF', text: '#FFFFFF' },
  // Shimshon / Hakoah / Sektzia (Purple / Violet / Navy)
  { pattern: /שמשון|הכח|סקציה|נס ציונה/i, primary: '#6D28D9', secondary: '#FFFFFF', text: '#FFFFFF' },
];

const FALLBACK_PALETTES: Array<{ primary: string; secondary: string; text: string }> = [
  { primary: '#0F766E', secondary: '#CCFBF1', text: '#FFFFFF' },
  { primary: '#1E3A8A', secondary: '#DBEAFE', text: '#FFFFFF' },
  { primary: '#9F1239', secondary: '#FFE4E6', text: '#FFFFFF' },
  { primary: '#B45309', secondary: '#FEF3C7', text: '#FFFFFF' },
  { primary: '#334155', secondary: '#E2E8F0', text: '#FFFFFF' },
  { primary: '#4F46E5', secondary: '#E0E7FF', text: '#FFFFFF' },
];

export function getClubMonogram(teamName: string): string {
  const cleaned = (teamName || '')
    .replace(/["'״׳().]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'FC';

  const stopWords = new Set(['מועדון', 'ספורט', 'מס', 'מכ', 'fc', 'sc']);
  const words = cleaned
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()));

  if (words.length >= 2) {
    // Prefer meaningful pair e.g. "הפ ירושלים" -> "הי", "מכבי חיפה" -> "מח"
    const first = words[0] === 'הפ' ? 'ה' : words[0][0];
    const second = words[1][0];
    return `${first}${second}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function getClubVisualTheme(teamName: string): ClubVisualTheme {
  const monogram = getClubMonogram(teamName);

  for (const rule of CLUB_COLOR_RULES) {
    if (rule.pattern.test(teamName)) {
      return {
        primary: rule.primary,
        secondary: rule.secondary,
        text: rule.text,
        monogram,
      };
    }
  }

  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = (hash * 31 + teamName.charCodeAt(i)) >>> 0;
  }
  const palette = FALLBACK_PALETTES[hash % FALLBACK_PALETTES.length];
  return {
    ...palette,
    monogram,
  };
}
