import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Database,
  Settings2,
  Calendar,
  Award,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import {
  IfaClub,
  ClubCategory,
  loadIfaClubs,
  saveIfaClubs,
  resetIfaClubsToDefault,
  lookupClubCategory,
  getCategoryLabelHe,
  getCategoryBadgeClasses
} from '../data/ifaClubs';
import {
  MALE_TRAINING_AGES,
  MALE_ANNUAL_TARIFFS,
  TrainingAgeMale,
  LoanPeriod,
  MaleCalculationInput,
  FemaleCalculationInput,
  FemaleTrainingSeason,
  FemaleAgeBracket,
  FemaleParticipationTier,
  FemaleNationalTeamTier,
  WomenLeagueTier,
  WOMEN_LEAGUE_LABELS,
  FEMALE_PARTICIPATION_LABELS,
  FEMALE_NATIONAL_TEAM_OPTIONS,
  FEMALE_SEASON_TARIFFS,
  calculateMaleTrainingCompensation,
  calculateFemaleTrainingCompensation,
  buildMaleSummaryText,
  buildFemaleSummaryText,
  formatIls
} from '../utils/trainingCompensation';
import { ClubSearchSelect } from './ClubSearchSelect';
import { ClubDatabaseModal } from './ClubDatabaseModal';

const CPI_STORAGE_KEY = 'aura_female_cpi_pct_v1';

const getTodayIso = () => new Date().toISOString().split('T')[0];

const createDefaultMaleInput = (clubs: IfaClub[]): MaleCalculationInput => {
  const transferringName = 'הפועל רעננה';
  const receivingName = 'מכבי תל אביב';
  return {
    transferringClubName: transferringName,
    transferringCategory: lookupClubCategory(transferringName, clubs),
    receivingClubName: receivingName,
    receivingCategory: lookupClubCategory(receivingName, clubs),
    ageInputMode: 'dob',
    birthDate: '2010-03-15',
    exactAgeAtTransfer: 16,
    transferDate: getTodayIso(),
    twoConsecutiveSeasons: true,
    playedAtLeast25PctMinutes: true,
    cancelledOrWaivedInWriting: false,
    periodInputMode: 'dates',
    registrationStartDate: '2022-09-01',
    registrationEndDate: getTodayIso(),
    loanPeriods: [],
    yearData: {
      12: { manualDays: 120, membershipFee: 0 },
      13: { manualDays: 365, membershipFee: 0 },
      14: { manualDays: 365, membershipFee: 0 },
      15: { manualDays: 365, membershipFee: 0 },
      16: { manualDays: 180, membershipFee: 0 },
      17: { manualDays: 0, membershipFee: 0 }
    }
  };
};

const createDefaultFemaleInput = (savedCpi: number): FemaleCalculationInput => ({
  ageInputMode: 'dob',
  birthDate: '2006-05-10',
  transferDate: getTodayIso(),
  exactAgeAtTransfer: 20,
  receivingLeagueTier: 'TOP',
  twoConsecutiveSeasons: true,
  minimumMinutesMet: true,
  isFinishingWrittenContract: true,
  article22eAge24FirstTransfer: false,
  seasons: [
    {
      id: 'fs-1',
      seasonLabel: '2023/24',
      ageBracket: '15-17',
      overFiveMonths: true,
      participationTier: 'OVER_50'
    },
    {
      id: 'fs-2',
      seasonLabel: '2024/25',
      ageBracket: '18-28',
      overFiveMonths: true,
      participationTier: 'OVER_50'
    },
    {
      id: 'fs-3',
      seasonLabel: '2025/26',
      ageBracket: '18-28',
      overFiveMonths: true,
      participationTier: 'BETWEEN_20_50'
    }
  ],
  isAcademySquad: false,
  nationalTeamTier: 'NONE',
  cpiAdjustmentPct: savedCpi
});

export const TrainingCompensationView: React.FC = () => {
  const [track, setTrack] = useState<'male' | 'female'>('female');
  const [clubs, setClubs] = useState<IfaClub[]>(() => loadIfaClubs());
  const [isClubModalOpen, setIsClubModalOpen] = useState(false);

  // Manual overrides for clubs (null = automatic lookup)
  const [transferringCatOverride, setTransferringCatOverride] = useState<ClubCategory | null>(null);
  const [receivingCatOverride, setReceivingCatOverride] = useState<ClubCategory | null>(null);

  // Track 1: Male Input State
  const [maleInput, setMaleInput] = useState<MaleCalculationInput>(() =>
    createDefaultMaleInput(loadIfaClubs())
  );

  // Track 2: Female Input State + CPI setting
  const [savedCpiPct, setSavedCpiPct] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(CPI_STORAGE_KEY);
      const num = raw ? Number(raw) : 0;
      return Number.isFinite(num) ? num : 0;
    } catch {
      return 0;
    }
  });
  const [femaleInput, setFemaleInput] = useState<FemaleCalculationInput>(() =>
    createDefaultFemaleInput(savedCpiPct)
  );

  const [showAdminCpiPanel, setShowAdminCpiPanel] = useState(false);
  const [showMaleTariffTable, setShowMaleTariffTable] = useState(false);
  const [showFemaleTariffTable, setShowFemaleTariffTable] = useState(false);
  const [copied, setCopied] = useState(false);

  // Effective Male Input with manual category overrides applied
  const effectiveMaleInput = useMemo<MaleCalculationInput>(() => {
    const tCat =
      transferringCatOverride ?? lookupClubCategory(maleInput.transferringClubName, clubs);
    const rCat =
      receivingCatOverride ?? lookupClubCategory(maleInput.receivingClubName, clubs);
    return {
      ...maleInput,
      transferringCategory: tCat,
      receivingCategory: rCat
    };
  }, [maleInput, transferringCatOverride, receivingCatOverride, clubs]);

  const maleResult = useMemo(
    () => calculateMaleTrainingCompensation(effectiveMaleInput),
    [effectiveMaleInput]
  );

  const femaleResult = useMemo(
    () => calculateFemaleTrainingCompensation(femaleInput),
    [femaleInput]
  );

  const handleSaveClubs = (updated: IfaClub[]) => {
    setClubs(updated);
    saveIfaClubs(updated);
  };

  const handleResetClubs = () => {
    const defaults = resetIfaClubsToDefault();
    setClubs(defaults);
  };

  const handleResetCurrentTrack = () => {
    if (track === 'male') {
      setTransferringCatOverride(null);
      setReceivingCatOverride(null);
      setMaleInput(createDefaultMaleInput(clubs));
    } else {
      setFemaleInput(createDefaultFemaleInput(savedCpiPct));
    }
  };

  const handleCopySummary = async () => {
    const text =
      track === 'male'
        ? buildMaleSummaryText(effectiveMaleInput, maleResult)
        : buildFemaleSummaryText(femaleInput, femaleResult);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback textarea copy
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Male loan handlers
  const handleAddLoanPeriod = () => {
    const newLoan: LoanPeriod = {
      id: `loan-${Date.now()}`,
      startDate: '2024-07-01',
      endDate: '2025-05-31'
    };
    setMaleInput(prev => ({
      ...prev,
      loanPeriods: [...prev.loanPeriods, newLoan]
    }));
  };

  const handleUpdateLoanPeriod = (id: string, field: 'startDate' | 'endDate', val: string) => {
    setMaleInput(prev => ({
      ...prev,
      loanPeriods: prev.loanPeriods.map(lp => (lp.id === id ? { ...lp, [field]: val } : lp))
    }));
  };

  const handleRemoveLoanPeriod = (id: string) => {
    setMaleInput(prev => ({
      ...prev,
      loanPeriods: prev.loanPeriods.filter(lp => lp.id !== id)
    }));
  };

  const handleUpdateMaleYearField = (
    age: TrainingAgeMale,
    field: 'manualDays' | 'membershipFee',
    value: number
  ) => {
    const safeVal = Number.isFinite(value) ? Math.max(0, value) : 0;
    setMaleInput(prev => ({
      ...prev,
      yearData: {
        ...prev.yearData,
        [age]: {
          ...prev.yearData[age],
          [field]: safeVal
        }
      }
    }));
  };

  // Female season handlers
  const handleAddFemaleSeason = () => {
    const lastSeason = femaleInput.seasons[femaleInput.seasons.length - 1];
    let nextLabel = '2025/26';
    if (lastSeason && /^\d{4}\/\d{2}$/.test(lastSeason.seasonLabel)) {
      const startYear = Number(lastSeason.seasonLabel.slice(0, 4)) + 1;
      const endShort = String((startYear + 1) % 100).padStart(2, '0');
      nextLabel = `${startYear}/${endShort}`;
    }

    const newSeason: FemaleTrainingSeason = {
      id: `fs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      seasonLabel: nextLabel,
      ageBracket: lastSeason?.ageBracket || '18-28',
      overFiveMonths: true,
      participationTier: 'OVER_50'
    };

    setFemaleInput(prev => ({
      ...prev,
      seasons: [...prev.seasons, newSeason]
    }));
  };

  const handleUpdateFemaleSeason = <K extends keyof FemaleTrainingSeason>(
    id: string,
    field: K,
    value: FemaleTrainingSeason[K]
  ) => {
    setFemaleInput(prev => ({
      ...prev,
      seasons: prev.seasons.map(s => (s.id === id ? { ...s, [field]: value } : s))
    }));
  };

  const handleRemoveFemaleSeason = (id: string) => {
    setFemaleInput(prev => ({
      ...prev,
      seasons: prev.seasons.filter(s => s.id !== id)
    }));
  };

  const handleUpdateCpiSetting = (val: number) => {
    const safe = Number.isFinite(val) ? val : 0;
    setSavedCpiPct(safe);
    try {
      localStorage.setItem(CPI_STORAGE_KEY, String(safe));
    } catch {
      // ignore storage errors
    }
    setFemaleInput(prev => ({ ...prev, cpiAdjustmentPct: safe }));
  };

  const activeResult = track === 'male' ? maleResult : femaleResult;

  return (
    <div dir="rtl" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Page Header & Track Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Calculator className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                מחשבון דמי השבחה
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              חישוב מדויק של דמי אימון והשבחה בשקלים (₪) בהתאם לתקנון מעמד והעברות שחקנים קטינים ושחקניות כדורגל של ההתאחדות לכדורגל בישראל.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {track === 'male' ? (
              <button
                type="button"
                onClick={() => setIsClubModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>עדכון רשימת קבוצות שנתית</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAdminCpiPanel(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                  showAdminCpiPanel
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>הגדרות מדד שנתי (1 ביוני)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'הסיכום הועתק!' : 'העתק סיכום'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetCurrentTrack}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>איפוס</span>
            </button>
          </div>
        </div>

        {/* Track Segmented Mode Switcher */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setTrack('female')}
            className={`py-2.5 px-4 rounded-lg text-right transition-all flex items-center justify-between gap-3 ${
              track === 'female'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-emerald-200 dark:border-emerald-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div>
              <div className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
                <span>חישוב לבנות</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  כדורגל נשים
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                תקנון מעמד והעברות שחקניות כדורגל (סעיפים 22–23, 30–31 ותוספת ראשונה)
              </div>
            </div>
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                track === 'female' ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setTrack('male')}
            className={`py-2.5 px-4 rounded-lg text-right transition-all flex items-center justify-between gap-3 ${
              track === 'male'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-emerald-200 dark:border-emerald-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div>
              <div className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
                <span>חישוב לבנים</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                  נוער וקטינים
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                תקנון מעמד והעברות של שחקנים קטינים (סעיפים 19, 30 ותוספת שנייה)
              </div>
            </div>
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                track === 'male' ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          </button>
        </div>

        {/* Optional Female Admin CPI Setting Panel */}
        {track === 'female' && showAdminCpiPanel && (
          <div className="mt-4 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                הגדרות מנהל — עדכון מדד שנתי מ-1 ביוני (כדורגל נשים)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                ניתן להזין אחוז הצמדה מצטבר למדד המחירים לצרכן החל מ-1 ביוני (0% = תעריפי בסיס ללא תוספת מדד). הערך נשמר בדפדפן.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                שיעור הצמדה (%):
              </label>
              <input
                type="number"
                step="0.1"
                value={femaleInput.cpiAdjustmentPct}
                onChange={e => handleUpdateCpiSetting(Number(e.target.value))}
                className="w-24 px-2.5 py-1.5 text-xs font-mono-tabular font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Split Grid: Form Inputs (7 cols) & Summary/Results (5 cols) on XL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT/RIGHT MAIN INPUT COLUMN */}
        <div className="xl:col-span-7 space-y-6">
          {track === 'male' ? (
            /* ================= TRACK 1: MALE INPUTS ================= */
            <>
              {/* Card 1: Clubs & Governing Category */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      1. קבוצה מעבירה וקבוצה קולטת (סיווג {clubs.length} קבוצות)
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      הקטגוריה הקובעת היא הנמוכה מבין שתי הקבוצות (סעיף 30(א)(2)). קבוצה קולטת בקטגוריה 4 פטורה מתשלום (סעיף 19(ה)).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ClubSearchSelect
                    label="קבוצה מעבירה (זכאית לפיצוי)"
                    clubs={clubs}
                    clubName={maleInput.transferringClubName}
                    manualOverride={transferringCatOverride}
                    onChangeClub={(name, cat) =>
                      setMaleInput(prev => ({
                        ...prev,
                        transferringClubName: name,
                        transferringCategory: cat
                      }))
                    }
                    onChangeManualOverride={setTransferringCatOverride}
                  />

                  <ClubSearchSelect
                    label="קבוצה קולטת (משלמת)"
                    clubs={clubs}
                    clubName={maleInput.receivingClubName}
                    manualOverride={receivingCatOverride}
                    onChangeClub={(name, cat) =>
                      setMaleInput(prev => ({
                        ...prev,
                        receivingClubName: name,
                        receivingCategory: cat
                      }))
                    }
                    onChangeManualOverride={setReceivingCatOverride}
                  />
                </div>

                {/* Governing Category Summary Bar */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    קטגוריה קובעת לחישוב (הנמוכה מבין השתיים — סעיף 30(א)(2)):
                  </span>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-md border ${getCategoryBadgeClasses(
                      maleResult.governingCategory
                    )}`}
                  >
                    {getCategoryLabelHe(maleResult.governingCategory)}
                  </span>
                </div>
              </section>

              {/* Card 2: Dates, Age & Article 19 Eligibility */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>2. גיל השחקן, מועד ההעברה ובדיקת תנאי סף (סעיף 19)</span>
                  </h2>

                  <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setMaleInput(prev => ({ ...prev, ageInputMode: 'dob' }))}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        maleInput.ageInputMode === 'dob'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      תאריך לידה
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMaleInput(prev => ({ ...prev, ageInputMode: 'exact_age' }))
                      }
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        maleInput.ageInputMode === 'exact_age'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      גיל מדויק
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {maleInput.ageInputMode === 'dob' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        תאריך לידה של השחקן
                      </label>
                      <input
                        type="date"
                        value={maleInput.birthDate}
                        onChange={e =>
                          setMaleInput(prev => ({ ...prev, birthDate: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        גיל השחקן במועד ההעברה (שנים שלמות)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={25}
                        value={maleInput.exactAgeAtTransfer}
                        onChange={e =>
                          setMaleInput(prev => ({
                            ...prev,
                            exactAgeAtTransfer: Number(e.target.value)
                          }))
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      תאריך העברה
                    </label>
                    <input
                      type="date"
                      value={maleInput.transferDate}
                      onChange={e =>
                        setMaleInput(prev => ({
                          ...prev,
                          transferDate: e.target.value,
                          registrationEndDate: e.target.value
                        }))
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Article 19 Eligibility Checkboxes */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    תנאי זכאות וחריגים (סעיף 19):
                  </div>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={maleInput.twoConsecutiveSeasons}
                      onChange={e =>
                        setMaleInput(prev => ({
                          ...prev,
                          twoConsecutiveSeasons: e.target.checked
                        }))
                      }
                      className="mt-0.5 w-4 h-4 accent-emerald-600 rounded shrink-0"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      השחקן היה רשום בקבוצה המעבירה לפחות <strong>2 עונות משחק רצופות</strong> (לא כולל תקופות השאלה).
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={maleInput.playedAtLeast25PctMinutes}
                      onChange={e =>
                        setMaleInput(prev => ({
                          ...prev,
                          playedAtLeast25PctMinutes: e.target.checked
                        }))
                      }
                      className="mt-0.5 w-4 h-4 accent-emerald-600 rounded shrink-0"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      השחקן שותף בלפחות <strong>25% מסך הדקות</strong> ב-30 משחקי הליגה האחרונים של הקבוצה המעבירה.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-rose-200/70 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={maleInput.cancelledOrWaivedInWriting}
                      onChange={e =>
                        setMaleInput(prev => ({
                          ...prev,
                          cancelledOrWaivedInWriting: e.target.checked
                        }))
                      }
                      className="mt-0.5 w-4 h-4 accent-rose-600 rounded shrink-0"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      הקבוצה המעבירה ביטלה / לא חידשה את רישום השחקן, או ויתרה על הפיצוי בכתב (סימון = פיצוי 0 ₪).
                    </span>
                  </label>
                </div>
              </section>

              {/* Card 3: Training Periods & Membership Fee Deductions */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      3. תקופות אימון (גילאי 12–17) וניכוי דמי חבר (סעיף 30(ג))
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      החישוב מבוצע לפי שנים קלנדריות (ימים במועדון חלקי 365 × תעריף שנתי), בניכוי דמי חבר ששילם השחקן באותה שנה.
                    </p>
                  </div>

                  <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() =>
                        setMaleInput(prev => ({ ...prev, periodInputMode: 'dates' }))
                      }
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        maleInput.periodInputMode === 'dates'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      לפי תאריכי רישום
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMaleInput(prev => ({ ...prev, periodInputMode: 'manual_days' }))
                      }
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        maleInput.periodInputMode === 'manual_days'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      הזנת ימים ידנית
                    </button>
                  </div>
                </div>

                {maleInput.periodInputMode === 'dates' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          תאריך תחילת רישום בקבוצה המעבירה
                        </label>
                        <input
                          type="date"
                          value={maleInput.registrationStartDate}
                          onChange={e =>
                            setMaleInput(prev => ({
                              ...prev,
                              registrationStartDate: e.target.value
                            }))
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          תאריך סיום רישום בקבוצה המעבירה
                        </label>
                        <input
                          type="date"
                          value={maleInput.registrationEndDate}
                          onChange={e =>
                            setMaleInput(prev => ({
                              ...prev,
                              registrationEndDate: e.target.value
                            }))
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Loan periods exclusion */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          תקופות השאלה (מנוכות מספירת הימים הקלנדריים):
                        </span>
                        <button
                          type="button"
                          onClick={handleAddLoanPeriod}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>הוסף תקופת השאלה</span>
                        </button>
                      </div>

                      {maleInput.loanPeriods.length === 0 ? (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          לא הוגדרו תקופות השאלה. לחץ על "הוסף תקופת השאלה" אם השחקן הושאל למועדון אחר.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {maleInput.loanPeriods.map((lp, idx) => (
                            <div
                              key={lp.id}
                              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                              <span className="text-[11px] font-bold text-slate-500 px-1 shrink-0">
                                השאלה #{idx + 1}
                              </span>
                              <input
                                type="date"
                                value={lp.startDate}
                                onChange={e =>
                                  handleUpdateLoanPeriod(lp.id, 'startDate', e.target.value)
                                }
                                className="flex-1 px-2 py-1 text-xs font-mono-tabular rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                              />
                              <span className="text-xs text-slate-400 text-center">עד</span>
                              <input
                                type="date"
                                value={lp.endDate}
                                onChange={e =>
                                  handleUpdateLoanPeriod(lp.id, 'endDate', e.target.value)
                                }
                                className="flex-1 px-2 py-1 text-xs font-mono-tabular rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveLoanPeriod(lp.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 self-end sm:self-auto"
                                title="הסר השאלה"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    הזן מטה את מספר הימים הקלנדריים המדויק (0 עד 365) עבור כל שנת אימון מגיל 12 עד גיל 17.
                  </div>
                )}

                {/* Per-year Membership Fees & Manual Days Table */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">שנת אימון</th>
                        <th className="py-2.5 px-3 font-semibold">גיל</th>
                        <th className="py-2.5 px-3 font-semibold">
                          ימים במועדון {maleInput.periodInputMode === 'dates' ? '(מחושב)' : '(קלט ידני)'}
                        </th>
                        <th className="py-2.5 px-3 font-semibold">ניכוי דמי חבר (₪)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {MALE_TRAINING_AGES.map(age => {
                        const row = maleResult.rows.find(r => r.trainingAge === age);
                        const entry = maleInput.yearData[age];
                        return (
                          <tr key={age} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-mono-tabular font-bold text-slate-800 dark:text-slate-200">
                              {row?.calendarYear ?? '-'}
                            </td>
                            <td className="py-2 px-3 font-mono-tabular text-slate-600 dark:text-slate-400">
                              גיל {age}
                            </td>
                            <td className="py-2 px-3">
                              {maleInput.periodInputMode === 'manual_days' ? (
                                <input
                                  type="number"
                                  min={0}
                                  max={366}
                                  value={entry.manualDays}
                                  onChange={e =>
                                    handleUpdateMaleYearField(
                                      age,
                                      'manualDays',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-24 px-2 py-1 text-xs font-mono-tabular rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                              ) : (
                                <span className="font-mono-tabular font-semibold text-slate-800 dark:text-slate-200">
                                  {row?.daysInClub ?? 0} ימים
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min={0}
                                step={50}
                                value={entry.membershipFee}
                                onChange={e =>
                                  handleUpdateMaleYearField(
                                    age,
                                    'membershipFee',
                                    Number(e.target.value)
                                  )
                                }
                                placeholder="0"
                                className="w-28 px-2 py-1 text-xs font-mono-tabular rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Collapsible Male Tariff Reference */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowMaleTariffTable(prev => !prev)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>טבלת תעריפים שנתית רשמית (תוספת שנייה, בש"ח)</span>
                    {showMaleTariffTable ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showMaleTariffTable && (
                    <div className="mt-3 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-[11px] text-right font-mono-tabular">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="py-2 px-2.5 font-sans">קטגוריה</th>
                            {MALE_TRAINING_AGES.map(a => (
                              <th key={a} className="py-2 px-2.5">
                                גיל {a}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {([1, 2, 3, 4] as ClubCategory[]).map(cat => (
                            <tr
                              key={cat}
                              className={
                                cat === maleResult.governingCategory
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 font-bold'
                                  : ''
                              }
                            >
                              <td className="py-1.5 px-2.5 font-sans font-bold text-slate-800 dark:text-slate-200">
                                קטגוריה {cat}
                              </td>
                              {MALE_TRAINING_AGES.map(age => (
                                <td key={age} className="py-1.5 px-2.5 text-slate-700 dark:text-slate-300">
                                  {new Intl.NumberFormat('he-IL').format(
                                    MALE_ANNUAL_TARIFFS[cat][age]
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            /* ================= TRACK 2: FEMALE INPUTS ================= */
            <>
              {/* Card 1: Age, League Tier & Articles 22-23 Eligibility */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>1. גיל השחקנית, ליגת הקבוצה הקולטת ותנאי סף (סעיפים 22–23)</span>
                  </h2>

                  <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() =>
                        setFemaleInput(prev => ({ ...prev, ageInputMode: 'dob' }))
                      }
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        femaleInput.ageInputMode === 'dob'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      תאריך לידה
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFemaleInput(prev => ({ ...prev, ageInputMode: 'exact_age' }))
                      }
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        femaleInput.ageInputMode === 'exact_age'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      גיל מדויק
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {femaleInput.ageInputMode === 'dob' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        תאריך לידה של השחקנית
                      </label>
                      <input
                        type="date"
                        value={femaleInput.birthDate}
                        onChange={e =>
                          setFemaleInput(prev => ({ ...prev, birthDate: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        גיל השחקנית במועד ההעברה
                      </label>
                      <input
                        type="number"
                        min={6}
                        max={45}
                        value={femaleInput.exactAgeAtTransfer}
                        onChange={e =>
                          setFemaleInput(prev => ({
                            ...prev,
                            exactAgeAtTransfer: Number(e.target.value)
                          }))
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      תאריך העברה
                    </label>
                    <input
                      type="date"
                      value={femaleInput.transferDate}
                      onChange={e =>
                        setFemaleInput(prev => ({ ...prev, transferDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      ליגת הקבוצה הקולטת
                    </label>
                    <select
                      value={femaleInput.receivingLeagueTier}
                      onChange={e =>
                        setFemaleInput(prev => ({
                          ...prev,
                          receivingLeagueTier: e.target.value as WomenLeagueTier
                        }))
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="TOP">{WOMEN_LEAGUE_LABELS.TOP}</option>
                      <option value="SECOND">{WOMEN_LEAGUE_LABELS.SECOND}</option>
                      <option value="THIRD_FOURTH">{WOMEN_LEAGUE_LABELS.THIRD_FOURTH}</option>
                    </select>
                  </div>
                </div>

                {/* Articles 22 & 23 Eligibility Checkboxes */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    בדיקת תנאי זכאות (סעיפים 22 ו-23):
                  </div>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={femaleInput.twoConsecutiveSeasons}
                      onChange={e =>
                        setFemaleInput(prev => ({
                          ...prev,
                          twoConsecutiveSeasons: e.target.checked
                        }))
                      }
                      className="mt-0.5 w-4 h-4 accent-emerald-600 rounded shrink-0"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong>סעיף 23(ג):</strong> השחקנית הייתה רשומה בקבוצה המעבירה לפחות{' '}
                      <strong>שתי עונות משחק רצופות</strong>.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={femaleInput.minimumMinutesMet}
                      onChange={e =>
                        setFemaleInput(prev => ({
                          ...prev,
                          minimumMinutesMet: e.target.checked
                        }))
                      }
                      className="mt-0.5 w-4 h-4 accent-emerald-600 rounded shrink-0"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong>סעיפים 23(ד)-(ה):</strong> השחקנית עמדה בדרישת דקות המשחק המינימלית (
                      {femaleResult.ageAtTransfer !== null && femaleResult.ageAtTransfer < 17
                        ? 'מתחת לגיל 17: לפחות 25% מהדקות ב-30 המשחקים הרשמיים האחרונים'
                        : 'גיל 17 ומעלה: לפחות 20% מהדקות בשתי העונות הרצופות שקדמו להעברה'}
                      ).
                    </span>
                  </label>

                  {femaleResult.ageAtTransfer !== null && femaleResult.ageAtTransfer >= 17 && (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={femaleInput.isFinishingWrittenContract}
                          onChange={e =>
                            setFemaleInput(prev => ({
                              ...prev,
                              isFinishingWrittenContract: e.target.checked
                            }))
                          }
                          className="mt-0.5 w-4 h-4 accent-emerald-600 rounded shrink-0"
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          השחקנית מסיימת חוזה כתוב בקבוצה המעבירה (או אינה כפופה לחריג סעיף 22(ה)).
                        </span>
                      </label>

                      {!femaleInput.isFinishingWrittenContract && (
                        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/30 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={femaleInput.article22eAge24FirstTransfer}
                            onChange={e =>
                              setFemaleInput(prev => ({
                                ...prev,
                                article22eAge24FirstTransfer: e.target.checked
                              }))
                            }
                            className="mt-0.5 w-4 h-4 accent-amber-600 rounded shrink-0"
                          />
                          <span className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                            <strong>סעיף 22(ה):</strong> השחקנית בת <strong>24 לפחות</strong> ועוברת{' '}
                            <strong>לראשונה</strong> מהמועדון שבו שיחקה במרבית שנותיה (נדרש לזכאות ללא סיום חוזה כתוב).
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Card 2: Training Seasons Breakdown */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      2. פירוט עונות אימון במועדון המעביר (החל מהעונה שבה מלאו לה 12)
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      רק עונה שבה שיחקה מעל 5 חודשים נחשבת עונה מלאה (סעיף 30). ההשתתפות נקבעת לפי ליגה + גביע המדינה (הגבוה בין קבוצה ראשית או משנית).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFemaleSeason}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>הוסף עונה</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {femaleInput.seasons.map((season, idx) => (
                    <div
                      key={season.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                    >
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          עונה #{idx + 1}
                        </label>
                        <input
                          type="text"
                          value={season.seasonLabel}
                          onChange={e =>
                            handleUpdateFemaleSeason(season.id, 'seasonLabel', e.target.value)
                          }
                          placeholder="2024/25"
                          className="w-full px-2.5 py-1.5 text-xs font-mono-tabular font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          קבוצת גיל בעונה
                        </label>
                        <select
                          value={season.ageBracket}
                          onChange={e =>
                            handleUpdateFemaleSeason(
                              season.id,
                              'ageBracket',
                              e.target.value as FemaleAgeBracket
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="12-15">גיל 12–15</option>
                          <option value="15-17">גיל 15–17</option>
                          <option value="18-28">גיל 18–28</option>
                          <option value="28+">גיל 28+</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          שיחקה מעל 5 חודשים?
                        </label>
                        <select
                          value={season.overFiveMonths ? 'yes' : 'no'}
                          onChange={e =>
                            handleUpdateFemaleSeason(
                              season.id,
                              'overFiveMonths',
                              e.target.value === 'yes'
                            )
                          }
                          className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border bg-white dark:bg-slate-800 ${
                            season.overFiveMonths
                              ? 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                              : 'border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          <option value="yes">כן (מעל 5 חודשים)</option>
                          <option value="no">לא (≤ 5 חודשים = 0 ₪)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          שיעור השתתפות במשחקים
                        </label>
                        <select
                          value={season.participationTier}
                          onChange={e =>
                            handleUpdateFemaleSeason(
                              season.id,
                              'participationTier',
                              e.target.value as FemaleParticipationTier
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="UNDER_20">{FEMALE_PARTICIPATION_LABELS.UNDER_20}</option>
                          <option value="BETWEEN_20_50">
                            {FEMALE_PARTICIPATION_LABELS.BETWEEN_20_50}
                          </option>
                          <option value="OVER_50">{FEMALE_PARTICIPATION_LABELS.OVER_50}</option>
                        </select>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveFemaleSeason(season.id)}
                          disabled={femaleInput.seasons.length <= 1}
                          title="הסר עונה"
                          className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Collapsible Female Tariff Reference */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowFemaleTariffTable(prev => !prev)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>טבלת תעריפי בסיס לעונה מלאה (תוספת ראשונה סעיף 1, בש"ח)</span>
                    {showFemaleTariffTable ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showFemaleTariffTable && (
                    <div className="mt-3 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-xs text-right font-mono-tabular">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-sans">
                          <tr>
                            <th className="py-2 px-3">קבוצת גיל</th>
                            <th className="py-2 px-3">פחות מ-20%</th>
                            <th className="py-2 px-3">20% עד 50%</th>
                            <th className="py-2 px-3">למעלה מ-50%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(['12-15', '15-17', '18-28', '28+'] as FemaleAgeBracket[]).map(b => (
                            <tr key={b}>
                              <td className="py-1.5 px-3 font-sans font-bold text-slate-800 dark:text-slate-200">
                                גיל {b}
                              </td>
                              <td className="py-1.5 px-3 text-slate-500">
                                {formatIls(FEMALE_SEASON_TARIFFS[b].UNDER_20)}
                              </td>
                              <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                                {formatIls(FEMALE_SEASON_TARIFFS[b].BETWEEN_20_50)}
                              </td>
                              <td className="py-1.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                                {formatIls(FEMALE_SEASON_TARIFFS[b].OVER_50)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

              {/* Card 3: Bonuses & Multipliers */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>3. תוספות ומקדמים (אקדמיה, נבחרת ישראל ומקדם גיל)</span>
                </h2>

                {/* IFA Football Academy Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={femaleInput.isAcademySquad}
                    onChange={e =>
                      setFemaleInput(prev => ({ ...prev, isAcademySquad: e.target.checked }))
                    }
                    className="mt-0.5 w-4 h-4 accent-emerald-600 rounded shrink-0"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>סגל האקדמיה לכדורגל של ההתאחדות (סעיף 31(ב))</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      השחקנית משתייכת לסגל האקדמיה במועד ההעברה — מוסיף סכום קבוע של{' '}
                      <strong className="font-mono-tabular text-emerald-700 dark:text-emerald-300">
                        +10,000 ₪
                      </strong>{' '}
                      לסכום הפיצוי הסופי.
                    </p>
                  </div>
                </label>

                {/* National Team Bonus Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    רקורד בנבחרת ישראל (תוספת אחת הגבוהה ביותר — לא מצטבר, תוספת ראשונה סעיף 3):
                  </label>
                  <div className="space-y-1.5">
                    {FEMALE_NATIONAL_TEAM_OPTIONS.map(opt => (
                      <label
                        key={opt.value}
                        className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors text-xs ${
                          femaleInput.nationalTeamTier === opt.value
                            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white font-semibold'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="femaleNationalTeam"
                            checked={femaleInput.nationalTeamTier === opt.value}
                            onChange={() =>
                              setFemaleInput(prev => ({
                                ...prev,
                                nationalTeamTier: opt.value as FemaleNationalTeamTier
                              }))
                            }
                            className="accent-emerald-600 shrink-0"
                          />
                          <span>{opt.label}</span>
                        </div>
                        <span className="font-mono-tabular font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                          +{opt.bonusPct}%
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* RESULTS & BREAKDOWN COLUMN (Sticky on XL) */}
        <div className="xl:col-span-5 space-y-5 xl:sticky xl:top-20">
          {/* Prominent Final Compensation Card */}
          <div
            className={`rounded-2xl p-6 border shadow-sm transition-colors ${
              activeResult.isEligible
                ? 'bg-emerald-900 dark:bg-emerald-950 border-emerald-700 text-white'
                : 'bg-slate-900 dark:bg-slate-950 border-rose-500/60 text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-emerald-200/90">
              <span>סכום פיצוי סופי לתשלום</span>
              <span className="font-mono-tabular px-2 py-0.5 rounded bg-white/10 text-white">
                {track === 'male' ? 'תקנון קטינים (בנים)' : 'תקנון כדורגל נשים'}
              </span>
            </div>

            <div className="mt-3 text-3xl sm:text-4xl font-extrabold font-mono-tabular tracking-tight">
              {formatIls(activeResult.finalCompensation)}
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                {activeResult.isEligible ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span className="text-emerald-100 font-semibold">
                      עומד בתנאי הזכאות לדמי השבחה
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-rose-200 font-semibold">
                      אין זכאות לדמי השבחה (0 ₪)
                    </span>
                  </>
                )}
              </div>

              <span className="font-mono-tabular text-white/80">
                גיל בהעברה: {activeResult.ageAtTransfer ?? 'לא תקין'}
              </span>
            </div>
          </div>

          {/* Eligibility / Disqualification Reasons Box */}
          {!activeResult.isEligible && (
            <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 space-y-2">
              <div className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>סיבות לאי-זכאות / פטור מתשלום על פי התקנון:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-rose-700 dark:text-rose-200 list-disc pr-5">
                {activeResult.disqualificationReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                טבלת פירוט חישוב
              </h3>
              <span className="text-[11px] font-mono-tabular text-slate-500">ILS (₪)</span>
            </div>

            {track === 'male' ? (
              /* MALE BREAKDOWN */
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2 px-3 font-semibold">שנה (גיל)</th>
                        <th className="py-2 px-3 font-semibold">תעריף</th>
                        <th className="py-2 px-3 font-semibold">ימים</th>
                        <th className="py-2 px-3 font-semibold">ברוטו</th>
                        <th className="py-2 px-3 font-semibold">ניכוי חבר</th>
                        <th className="py-2 px-3 font-semibold">נטו לתשלום</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono-tabular">
                      {maleResult.rows.map(row => (
                        <tr
                          key={row.trainingAge}
                          className={
                            row.daysInClub === 0
                              ? 'text-slate-400 dark:text-slate-600'
                              : 'text-slate-800 dark:text-slate-200'
                          }
                        >
                          <td className="py-2 px-3 font-semibold whitespace-nowrap">
                            {row.calendarYear}{' '}
                            <span className="font-sans text-[11px] font-normal text-slate-400">
                              (גיל {row.trainingAge})
                            </span>
                          </td>
                          <td className="py-2 px-3">{formatIls(row.annualTariff)}</td>
                          <td className="py-2 px-3">{row.daysInClub}</td>
                          <td className="py-2 px-3">{formatIls(row.grossAmount)}</td>
                          <td className="py-2 px-3 text-rose-600 dark:text-rose-400">
                            {row.membershipFeeDeduction > 0
                              ? `-${formatIls(row.membershipFeeDeduction)}`
                              : '0 ₪'}
                          </td>
                          <td className="py-2 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                            {formatIls(row.netAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      קטגוריה קובעת (הנמוכה מבין השתיים):
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {getCategoryLabelHe(maleResult.governingCategory)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      סה"כ ברוטו לפני ניכוי דמי חבר:
                    </span>
                    <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                      {formatIls(maleResult.totalGrossBeforeFees)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      סה"כ ניכוי דמי חבר (סעיף 30(ג)):
                    </span>
                    <span className="font-mono-tabular font-semibold text-rose-600 dark:text-rose-400">
                      -{formatIls(maleResult.totalMembershipFees)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-extrabold">
                    <span className="text-slate-900 dark:text-white">סה"כ סופי לתשלום:</span>
                    <span className="font-mono-tabular text-emerald-700 dark:text-emerald-400">
                      {formatIls(maleResult.finalCompensation)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* FEMALE BREAKDOWN */
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2 px-3 font-semibold">עונה</th>
                        <th className="py-2 px-3 font-semibold">גיל</th>
                        <th className="py-2 px-3 font-semibold">&gt;5 חודשים</th>
                        <th className="py-2 px-3 font-semibold">השתתפות</th>
                        <th className="py-2 px-3 font-semibold">סכום עונה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {femaleResult.rows.map(row => (
                        <tr key={row.id} className="text-slate-800 dark:text-slate-200">
                          <td className="py-2 px-3 font-mono-tabular font-semibold">
                            {row.seasonLabel || '-'}
                          </td>
                          <td className="py-2 px-3 font-mono-tabular">{row.ageBracket}</td>
                          <td className="py-2 px-3">
                            {row.overFiveMonths ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                כן
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                לא
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            {FEMALE_PARTICIPATION_LABELS[row.participationTier]}
                          </td>
                          <td className="py-2 px-3 font-mono-tabular font-bold text-emerald-700 dark:text-emerald-400">
                            {formatIls(row.seasonSubtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      סכום בסיס מצטבר מהעונות:
                    </span>
                    <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                      {formatIls(femaleResult.sumOfSeasonBaseAmounts)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      מקדם ליגה (תוספת ראשונה סעיף 2 — מעל גיל 24):
                    </span>
                    <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                      {Math.round(femaleResult.ageOver24Multiplier * 100)}% (
                      {formatIls(femaleResult.afterAge24Multiplier)})
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      תוספת נבחרת ישראל (+{femaleResult.nationalTeamBonusPct}%):
                    </span>
                    <span className="font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400">
                      +{formatIls(femaleResult.nationalTeamBonusAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      תוספת סגל אקדמיית ההתאחדות (סעיף 31(ב)):
                    </span>
                    <span className="font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400">
                      +{formatIls(femaleResult.academyBonusAmount)}
                    </span>
                  </div>

                  {femaleResult.cpiAdjustmentPct !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">
                        הצמדה למדד ({femaleResult.cpiAdjustmentPct}%):
                      </span>
                      <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                        {femaleResult.cpiAdjustmentAmount >= 0 ? '+' : ''}
                        {formatIls(femaleResult.cpiAdjustmentAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-extrabold">
                    <span className="text-slate-900 dark:text-white">סה"כ סופי לתשלום:</span>
                    <span className="font-mono-tabular text-emerald-700 dark:text-emerald-400">
                      {formatIls(femaleResult.finalCompensation)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Annual IFA Clubs Update Modal */}
      <ClubDatabaseModal
        isOpen={isClubModalOpen}
        onClose={() => setIsClubModalOpen(false)}
        clubs={clubs}
        onSaveClubs={handleSaveClubs}
        onResetDefault={handleResetClubs}
      />
    </div>
  );
};
