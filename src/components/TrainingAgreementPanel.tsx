import React, { useState, useEffect, useMemo } from 'react';
import {
  ContractOptionSide,
  Language,
  LeaveCheckpoint,
  MinutesClausePct,
  Player,
  ReleaseClubClause,
  SalaryPeriod,
  TrackedPlayer,
  TrainingAgreementData
} from '../types/player';
import {
  buildDefaultTrainingAgreement,
  evaluateMinutesClauseStatus,
  findMatchingTrackedPlayer,
  LEAVE_CHECKPOINT_OPTIONS,
  MINUTES_CLAUSE_OPTIONS
} from '../utils/trainingAgreementSync';
import { formatDatePretty } from '../utils/contractAlerts';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  Banknote,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Footprints,
  Plus,
  Save,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Trophy
} from 'lucide-react';

interface TrainingAgreementPanelProps {
  player: Player;
  rosterType: 'female' | 'male';
  trackedPlayers: TrackedPlayer[];
  onSaveTrainingAgreement: (
    playerId: string,
    rosterType: 'female' | 'male',
    agreement: TrainingAgreementData,
    linkedTrackedPlayerId?: string
  ) => void;
  onNavigateToTracker?: () => void;
  language: Language;
}

const BIGGER_CLUB_SUGGESTIONS_MALE = [
  'Maccabi Tel Aviv',
  'Maccabi Haifa',
  'Hapoel Beer Sheva',
  'Beitar Jerusalem',
  'Maccabi Netanya',
  'Hapoel Tel Aviv',
  'Europe / Top 5 Leagues',
  'MLS / Abroad'
];

const BIGGER_CLUB_SUGGESTIONS_FEMALE = [
  'MS Kiryat Gat',
  'Hapoel Katamon Jerusalem',
  'Maccabi Kishronot Hadera',
  'ASA Tel Aviv University',
  'Maccabi Holon',
  'Hapoel Petah Tikva',
  'Europe / UEFA Top Clubs',
  'NCAA / US Pro (NWSL / USL)'
];

export const TrainingAgreementPanel: React.FC<TrainingAgreementPanelProps> = ({
  player,
  rosterType,
  trackedPlayers,
  onSaveTrainingAgreement,
  onNavigateToTracker,
  language
}) => {
  const isHe = language === 'he';
  const clubSuggestions =
    rosterType === 'male' ? BIGGER_CLUB_SUGGESTIONS_MALE : BIGGER_CLUB_SUGGESTIONS_FEMALE;

  const initialData = useMemo<TrainingAgreementData>(() => {
    const base = buildDefaultTrainingAgreement();
    const existing = player.trainingAgreement;
    if (!existing) return base;
    return {
      ...base,
      ...existing,
      benefits: {
        ...base.benefits,
        ...(existing.benefits || {})
      },
      releaseClubs: existing.releaseClubs ? [...existing.releaseClubs] : []
    };
  }, [player.trainingAgreement]);

  const [draft, setDraft] = useState<TrainingAgreementData>(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [manualTrackedId, setManualTrackedId] = useState<string>('');

  // Sync draft when switching player
  useEffect(() => {
    setDraft(initialData);
    setHasUnsavedChanges(false);
    setJustSaved(false);
    setManualTrackedId('');
  }, [player.id, initialData]);

  const eligibleExistingTracked = useMemo(() => {
    const targetGender = rosterType === 'female' ? 'Female' : 'Male';
    return trackedPlayers.filter(tp => tp.gender === targetGender);
  }, [trackedPlayers, rosterType]);

  const matchedTrackedPlayer = useMemo(() => {
    if (manualTrackedId) {
      const explicit = trackedPlayers.find(tp => tp.id === manualTrackedId);
      if (explicit) return explicit;
    }
    return findMatchingTrackedPlayer(player, rosterType, trackedPlayers);
  }, [manualTrackedId, player, rosterType, trackedPlayers]);

  const liveClauseEvaluation = useMemo(() => {
    if (!matchedTrackedPlayer || !draft.minutesClauseEnabled || !draft.minutesThresholdPct) {
      return null;
    }
    return evaluateMinutesClauseStatus(matchedTrackedPlayer, draft.minutesThresholdPct);
  }, [matchedTrackedPlayer, draft.minutesClauseEnabled, draft.minutesThresholdPct]);

  const updateDraft = (updater: (prev: TrainingAgreementData) => TrainingAgreementData) => {
    setDraft(prev => updater(prev));
    setHasUnsavedChanges(true);
    setJustSaved(false);
  };

  const handleAddReleaseClub = () => {
    const newEntry: ReleaseClubClause = {
      id: `rel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clubName: '',
      amount: '',
      notes: ''
    };
    updateDraft(prev => ({
      ...prev,
      releaseToBiggerClubsEnabled: true,
      releaseClubs: [...(prev.releaseClubs || []), newEntry]
    }));
  };

  const handleUpdateReleaseClub = (
    id: string,
    field: keyof ReleaseClubClause,
    value: string
  ) => {
    updateDraft(prev => ({
      ...prev,
      releaseClubs: (prev.releaseClubs || []).map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveReleaseClub = (id: string) => {
    updateDraft(prev => ({
      ...prev,
      releaseClubs: (prev.releaseClubs || []).filter(item => item.id !== id)
    }));
  };

  const handleSave = () => {
    const cleanedClubs = (draft.releaseClubs || [])
      .map(c => ({
        ...c,
        clubName: c.clubName.trim(),
        amount: c.amount.trim(),
        notes: c.notes?.trim() || ''
      }))
      .filter(c => c.clubName.length > 0 || c.amount.length > 0);

    const payload: TrainingAgreementData = {
      ...draft,
      releaseClubs: cleanedClubs,
      updatedAt: new Date().toISOString()
    };

    onSaveTrainingAgreement(
      player.id,
      rosterType,
      payload,
      matchedTrackedPlayer?.id
    );
    setHasUnsavedChanges(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
  }> = ({ checked, onChange, label }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
        checked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
          checked
            ? 'ltr:translate-x-5 rtl:-translate-x-5'
            : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-4 text-xs" dir={isHe ? 'rtl' : 'ltr'}>
      {/* 1. Club Contract Mode Switcher: Signed Club Contract vs. Israeli FA Regulations */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {isHe
                  ? `מעמד חוזי מול המועדון (${player.clubName})`
                  : `Club Contract Status (${player.clubName})`}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isHe
                ? 'הגדר ידנית האם קיים חוזה חתום מול המועדון או שהשחקן/ית משחק/ת ללא חוזה לפי תקנון ההתאחדות.'
                : 'Manually set whether this player has a club contract or plays under Israeli FA regulations with no club contract.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateDraft(prev => ({ ...prev, contractMode: 'contracted' }))}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left rtl:text-right transition-all ${
              draft.contractMode === 'contracted'
                ? 'bg-white dark:bg-slate-900 border-emerald-600 ring-1 ring-emerald-500/40 text-slate-900 dark:text-white shadow-2xs'
                : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck
                className={`w-4 h-4 shrink-0 ${
                  draft.contractMode === 'contracted'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400'
                }`}
              />
              <div>
                <div className="font-bold text-xs">
                  {isHe ? 'חוזה / הסכם אימון מול המועדון' : 'Signed Club Contract / Training Agreement'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isHe ? 'תאריך סיום, שכר, סעיפי דקות ושחרור' : 'End date, salary, minutes & release clauses'}
                </div>
              </div>
            </div>
            {draft.contractMode === 'contracted' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => updateDraft(prev => ({ ...prev, contractMode: 'ifa_regulations' }))}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left rtl:text-right transition-all ${
              draft.contractMode === 'ifa_regulations'
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/30 text-amber-950 dark:text-amber-100 shadow-2xs'
                : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert
                className={`w-4 h-4 shrink-0 ${
                  draft.contractMode === 'ifa_regulations'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-400'
                }`}
              />
              <div>
                <div className="font-bold text-xs">
                  {isHe ? 'ללא חוזה מועדון (תקנון ההתאחדות)' : 'No Club Contract (Israeli FA Regulations)'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isHe ? 'משחק/ת ללא חוזה — כפוף לתקנון ההתאחדות' : 'Plays without contract under IFA regulations'}
                </div>
              </div>
            </div>
            {draft.contractMode === 'ifa_regulations' && (
              <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
          </button>
        </div>

        {draft.contractMode === 'ifa_regulations' && (
          <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/25 space-y-2">
            <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>
                  {isHe
                    ? 'ללא חוזה חתום מול המועדון — תקנון ההתאחדות לכדורגל:'
                    : 'No Signed Club Contract — Israeli FA Regulations Apply:'}
                </strong>{' '}
                {isHe
                  ? 'השחקן/ית רשום/ה ופעיל/ה ללא חוזה העסקה, ותנאי המעבר/שחרור כפופים לתקנון הרישום, מעמד השחקנים ודמי ההשבחה של ההתאחדות.'
                  : 'Player does not hold a written club contract; transfer windows, minor release rules, and IFA training compensation apply.'}
              </div>
            </div>
            <input
              type="text"
              value={draft.ifaRegulationNote || ''}
              onChange={e => updateDraft(prev => ({ ...prev, ifaRegulationNote: e.target.value }))}
              placeholder={
                isHe
                  ? 'הערת תקנון אופציונלית (לדוגמה: חלון קטין / הסגר / טופס שחרור נדרש)...'
                  : 'Optional IFA regulation note (e.g. minor Hesger rule, release form required)...'
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* 2. Contract End Date, One-Side Option & Salary */}
      {draft.contractMode === 'contracted' && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Club Contract End Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isHe ? 'תאריך סיום חוזה מול המועדון' : 'Club Contract End Date'}</span>
              </label>
              <input
                type="date"
                value={draft.clubContractEndDate || ''}
                onChange={e => updateDraft(prev => ({ ...prev, clubContractEndDate: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white font-mono-tabular"
              />
              {draft.clubContractEndDate && (
                <span className="text-[10px] text-slate-500 mt-1 block font-mono-tabular">
                  {formatDatePretty(draft.clubContractEndDate)}
                </span>
              )}
            </div>

            {/* Salary */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isHe ? 'שכר חוזי' : 'Player Salary'}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft.salaryAmount || ''}
                  onChange={e => updateDraft(prev => ({ ...prev, salaryAmount: e.target.value }))}
                  placeholder={isHe ? 'לדוגמה: ₪6,500 או €2,000' : 'e.g. ₪6,500 or €2,000'}
                  className="flex-1 min-w-0 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white font-mono-tabular"
                />
                <select
                  value={draft.salaryPeriod || 'Monthly'}
                  onChange={e =>
                    updateDraft(prev => ({ ...prev, salaryPeriod: e.target.value as SalaryPeriod }))
                  }
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shrink-0"
                >
                  <option value="Monthly">{isHe ? 'חודשי' : 'Monthly'}</option>
                  <option value="Weekly">{isHe ? 'שבועי' : 'Weekly'}</option>
                  <option value="Annual">{isHe ? 'שנתי' : 'Annual'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* One-Side Option Toggle */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {isHe ? 'אופציה לצד אחד להארכת חוזה' : 'Option to One Side'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isHe
                    ? 'הפעל אם לחוזה יש אופציה חד-צדדית למועדון או לשחקן/ית'
                    : 'Toggle on if the club contract includes an extension option for one side'}
                </div>
              </div>
              <ToggleSwitch
                checked={Boolean(draft.hasOneSideOption)}
                onChange={checked =>
                  updateDraft(prev => ({
                    ...prev,
                    hasOneSideOption: checked,
                    optionSide: checked
                      ? prev.optionSide && prev.optionSide !== 'None'
                        ? prev.optionSide
                        : 'Club Option'
                      : 'None'
                  }))
                }
                label="Option to one side"
              />
            </div>

            {draft.hasOneSideOption && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isHe ? 'למי שמורה האופציה?' : 'Option Holder'}
                  </label>
                  <select
                    value={draft.optionSide || 'Club Option'}
                    onChange={e =>
                      updateDraft(prev => ({
                        ...prev,
                        optionSide: e.target.value as ContractOptionSide
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Club Option">{isHe ? 'אופציית מועדון' : 'Club Option'}</option>
                    <option value="Player Option">{isHe ? 'אופציית שחקן/ית' : 'Player Option'}</option>
                    <option value="Mutual Option">{isHe ? 'אופציה הדדית' : 'Mutual Option'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isHe ? 'פרטי האופציה / מועד מימוש' : 'Option Term / Notice Deadline'}
                  </label>
                  <input
                    type="text"
                    value={draft.optionNote || ''}
                    onChange={e => updateDraft(prev => ({ ...prev, optionNote: e.target.value }))}
                    placeholder={isHe ? 'לדוגמה: +1 עונה עד 15.05.27' : 'e.g. +1 Season by May 15'}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Structured Minutes Clause (Manual Toggle + Sync with Player Tracker) */}
      <div
        className={`p-4 rounded-xl border transition-colors space-y-3 ${
          draft.minutesClauseEnabled
            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {isHe
                  ? 'סעיף דקות משחק מובנה (שחרור חינם)'
                  : 'Structured Minutes Clause (Free Exit if Below %)'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isHe
                  ? 'אם השחקן/ית לא מגיע/ה לאחוז הדקות שנבחר עד תחנת הבדיקה — רשאי/ת לעזוב בחינם.'
                  : 'If player does not reach the selected play-time percentage by checkpoint, player can leave free.'}
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={Boolean(draft.minutesClauseEnabled)}
            onChange={checked =>
              updateDraft(prev => ({
                ...prev,
                minutesClauseEnabled: checked,
                minutesThresholdPct: prev.minutesThresholdPct || 50,
                minutesCheckpoint: prev.minutesCheckpoint || 'Winter 27',
                syncMinutesWithTracker:
                  prev.syncMinutesWithTracker !== undefined ? prev.syncMinutesWithTracker : true
              }))
            }
            label="Toggle Structured Minutes Clause"
          />
        </div>

        {draft.minutesClauseEnabled && (
          <div className="space-y-3 pt-2 border-t border-emerald-200/70 dark:border-emerald-900/50">
            {/* Minimum % Picker: 30%, 40%, 50%, 55%, 60%, 70%, 80% */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isHe ? 'אחוז דקות מינימלי נדרש (%):' : 'Minimum Playing Time Threshold (%):'}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {MINUTES_CLAUSE_OPTIONS.map((pct: MinutesClausePct) => {
                  const selected = draft.minutesThresholdPct === pct;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => updateDraft(prev => ({ ...prev, minutesThresholdPct: pct }))}
                      className={`py-2 px-2 rounded-lg text-xs font-extrabold font-mono-tabular border transition-all ${
                        selected
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checkpoint to Leave: Winter 27, Summer 27, Winter 28 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isHe ? 'תחנת יציאה / בדיקה (Checkpoint):' : 'Checkpoint to Leave:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LEAVE_CHECKPOINT_OPTIONS.map((cp: LeaveCheckpoint) => {
                  const selected = draft.minutesCheckpoint === cp;
                  const cpLabel = isHe
                    ? cp === 'Winter 27'
                      ? 'חורף 27 (Winter 27)'
                      : cp === 'Summer 27'
                      ? 'קיץ 27 (Summer 27)'
                      : 'חורף 28 (Winter 28)'
                    : cp;
                  return (
                    <button
                      key={cp}
                      type="button"
                      onClick={() => updateDraft(prev => ({ ...prev, minutesCheckpoint: cp }))}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${
                        selected
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-900 dark:border-slate-100 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {cpLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Player Tracker Sync Status Box */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {isHe ? 'סנכרון חי עם מעקב דקות (Player Tracker)' : 'Live Sync with Player Tracker'}
                  </span>
                </div>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={draft.syncMinutesWithTracker !== false}
                    onChange={e =>
                      updateDraft(prev => ({ ...prev, syncMinutesWithTracker: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{isHe ? 'סנכרן בשמירה' : 'Sync on Save'}</span>
                </label>
              </div>

              {matchedTrackedPlayer && liveClauseEvaluation ? (
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono-tabular text-slate-600 dark:text-slate-300">
                      {isHe ? 'במעקב:' : 'Tracked:'}{' '}
                      <strong>{matchedTrackedPlayer.minutesPlayed}m</strong> /{' '}
                      {liveClauseEvaluation.totalPossibleMinutes}m ({matchedTrackedPlayer.matchesPlayed}/
                      {matchedTrackedPlayer.matchesEligible} {isHe ? 'משחקים' : 'games'})
                    </span>

                    <span
                      className={`font-bold font-mono-tabular px-2 py-0.5 rounded-md border ${
                        liveClauseEvaluation.isMet
                          ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800'
                          : liveClauseEvaluation.isClose
                          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {liveClauseEvaluation.actualPct}% / {liveClauseEvaluation.minPct}%{' '}
                      {liveClauseEvaluation.isMet
                        ? isHe
                          ? '✓ עומד ביעד'
                          : '✓ Clause Met'
                        : isHe
                        ? `⚠ מתחת ב-${Math.abs(liveClauseEvaluation.deltaPct)}% (זכאי לשחרור)`
                        : `⚠ ${Math.abs(liveClauseEvaluation.deltaPct)}% Below (Free Exit)`}
                    </span>
                  </div>

                  {/* Progress bar with visual threshold marker */}
                  <div className="relative w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-visible">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        liveClauseEvaluation.isMet
                          ? 'bg-green-600'
                          : liveClauseEvaluation.isClose
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(liveClauseEvaluation.actualPct, 100)}%` }}
                    />
                    <div
                      className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-slate-900 dark:bg-white"
                      style={{ left: `${liveClauseEvaluation.minPct}%` }}
                      title={`Minimum Clause Threshold: ${liveClauseEvaluation.minPct}%`}
                    />
                  </div>

                  {onNavigateToTracker && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={onNavigateToTracker}
                        className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{isHe ? 'פתח במעקב דקות' : 'Open in Player Tracker'}</span>
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isHe
                      ? `${player.name} אינו מופיע כרגע ב-Player Tracker. רשימת המעקב הקיימת נשמרת כפי שהיא (לא יתווספו שחקנים חדשים אוטומטית).`
                      : `${player.name} is not currently in Player Tracker. Existing Player Tracker players are kept as-is (no new players will be added automatically).`}
                  </div>
                  {eligibleExistingTracked.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                        {isHe ? 'או קשר לשורה קיימת ב-Player Tracker:' : 'Link to existing Player Tracker entry:'}
                      </label>
                      <select
                        value={manualTrackedId}
                        onChange={e => {
                          setManualTrackedId(e.target.value);
                          setHasUnsavedChanges(true);
                          setJustSaved(false);
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="">
                          {isHe ? 'ללא קישור (שמור רשימה קיימת)' : 'None (keep tracker unchanged)'}
                        </option>
                        {eligibleExistingTracked.map(tp => (
                          <option key={tp.id} value={tp.id}>
                            {tp.name} · {tp.clubName} ({tp.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Other Benefits (Manual Toggles: Shoes, National Team Bonus, Appearances Bonus) */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{isHe ? 'הטבות ובונוסים נוספים בחוזה' : 'Other Benefits & Bonuses'}</span>
        </h4>

        {/* Benefit A: Shoes */}
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isHe ? 'נעלי כדורגל / ציוד (Shoes)' : 'Football Boots / Shoes'}
              </span>
            </div>
            <ToggleSwitch
              checked={Boolean(draft.benefits?.shoes)}
              onChange={checked =>
                updateDraft(prev => ({
                  ...prev,
                  benefits: { ...(prev.benefits || {}), shoes: checked }
                }))
              }
              label="Shoes benefit"
            />
          </div>
          {draft.benefits?.shoes && (
            <input
              type="text"
              value={draft.benefits?.shoesDetails || ''}
              onChange={e =>
                updateDraft(prev => ({
                  ...prev,
                  benefits: { ...(prev.benefits || {}), shoesDetails: e.target.value }
                }))
              }
              placeholder={
                isHe ? 'פירוט (לדוגמה: 2 זוגות בעונה / תקציב ₪1,500)' : 'Details (e.g. 2 pairs/season or ₪1,500 allowance)'
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          )}
        </div>

        {/* Benefit B: Money if called to National Team */}
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isHe ? 'מענק זימון לנבחרת לאומית' : 'Money if Called to National Team'}
              </span>
            </div>
            <ToggleSwitch
              checked={Boolean(draft.benefits?.nationalTeamBonus)}
              onChange={checked =>
                updateDraft(prev => ({
                  ...prev,
                  benefits: { ...(prev.benefits || {}), nationalTeamBonus: checked }
                }))
              }
              label="National team bonus"
            />
          </div>
          {draft.benefits?.nationalTeamBonus && (
            <input
              type="text"
              value={draft.benefits?.nationalTeamBonusAmount || ''}
              onChange={e =>
                updateDraft(prev => ({
                  ...prev,
                  benefits: { ...(prev.benefits || {}), nationalTeamBonusAmount: e.target.value }
                }))
              }
              placeholder={isHe ? 'סכום המענק (לדוגמה: ₪2,500 לזימון / €1,000)' : 'Bonus amount (e.g. ₪2,500 per call-up or €1,000)'}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono-tabular"
            />
          )}
        </div>

        {/* Benefit C: Money if reach amount of appearances */}
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isHe ? 'מענק הגעה לכמות הופעות' : 'Money if Reaching Amount of Appearances'}
              </span>
            </div>
            <ToggleSwitch
              checked={Boolean(draft.benefits?.appearancesBonus)}
              onChange={checked =>
                updateDraft(prev => ({
                  ...prev,
                  benefits: { ...(prev.benefits || {}), appearancesBonus: checked }
                }))
              }
              label="Appearances milestone bonus"
            />
          </div>
          {draft.benefits?.appearancesBonus && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={draft.benefits?.appearancesThreshold || ''}
                onChange={e =>
                  updateDraft(prev => ({
                    ...prev,
                    benefits: { ...(prev.benefits || {}), appearancesThreshold: e.target.value }
                  }))
                }
                placeholder={isHe ? 'יעד הופעות (לדוגמה: 15 הופעות)' : 'Target appearances (e.g. 15 appearances)'}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={draft.benefits?.appearancesBonusAmount || ''}
                onChange={e =>
                  updateDraft(prev => ({
                    ...prev,
                    benefits: { ...(prev.benefits || {}), appearancesBonusAmount: e.target.value }
                  }))
                }
                placeholder={isHe ? 'סכום המענק (לדוגמה: ₪5,000)' : 'Bonus amount (e.g. ₪5,000)'}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono-tabular"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5. Release to Bigger Clubs (Amount and Name of Clubs) */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {isHe ? 'סעיף שחרור למועדונים גדולים' : 'Release to Bigger Clubs'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isHe
                  ? 'ציין שמות מועדונים וסכומי השחרור המוגדרים באופציה'
                  : 'Specify target club names and release amounts included in the option'}
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={Boolean(draft.releaseToBiggerClubsEnabled)}
            onChange={checked =>
              updateDraft(prev => {
                const nextClubs =
                  checked && (!prev.releaseClubs || prev.releaseClubs.length === 0)
                    ? [
                        {
                          id: `rel-${Date.now()}`,
                          clubName: '',
                          amount: '',
                          notes: ''
                        }
                      ]
                    : prev.releaseClubs || [];
                return {
                  ...prev,
                  releaseToBiggerClubsEnabled: checked,
                  releaseClubs: nextClubs
                };
              })
            }
            label="Release to bigger clubs"
          />
        </div>

        {draft.releaseToBiggerClubsEnabled && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <datalist id={`release-clubs-${player.id}`}>
              {clubSuggestions.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>

            {(draft.releaseClubs || []).map((clubEntry, idx) => (
              <div
                key={clubEntry.id}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
              >
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    list={`release-clubs-${player.id}`}
                    value={clubEntry.clubName}
                    onChange={e =>
                      handleUpdateReleaseClub(clubEntry.id, 'clubName', e.target.value)
                    }
                    placeholder={isHe ? `מועדון #${idx + 1} (לדוגמה: מכבי ת״א)` : `Club #${idx + 1} name`}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={clubEntry.amount}
                    onChange={e =>
                      handleUpdateReleaseClub(clubEntry.id, 'amount', e.target.value)
                    }
                    placeholder={isHe ? 'סכום (₪ / €)' : 'Amount (e.g. €150k)'}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono-tabular font-bold"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={clubEntry.notes || ''}
                    onChange={e =>
                      handleUpdateReleaseClub(clubEntry.id, 'notes', e.target.value)
                    }
                    placeholder={isHe ? 'תנאי / חלון' : 'Window / note'}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveReleaseClub(clubEntry.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md"
                    title={isHe ? 'הסר מועדון' : 'Remove club option'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddReleaseClub}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-dashed border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isHe ? 'הוסף מועדון וסכום שחרור' : 'Add Bigger Club Release Option'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. Custom Agreement Notes */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {isHe ? 'הערות נוספות להסכם האימון' : 'Additional Training Agreement Notes'}
        </label>
        <textarea
          rows={2}
          value={draft.customNotes || ''}
          onChange={e => updateDraft(prev => ({ ...prev, customNotes: e.target.value }))}
          placeholder={
            isHe
              ? 'סעיפים מיוחדים נוספים, סעיף אימונים בבוגרים, תנאי מגורים/נסיעות...'
              : 'Any other manual clauses, first-team training guarantees, housing/travel allowances...'
          }
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      {/* Save Training Agreement Action Bar */}
      <div className="sticky bottom-0 z-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="text-[11px] flex items-center gap-1.5">
          {justSaved ? (
            <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 font-bold">
              <Check className="w-3.5 h-3.5" />
              <span>
                {isHe
                  ? 'הסכם האימון נשמר וסונכרן בהצלחה!'
                  : 'Training Agreement saved & synced!'}
              </span>
            </span>
          ) : hasUnsavedChanges ? (
            <span className="text-amber-700 dark:text-amber-400 font-semibold">
              {isHe ? 'ישנם שינויים שלא נשמרו בהסכם.' : 'Unsaved Training Agreement changes.'}
            </span>
          ) : draft.updatedAt ? (
            <span className="text-slate-500 dark:text-slate-400 font-mono-tabular">
              {isHe ? 'עודכן:' : 'Updated:'} {new Date(draft.updatedAt).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              {isHe ? 'הפעל וכבה סעיפים ידנית ולחץ שמור.' : 'Toggle clauses manually and save.'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isHe ? 'שמור הסכם אימון' : 'Save Training Agreement'}</span>
        </button>
      </div>
    </div>
  );
};
