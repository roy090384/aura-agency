import { ClubCategory, getCategoryLabelHe } from '../data/ifaClubs';

export type TrainingAgeMale = 12 | 13 | 14 | 15 | 16 | 17;

export const MALE_TRAINING_AGES: TrainingAgeMale[] = [12, 13, 14, 15, 16, 17];

/**
 * Second Addendum (תוספת שנייה - תקנון מעמד והעברות של שחקנים קטינים)
 * Annual Tariffs in ILS (₪) by Category (1-4) and Calendar Age (12-17)
 */
export const MALE_ANNUAL_TARIFFS: Record<ClubCategory, Record<TrainingAgeMale, number>> = {
  1: { 12: 9375, 13: 9375, 14: 28125, 15: 37500, 16: 46875, 17: 56250 },
  2: { 12: 5364, 13: 5364, 14: 16903, 15: 22538, 16: 28173, 17: 33807 },
  3: { 12: 2634, 13: 2634, 14: 7903, 15: 10538, 16: 13173, 17: 15807 },
  4: { 12: 1527, 13: 1527, 14: 4583, 15: 6111, 16: 7638, 17: 9166 }
};

export interface LoanPeriod {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface MaleYearOverride {
  age: TrainingAgeMale;
  manualDays: number;
  membershipFee: number;
}

export interface MaleCalculationInput {
  transferringClubName: string;
  transferringCategory: ClubCategory;
  receivingClubName: string;
  receivingCategory: ClubCategory;
  ageInputMode: 'dob' | 'exact_age';
  birthDate: string; // YYYY-MM-DD
  exactAgeAtTransfer: number;
  transferDate: string; // YYYY-MM-DD
  // Article 19 eligibility checks
  twoConsecutiveSeasons: boolean;
  playedAtLeast25PctMinutes: boolean;
  cancelledOrWaivedInWriting: boolean;
  // Training periods
  periodInputMode: 'dates' | 'manual_days';
  registrationStartDate: string; // YYYY-MM-DD
  registrationEndDate: string;   // YYYY-MM-DD (typically transferDate)
  loanPeriods: LoanPeriod[];
  yearData: Record<TrainingAgeMale, { manualDays: number; membershipFee: number }>;
}

export interface MaleBreakdownRow {
  trainingAge: TrainingAgeMale;
  calendarYear: number;
  governingCategory: ClubCategory;
  annualTariff: number;
  daysInClub: number;
  effectiveRatioDays: number;
  grossAmount: number;
  membershipFeeDeduction: number;
  netAmount: number;
}

export interface MaleCalculationResult {
  isEligible: boolean;
  disqualificationReasons: string[];
  ageAtTransfer: number | null;
  governingCategory: ClubCategory;
  rows: MaleBreakdownRow[];
  totalGrossBeforeFees: number;
  totalMembershipFees: number;
  finalCompensation: number;
}

// ---------- Date Helpers (UTC-safe calendar day arithmetic) ----------

export function parseUtcDate(dateStr: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

export function calculateExactAge(birthDateStr: string, targetDateStr: string): number | null {
  const birth = parseUtcDate(birthDateStr);
  const target = parseUtcDate(targetDateStr);
  if (!birth || !target) return null;

  let age = target.getUTCFullYear() - birth.getUTCFullYear();
  const mDiff = target.getUTCMonth() - birth.getUTCMonth();
  if (mDiff < 0 || (mDiff === 0 && target.getUTCDate() < birth.getUTCDate())) {
    age--;
  }
  return age;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Counts inclusive days of intersection between [aStart, aEnd] and [bStart, bEnd]
 */
function countInclusiveOverlapDays(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): number {
  const start = aStart.getTime() > bStart.getTime() ? aStart : bStart;
  const end = aEnd.getTime() < bEnd.getTime() ? aEnd : bEnd;
  if (end.getTime() < start.getTime()) return 0;
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

/**
 * Computes exact calendar days registered in the transferring club during a given calendarYear,
 * excluding any loan periods (also intersected cleanly so overlapping loans aren't double-counted).
 */
export function computeCalendarDaysInYear(
  calendarYear: number,
  regStartStr: string,
  regEndStr: string,
  transferDateStr: string,
  loanPeriods: LoanPeriod[]
): number {
  const regStart = parseUtcDate(regStartStr);
  const regEndRaw = parseUtcDate(regEndStr);
  const transferDt = parseUtcDate(transferDateStr);
  if (!regStart || !regEndRaw) return 0;

  // Cap registration end by transferDate if transferDate is valid and earlier
  const regEnd =
    transferDt && transferDt.getTime() < regEndRaw.getTime() ? transferDt : regEndRaw;

  if (regEnd.getTime() < regStart.getTime()) return 0;

  const yearStart = new Date(Date.UTC(calendarYear, 0, 1));
  const yearEnd = new Date(Date.UTC(calendarYear, 11, 31));

  // Total overlap with the calendar year
  const activeStart = regStart.getTime() > yearStart.getTime() ? regStart : yearStart;
  const activeEnd = regEnd.getTime() < yearEnd.getTime() ? regEnd : yearEnd;

  if (activeEnd.getTime() < activeStart.getTime()) return 0;

  const totalRegDays = Math.floor((activeEnd.getTime() - activeStart.getTime()) / MS_PER_DAY) + 1;

  // Subtract loan days within [activeStart, activeEnd] (merge overlapping loan intervals first)
  const validLoans = loanPeriods
    .map(lp => {
      const ls = parseUtcDate(lp.startDate);
      const le = parseUtcDate(lp.endDate);
      if (!ls || !le || le.getTime() < ls.getTime()) return null;
      const clampedStart = ls.getTime() > activeStart.getTime() ? ls : activeStart;
      const clampedEnd = le.getTime() < activeEnd.getTime() ? le : activeEnd;
      if (clampedEnd.getTime() < clampedStart.getTime()) return null;
      return { start: clampedStart.getTime(), end: clampedEnd.getTime() };
    })
    .filter((x): x is { start: number; end: number } => x !== null)
    .sort((a, b) => a.start - b.start);

  const mergedLoans: { start: number; end: number }[] = [];
  for (const interval of validLoans) {
    if (mergedLoans.length === 0) {
      mergedLoans.push({ ...interval });
    } else {
      const last = mergedLoans[mergedLoans.length - 1];
      if (interval.start <= last.end + MS_PER_DAY) {
        last.end = Math.max(last.end, interval.end);
      } else {
        mergedLoans.push({ ...interval });
      }
    }
  }

  let loanDays = 0;
  for (const m of mergedLoans) {
    loanDays += Math.floor((m.end - m.start) / MS_PER_DAY) + 1;
  }

  return Math.max(0, totalRegDays - loanDays);
}

export function calculateMaleTrainingCompensation(
  input: MaleCalculationInput
): MaleCalculationResult {
  const transferDt = parseUtcDate(input.transferDate);
  const transferYear = transferDt ? transferDt.getUTCFullYear() : new Date().getUTCFullYear();

  const ageAtTransfer =
    input.ageInputMode === 'dob'
      ? calculateExactAge(input.birthDate, input.transferDate)
      : Number.isFinite(input.exactAgeAtTransfer)
      ? Math.floor(input.exactAgeAtTransfer)
      : null;

  const birthDt = parseUtcDate(input.birthDate);
  const birthYear =
    input.ageInputMode === 'dob' && birthDt
      ? birthDt.getUTCFullYear()
      : transferYear - Math.max(0, ageAtTransfer ?? 0);

  // Article 30(a)(2): Lower category between transferring & receiving club
  // Category 1 = highest, Category 4 = lowest -> Math.max gives the lower category
  const governingCategory = Math.max(
    input.transferringCategory,
    input.receivingCategory
  ) as ClubCategory;

  const disqualificationReasons: string[] = [];

  if (ageAtTransfer !== null && ageAtTransfer < 12) {
    disqualificationReasons.push(
      'סעיף 19(א): השחקן מתחת לגיל 12 במועד ההעברה — אין זכאות לדמי השבחה (0 ₪).'
    );
  }
  if (input.receivingCategory === 4) {
    disqualificationReasons.push(
      'סעיף 19(ה): הקבוצה הקולטת מדורגת בקטגוריה 4 — פטור מלא מתשלום דמי השבחה (0 ₪).'
    );
  }
  if (!input.twoConsecutiveSeasons) {
    disqualificationReasons.push(
      'סעיף 19: השחקן לא היה רשום בקבוצה המעבירה לפחות שתי עונות משחק רצופות (לא כולל השאלות).'
    );
  }
  if (!input.playedAtLeast25PctMinutes) {
    disqualificationReasons.push(
      'סעיף 19: השחקן לא שותף בלפחות 25% מסך הדקות ב-30 משחקי הליגה האחרונים של הקבוצה המעבירה.'
    );
  }
  if (input.cancelledOrWaivedInWriting) {
    disqualificationReasons.push(
      'סעיף 19: הקבוצה המעבירה ביטלה / לא חידשה את רישום השחקן או ויתרה על הפיצוי בכתב.'
    );
  }

  const isEligible = disqualificationReasons.length === 0;

  const rows: MaleBreakdownRow[] = MALE_TRAINING_AGES.map(trainingAge => {
    const calendarYear = birthYear + trainingAge;
    const annualTariff = MALE_ANNUAL_TARIFFS[governingCategory][trainingAge];
    const yearEntry = input.yearData[trainingAge] || { manualDays: 0, membershipFee: 0 };

    const rawDays =
      input.periodInputMode === 'dates'
        ? computeCalendarDaysInYear(
            calendarYear,
            input.registrationStartDate,
            input.registrationEndDate,
            input.transferDate,
            input.loanPeriods
          )
        : Math.max(0, Math.min(366, Math.floor(Number(yearEntry.manualDays) || 0)));

    // Cap pro-rata denominator ratio at 365 days (100% of annual tariff for a full year, even in leap years)
    const effectiveRatioDays = Math.min(rawDays, 365);
    const grossAmount = isEligible
      ? Math.round((effectiveRatioDays / 365) * annualTariff)
      : 0;

    const membershipFeeDeduction = isEligible
      ? Math.max(0, Math.round(Number(yearEntry.membershipFee) || 0))
      : 0;

    const netAmount = isEligible
      ? Math.max(0, grossAmount - membershipFeeDeduction)
      : 0;

    return {
      trainingAge,
      calendarYear,
      governingCategory,
      annualTariff,
      daysInClub: rawDays,
      effectiveRatioDays,
      grossAmount,
      membershipFeeDeduction,
      netAmount
    };
  });

  const totalGrossBeforeFees = rows.reduce((sum, r) => sum + r.grossAmount, 0);
  const totalMembershipFees = rows.reduce((sum, r) => sum + r.membershipFeeDeduction, 0);
  const finalCompensation = isEligible
    ? rows.reduce((sum, r) => sum + r.netAmount, 0)
    : 0;

  return {
    isEligible,
    disqualificationReasons,
    ageAtTransfer,
    governingCategory,
    rows,
    totalGrossBeforeFees,
    totalMembershipFees,
    finalCompensation
  };
}

export function formatIls(amount: number): string {
  return `${new Intl.NumberFormat('he-IL').format(Math.round(amount))} ₪`;
}

export function buildMaleSummaryText(
  input: MaleCalculationInput,
  result: MaleCalculationResult
): string {
  const lines: string[] = [];
  lines.push('=== סיכום חישוב דמי השבחה (בנים - קטינים) ===');
  lines.push(`קבוצה מעבירה: ${input.transferringClubName || 'לא צוינה'} (${getCategoryLabelHe(input.transferringCategory)})`);
  lines.push(`קבוצה קולטת: ${input.receivingClubName || 'לא צוינה'} (${getCategoryLabelHe(input.receivingCategory)})`);
  lines.push(`קטגוריה קובעת (הנמוכה מבין השתיים - סעיף 30(א)(2)): ${getCategoryLabelHe(result.governingCategory)}`);
  lines.push(`גיל במועד ההעברה: ${result.ageAtTransfer ?? 'לא ידוע'} | תאריך העברה: ${input.transferDate}`);
  lines.push('');

  if (!result.isEligible) {
    lines.push(`סטטוס זכאות: לא זכאי לדמי השבחה (0 ₪)`);
    result.disqualificationReasons.forEach(r => lines.push(`• ${r}`));
  } else {
    lines.push('פירוט לפי שנות אימון קלנדריות:');
    result.rows.forEach(r => {
      if (r.daysInClub > 0 || r.netAmount > 0 || r.membershipFeeDeduction > 0) {
        lines.push(
          `• שנת ${r.calendarYear} (גיל ${r.trainingAge}): ${r.daysInClub} ימים | תעריף ${formatIls(r.annualTariff)} | ברוטו ${formatIls(r.grossAmount)} | ניכוי דמי חבר ${formatIls(r.membershipFeeDeduction)} | נטו ${formatIls(r.netAmount)}`
        );
      }
    });
    lines.push('');
    lines.push(`סה"כ ברוטו לפני ניכוי דמי חבר: ${formatIls(result.totalGrossBeforeFees)}`);
    lines.push(`סה"כ ניכוי דמי חבר (סעיף 30(ג)): ${formatIls(result.totalMembershipFees)}`);
  }

  lines.push('');
  lines.push(`סכום פיצוי סופי לתשלום: ${formatIls(result.finalCompensation)}`);
  return lines.join('\n');
}

// =====================================================================
// TRACK 2: FEMALE (חישוב לבנות - תקנון מעמד והעברות שחקניות כדורגל)
// =====================================================================

export type WomenLeagueTier = 'TOP' | 'SECOND' | 'THIRD_FOURTH';
export type FemaleAgeBracket = '12-15' | '15-17' | '18-28' | '28+';
export type FemaleParticipationTier = 'UNDER_20' | 'BETWEEN_20_50' | 'OVER_50';
export type FemaleNationalTeamTier =
  | 'NONE'
  | 'SENIOR_10_RECENT'
  | 'SENIOR_14_CAREER'
  | 'YOUTH_4_RECENT';

export const WOMEN_LEAGUE_LABELS: Record<WomenLeagueTier, string> = {
  TOP: 'ליגת הנשים הבכירה',
  SECOND: 'ליגת הנשים השנייה',
  THIRD_FOURTH: 'ליגת הנשים השלישית או הרביעית'
};

export const FEMALE_PARTICIPATION_LABELS: Record<FemaleParticipationTier, string> = {
  UNDER_20: 'פחות מ-20%',
  BETWEEN_20_50: '20% עד 50%',
  OVER_50: 'למעלה מ-50%'
};

export const FEMALE_NATIONAL_TEAM_OPTIONS: {
  value: FemaleNationalTeamTier;
  label: string;
  bonusPct: number;
}[] = [
  { value: 'NONE', label: 'ללא תוספת נבחרת (0%)', bonusPct: 0 },
  {
    value: 'SENIOR_10_RECENT',
    label: 'לפחות 10 משחקי נבחרת בוגרת רשמיים בשנתיים שקדמו להעברה (+20%)',
    bonusPct: 20
  },
  {
    value: 'SENIOR_14_CAREER',
    label: 'לפחות 14 משחקי נבחרת בוגרת רשמיים לאורך כל הקריירה (+10%)',
    bonusPct: 10
  },
  {
    value: 'YOUTH_4_RECENT',
    label: 'לפחות 4 משחקי נבחרת צעירה/נערות רשמיים בשנתיים שקדמו להעברה (+10%)',
    bonusPct: 10
  }
];

/**
 * First Addendum Section 1 (תוספת ראשונה סעיף 1)
 * Base annual amounts in ILS (₪) for seasons > 5 months
 */
export const FEMALE_SEASON_TARIFFS: Record<
  FemaleAgeBracket,
  Record<FemaleParticipationTier, number>
> = {
  '12-15': { UNDER_20: 0, BETWEEN_20_50: 1500, OVER_50: 3000 },
  '15-17': { UNDER_20: 0, BETWEEN_20_50: 2500, OVER_50: 5000 },
  '18-28': { UNDER_20: 0, BETWEEN_20_50: 3000, OVER_50: 6000 },
  '28+': { UNDER_20: 0, BETWEEN_20_50: 2000, OVER_50: 4000 }
};

export const FEMALE_OVER_24_MULTIPLIER: Record<WomenLeagueTier, number> = {
  TOP: 1.0,
  SECOND: 0.5,
  THIRD_FOURTH: 0.25
};

export interface FemaleTrainingSeason {
  id: string;
  seasonLabel: string; // e.g., "2024/25"
  ageBracket: FemaleAgeBracket;
  overFiveMonths: boolean;
  participationTier: FemaleParticipationTier;
}

export interface FemaleCalculationInput {
  ageInputMode: 'dob' | 'exact_age';
  birthDate: string;
  transferDate: string;
  exactAgeAtTransfer: number;
  receivingLeagueTier: WomenLeagueTier;
  // Articles 22 & 23 checks
  twoConsecutiveSeasons: boolean;
  minimumMinutesMet: boolean;
  isFinishingWrittenContract: boolean;
  article22eAge24FirstTransfer: boolean;
  // Training seasons
  seasons: FemaleTrainingSeason[];
  // Bonuses & CPI
  isAcademySquad: boolean;
  nationalTeamTier: FemaleNationalTeamTier;
  cpiAdjustmentPct: number;
}

export interface FemaleBreakdownRow extends FemaleTrainingSeason {
  baseTariff: number;
  seasonSubtotal: number;
}

export interface FemaleCalculationResult {
  isEligible: boolean;
  disqualificationReasons: string[];
  ageAtTransfer: number | null;
  rows: FemaleBreakdownRow[];
  sumOfSeasonBaseAmounts: number;
  ageOver24Multiplier: number;
  afterAge24Multiplier: number;
  nationalTeamBonusPct: number;
  nationalTeamBonusAmount: number;
  academyBonusAmount: number;
  subtotalBeforeCpi: number;
  cpiAdjustmentPct: number;
  cpiAdjustmentAmount: number;
  finalCompensation: number;
}

export function calculateFemaleTrainingCompensation(
  input: FemaleCalculationInput
): FemaleCalculationResult {
  const ageAtTransfer =
    input.ageInputMode === 'dob'
      ? calculateExactAge(input.birthDate, input.transferDate)
      : Number.isFinite(input.exactAgeAtTransfer)
      ? Math.floor(input.exactAgeAtTransfer)
      : null;

  const disqualificationReasons: string[] = [];

  if (ageAtTransfer !== null && ageAtTransfer < 12) {
    disqualificationReasons.push(
      'סעיף 23(א): השחקנית מתחת לגיל 12 במועד ההעברה — אין זכאות לדמי השבחה (0 ₪).'
    );
  }
  if (
    ageAtTransfer !== null &&
    ageAtTransfer >= 30 &&
    input.receivingLeagueTier !== 'TOP'
  ) {
    disqualificationReasons.push(
      'סעיף 23(ב): שחקנית בת 30 ומעלה העוברת לקבוצה שאינה בליגת הנשים הבכירה פטורה מדמי השבחה (0 ₪).'
    );
  }
  if (!input.twoConsecutiveSeasons) {
    disqualificationReasons.push(
      'סעיף 23(ג): השחקנית לא הייתה רשומה בקבוצה המעבירה לפחות שתי עונות משחק רצופות.'
    );
  }
  if (!input.minimumMinutesMet) {
    const minutesRule =
      ageAtTransfer !== null && ageAtTransfer < 17
        ? 'לפחות 25% מדקות המשחק ב-30 המשחקים הרשמיים האחרונים (סעיף 23(ד))'
        : 'לפחות 20% מדקות המשחק בשתי העונות הרצופות שקדמו להעברה (סעיף 23(ה))';
    disqualificationReasons.push(
      `סעיף 23(ד)-(ה): השחקנית לא עמדה ברף דקות המשחק המינימלי הנדרש (${minutesRule}).`
    );
  }
  if (
    ageAtTransfer !== null &&
    ageAtTransfer >= 17 &&
    !input.isFinishingWrittenContract &&
    (!input.article22eAge24FirstTransfer || ageAtTransfer < 24)
  ) {
    disqualificationReasons.push(
      'סעיף 22(ה): שחקנית מגיל 17 ומעלה שאינה מסיימת חוזה כתוב מזכה בדמי השבחה רק אם היא בת 24 לפחות ועוברת לראשונה מהמועדון שבו שיחקה במרבית שנותיה.'
    );
  }

  const isEligible = disqualificationReasons.length === 0;

  const rows: FemaleBreakdownRow[] = input.seasons.map(season => {
    const baseTariff = FEMALE_SEASON_TARIFFS[season.ageBracket][season.participationTier];
    const seasonSubtotal =
      isEligible && season.overFiveMonths ? baseTariff : 0;
    return {
      ...season,
      baseTariff,
      seasonSubtotal
    };
  });

  const sumOfSeasonBaseAmounts = isEligible
    ? rows.reduce((sum, r) => sum + r.seasonSubtotal, 0)
    : 0;

  // First Addendum Section 2: If player is over 24 years old on transfer date
  const isOver24 = ageAtTransfer !== null && ageAtTransfer > 24;
  const ageOver24Multiplier = isOver24
    ? FEMALE_OVER_24_MULTIPLIER[input.receivingLeagueTier]
    : 1.0;

  const afterAge24Multiplier = Math.round(sumOfSeasonBaseAmounts * ageOver24Multiplier);

  const ntOption =
    FEMALE_NATIONAL_TEAM_OPTIONS.find(o => o.value === input.nationalTeamTier) ||
    FEMALE_NATIONAL_TEAM_OPTIONS[0];
  const nationalTeamBonusPct = ntOption.bonusPct;
  const nationalTeamBonusAmount = Math.round(
    afterAge24Multiplier * (nationalTeamBonusPct / 100)
  );

  const academyBonusAmount = isEligible && input.isAcademySquad ? 10000 : 0;

  const subtotalBeforeCpi =
    afterAge24Multiplier + nationalTeamBonusAmount + academyBonusAmount;

  const cpiPct = Number.isFinite(input.cpiAdjustmentPct) ? input.cpiAdjustmentPct : 0;
  const cpiAdjustmentAmount = isEligible
    ? Math.round(subtotalBeforeCpi * (cpiPct / 100))
    : 0;

  const finalCompensation = isEligible
    ? Math.max(0, subtotalBeforeCpi + cpiAdjustmentAmount)
    : 0;

  return {
    isEligible,
    disqualificationReasons,
    ageAtTransfer,
    rows,
    sumOfSeasonBaseAmounts,
    ageOver24Multiplier,
    afterAge24Multiplier,
    nationalTeamBonusPct,
    nationalTeamBonusAmount,
    academyBonusAmount,
    subtotalBeforeCpi,
    cpiAdjustmentPct: cpiPct,
    cpiAdjustmentAmount,
    finalCompensation
  };
}

export function buildFemaleSummaryText(
  input: FemaleCalculationInput,
  result: FemaleCalculationResult
): string {
  const lines: string[] = [];
  lines.push('=== סיכום חישוב דמי השבחה (בנות - כדורגל נשים) ===');
  lines.push(`ליגת הקבוצה הקולטת: ${WOMEN_LEAGUE_LABELS[input.receivingLeagueTier]}`);
  lines.push(`גיל במועד ההעברה: ${result.ageAtTransfer ?? 'לא ידוע'} | תאריך העברה: ${input.transferDate}`);
  lines.push('');

  if (!result.isEligible) {
    lines.push('סטטוס זכאות: לא זכאית לדמי השבחה (0 ₪)');
    result.disqualificationReasons.forEach(r => lines.push(`• ${r}`));
  } else {
    lines.push('פירוט לפי עונות אימון:');
    result.rows.forEach(r => {
      lines.push(
        `• עונה ${r.seasonLabel || '-'} | גיל ${r.ageBracket} | מעל 5 חודשים: ${r.overFiveMonths ? 'כן' : 'לא'} | השתתפות: ${FEMALE_PARTICIPATION_LABELS[r.participationTier]} | סכום: ${formatIls(r.seasonSubtotal)}`
      );
    });
    lines.push('');
    lines.push(`סכום בסיס מצטבר מעונות: ${formatIls(result.sumOfSeasonBaseAmounts)}`);
    lines.push(`מקדם ליגה מעל גיל 24: ${Math.round(result.ageOver24Multiplier * 100)}% (${formatIls(result.afterAge24Multiplier)})`);
    if (result.nationalTeamBonusPct > 0) {
      lines.push(`תוספת נבחרת (+${result.nationalTeamBonusPct}%): ${formatIls(result.nationalTeamBonusAmount)}`);
    }
    if (result.academyBonusAmount > 0) {
      lines.push(`תוספת סגל אקדמיית ההתאחדות (סעיף 31(ב)): ${formatIls(result.academyBonusAmount)}`);
    }
    if (result.cpiAdjustmentPct !== 0) {
      lines.push(`התאמת מדד שנתית (${result.cpiAdjustmentPct}%): ${formatIls(result.cpiAdjustmentAmount)}`);
    }
  }

  lines.push('');
  lines.push(`סכום פיצוי סופי לתשלום: ${formatIls(result.finalCompensation)}`);
  return lines.join('\n');
}
