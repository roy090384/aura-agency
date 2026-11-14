export type ClubCategory = 1 | 2 | 3 | 4;

export interface IfaClub {
  id: string;
  name: string;
  category: ClubCategory;
  rank?: number;
  isDefault?: boolean;
}

export const IFA_CLUBS_STORAGE_KEY = 'aura_ifa_clubs_db_2026_27_v1';

const CAT_1_NAMES: string[] = [
  'מכבי תל אביב',
  'מכבי חיפה',
  'מכבי פתח-תקווה',
  'הפועל תל אביב',
  'הפועל רעננה',
  'הפועל באר שבע',
  'בית"ר ירושלים',
  'הפועל חדרה ערן',
  'מכבי נתניה',
  'הפועל ראשון לציון',
  'הפועל ירושלים',
  'הפועל פתח תקווה',
  'הפועל רמת גן אסי',
  'הפועל ניר רמת השרון',
  'בני יהודה תל אביב'
];

const CAT_2_NAMES: string[] = [
  'הפועל כפר סבא',
  'מועדון ספורט אשדוד',
  'בני סכנין',
  'הפועל קרית שמונה',
  'מכבי הרצליה',
  'הפועל חיפה',
  'סקציה נס ציונה',
  'שמשון פזטל תל אביב',
  'מכבי באר שבע',
  'בית"ר טוברוק',
  'הפועל עכו',
  'מועדון ספורט באר שבע',
  'מועדון כדורגל נוה יוסף',
  'הפועל הרצליה עירוני',
  'מועדון כדורגל נהלל יזרעאל',
  'מכבי שוהם',
  'מכבי קרית גת',
  'מכבי צור שלום קרית ביאליק',
  'הפועל עליה כפר סבא',
  'מועדון ספורט קרית ים'
];

const CAT_3_NAMES: string[] = [
  'בית"ר נהריה',
  'הפועל הוד השרון עירוני',
  'עירוני מודיעין',
  'הפועל נוף הגליל',
  'הפועל מחנה יהודה',
  'מכבי יבנה',
  'מכבי עירוני קרית אתא',
  'הפועל חוף הכרמל',
  'הכח מכבי עמידר רמת גן',
  'מכבי יפו',
  'מכבי עמק חפר',
  'אגודת ספורט נורדיה ירושלים',
  'הפועל עפולה',
  'מכבי עמישב פתח תקווה',
  'מועדון כדורגל מכבי אשקלון',
  'מכבי עירוני כפר יונה',
  'הפועל קרית אונו',
  'מועדון כדורגל עירוני אור יהודה',
  'בית"ר תל אביב חולון',
  'מועדון ספורט חיפה רובי שפירא',
  'הפועל טירת כרמל',
  'עירוני נשר',
  'בית"ר חיפה יעקב',
  'מועדון ספורט איחוד דרום השרון',
  'גדנ"ע תל אביב יהודה'
];

export const DEFAULT_IFA_CLUBS_2026_27: IfaClub[] = [
  ...CAT_1_NAMES.map((name, idx) => ({
    id: `ifa-c1-${idx + 1}`,
    name,
    category: 1 as ClubCategory,
    rank: idx + 1,
    isDefault: true
  })),
  ...CAT_2_NAMES.map((name, idx) => ({
    id: `ifa-c2-${idx + 1}`,
    name,
    category: 2 as ClubCategory,
    rank: 16 + idx,
    isDefault: true
  })),
  ...CAT_3_NAMES.map((name, idx) => ({
    id: `ifa-c3-${idx + 1}`,
    name,
    category: 3 as ClubCategory,
    rank: 36 + idx,
    isDefault: true
  }))
];

export function loadIfaClubs(): IfaClub[] {
  try {
    const raw = localStorage.getItem(IFA_CLUBS_STORAGE_KEY);
    if (!raw) return DEFAULT_IFA_CLUBS_2026_27;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load IFA clubs from localStorage', e);
  }
  return DEFAULT_IFA_CLUBS_2026_27;
}

export function saveIfaClubs(clubs: IfaClub[]): void {
  try {
    localStorage.setItem(IFA_CLUBS_STORAGE_KEY, JSON.stringify(clubs));
  } catch (e) {
    console.error('Failed to save IFA clubs to localStorage', e);
  }
}

export function resetIfaClubsToDefault(): IfaClub[] {
  try {
    localStorage.removeItem(IFA_CLUBS_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear custom IFA clubs', e);
  }
  return DEFAULT_IFA_CLUBS_2026_27;
}

export function normalizeClubName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function lookupClubCategory(clubName: string, clubs: IfaClub[]): ClubCategory {
  const norm = normalizeClubName(clubName);
  if (!norm) return 4;
  const found = clubs.find(c => normalizeClubName(c.name) === norm);
  return found ? found.category : 4;
}

/**
 * Parse pasted text or CSV lines of format:
 * "Club Name, Category" or "Club Name;Category" or "Club Name\tCategory"
 * Optional rank third column or header row skipped automatically.
 */
export function parseClubsFromCsvOrText(rawText: string): { clubs: IfaClub[]; skippedLines: number } {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const parsed: IfaClub[] = [];
  const seen = new Set<string>();
  let skippedLines = 0;

  for (const line of lines) {
    // Strip optional quotes
    const cleaned = line.replace(/^["']|["']$/g, '').trim();
    const parts = cleaned.split(/[,\t;|]+/).map(p => p.replace(/^["']|["']$/g, '').trim()).filter(Boolean);

    if (parts.length < 2) {
      skippedLines++;
      continue;
    }

    // Check if header line (e.g. "שם קבוצה, קטגוריה" or "Club Name, Category")
    const firstLower = parts[0].toLowerCase();
    if (
      firstLower.includes('שם') ||
      firstLower.includes('קבוצה') && (parts[1].includes('קטגוריה') || parts[1].toLowerCase().includes('category')) ||
      firstLower === 'club' ||
      firstLower === 'club name'
    ) {
      continue;
    }

    // Detect which column holds category 1-4 (support either [name, cat] or [rank, name, cat])
    let name = parts[0];
    let catRaw = parts[1];
    let rankNum: number | undefined;

    if (parts.length >= 3 && /^\d+$/.test(parts[0]) && ['1', '2', '3', '4'].includes(parts[2])) {
      rankNum = Number(parts[0]);
      name = parts[1];
      catRaw = parts[2];
    }

    const catNum = Number(catRaw.replace(/[^\d]/g, ''));
    if (!name || ![1, 2, 3, 4].includes(catNum)) {
      skippedLines++;
      continue;
    }

    const norm = normalizeClubName(name);
    if (seen.has(norm)) continue;
    seen.add(norm);

    parsed.push({
      id: `ifa-custom-${Date.now()}-${parsed.length}`,
      name,
      category: catNum as ClubCategory,
      rank: rankNum ?? parsed.length + 1,
      isDefault: false
    });
  }

  return { clubs: parsed, skippedLines };
}

export function getCategoryLabelHe(cat: ClubCategory): string {
  switch (cat) {
    case 1:
      return 'קטגוריה 1';
    case 2:
      return 'קטגוריה 2';
    case 3:
      return 'קטגוריה 3';
    case 4:
    default:
      return 'קטגוריה 4';
  }
}

export function getCategoryBadgeClasses(cat: ClubCategory): string {
  switch (cat) {
    case 1:
      return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 2:
      return 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800';
    case 3:
      return 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 4:
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
}
