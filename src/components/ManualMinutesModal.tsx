import React, { useState, useEffect } from 'react';
import { TrackedPlayer, Language } from '../types/player';
import { TRANSLATIONS } from '../translations/translations';
import { 
  getGameDurationMinutes, 
  calculatePlayTimePercentage, 
  getTotalPossibleMinutes, 
  calculateGoalInvolvements,
  calculateTargetProgress,
  getTargetProgressColor,
  getPercentageColor 
} from '../utils/trackerCalculations';
import { X, Clock, Plus, Check, Award, Shield, Calendar, Edit3, ArrowRight, Target } from 'lucide-react';

interface ManualMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: TrackedPlayer | null;
  onSaveManualMinutes: (
    playerId: string,
    updatedStats: {
      minutesPlayed: number;
      matchesPlayed: number;
      matchesEligible: number;
      goals: number;
      assists: number;
      goalInvolvementTarget?: number;
      note?: string;
    }
  ) => void;
  language: Language;
}

export const ManualMinutesModal: React.FC<ManualMinutesModalProps> = ({
  isOpen,
  onClose,
  player,
  onSaveManualMinutes,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [entryMode, setEntryMode] = useState<'add_match' | 'direct_override'>('add_match');

  // Add Match form fields
  const [matchMinutes, setMatchMinutes] = useState<number>(90);
  const [countAsAppearance, setCountAsAppearance] = useState<boolean>(true);
  const [matchGoals, setMatchGoals] = useState<number>(0);
  const [matchAssists, setMatchAssists] = useState<number>(0);
  const [matchNotes, setMatchNotes] = useState<string>('');

  // Direct Override fields
  const [totalMinutes, setTotalMinutes] = useState<number>(0);
  const [totalMatchesPlayed, setTotalMatchesPlayed] = useState<number>(0);
  const [totalMatchesEligible, setTotalMatchesEligible] = useState<number>(0);
  const [totalGoals, setTotalGoals] = useState<number>(0);
  const [totalAssists, setTotalAssists] = useState<number>(0);
  const [goalInvolvementTarget, setGoalInvolvementTarget] = useState<number>(10);

  useEffect(() => {
    if (player) {
      const duration = getGameDurationMinutes(player.category);
      setMatchMinutes(duration);
      setCountAsAppearance(true);
      setMatchGoals(0);
      setMatchAssists(0);
      setMatchNotes('');

      setTotalMinutes(player.minutesPlayed);
      setTotalMatchesPlayed(player.matchesPlayed);
      setTotalMatchesEligible(player.matchesEligible);
      setTotalGoals(player.goals);
      setTotalAssists(player.assists);
      setGoalInvolvementTarget(player.goalInvolvementTarget ?? 10);
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

  const duration = getGameDurationMinutes(player.category);

  // Projected stats calculation
  const projectedMinutes = entryMode === 'add_match' 
    ? player.minutesPlayed + Math.max(0, matchMinutes)
    : Math.max(0, totalMinutes);

  const projectedEligible = entryMode === 'add_match'
    ? player.matchesEligible + (countAsAppearance ? 1 : 0)
    : Math.max(0, totalMatchesEligible);

  const projectedPlayed = entryMode === 'add_match'
    ? player.matchesPlayed + (countAsAppearance ? 1 : 0)
    : Math.max(0, totalMatchesPlayed);

  const projectedGoals = entryMode === 'add_match'
    ? player.goals + Math.max(0, matchGoals)
    : Math.max(0, totalGoals);

  const projectedAssists = entryMode === 'add_match'
    ? player.assists + Math.max(0, matchAssists)
    : Math.max(0, totalAssists);

  const projectedPossibleMinutes = getTotalPossibleMinutes(projectedEligible, player.category, projectedMinutes);
  const projectedPct = calculatePlayTimePercentage(projectedMinutes, projectedEligible, player.category);
  const currentPct = calculatePlayTimePercentage(player.minutesPlayed, player.matchesEligible, player.category);
  const pctStyle = getPercentageColor(projectedPct);

  const projectedInvolvements = calculateGoalInvolvements(projectedGoals, projectedAssists);
  const targetProgress = calculateTargetProgress(projectedGoals, projectedAssists, goalInvolvementTarget);
  const targetStyle = getTargetProgressColor(targetProgress);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let finalNote = player.notes;
    if (entryMode === 'add_match' && matchNotes.trim()) {
      const timestamp = new Date().toLocaleDateString(language === 'he' ? 'he-IL' : 'en-GB');
      const logLine = `[${timestamp}]: +${matchMinutes}m played${matchGoals > 0 ? `, ${matchGoals}G` : ''}${matchAssists > 0 ? `, ${matchAssists}A` : ''} (${matchNotes.trim()})`;
      finalNote = player.notes ? `${player.notes}\n${logLine}` : logLine;
    }

    onSaveManualMinutes(player.id, {
      minutesPlayed: projectedMinutes,
      matchesPlayed: projectedPlayed,
      matchesEligible: projectedEligible,
      goals: projectedGoals,
      assists: projectedAssists,
      goalInvolvementTarget: Math.max(0, Number(goalInvolvementTarget) || 0),
      note: finalNote
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {language === 'he' ? 'הוספת דקות משחק ידנית' : 'Add Playing Time Manually'}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{player.name}</span>
                <span>·</span>
                <span>{player.clubName}</span>
                <span>·</span>
                <span className="text-emerald-600 font-mono-tabular font-bold">{duration} min regulation</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Stats Ribbon */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Mins</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono-tabular text-sm">
              {player.minutesPlayed}m
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Play Time %</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono-tabular text-sm">
              {currentPct}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Appearances</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono-tabular text-sm">
              {player.matchesPlayed}/{player.matchesEligible}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">G + A</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono-tabular text-sm">
              {player.goals}G · {player.assists}A
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setEntryMode('add_match')}
              className={`py-2 rounded-lg transition-all ${
                entryMode === 'add_match'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {language === 'he' ? '+ הוסף דקות ממשחק חדש' : '+ Log Match Appearance'}
            </button>

            <button
              type="button"
              onClick={() => setEntryMode('direct_override')}
              className={`py-2 rounded-lg transition-all ${
                entryMode === 'direct_override'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {language === 'he' ? 'עריכת סך כל הדקות ישירות' : 'Direct Season Total Override'}
            </button>
          </div>

          {entryMode === 'add_match' ? (
            /* Mode 1: Log Match Minutes */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {language === 'he' ? 'כמה דקות השחקן/ית שיחק/ה במשחק זה?' : 'Minutes Played in this Match *'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="130"
                    required
                    value={matchMinutes}
                    onChange={e => setMatchMinutes(Number(e.target.value))}
                    className="w-32 px-3.5 py-2.5 text-lg font-extrabold font-mono-tabular rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-500">minutes</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setMatchMinutes(duration)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                  >
                    Full Match ({duration}m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchMinutes(45)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Half (45m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchMinutes(30)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    30m
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchMinutes(15)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    15m
                  </button>
                </div>
              </div>

              {/* Checkbox for appearance */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-appearance"
                  checked={countAsAppearance}
                  onChange={e => setCountAsAppearance(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <label htmlFor="chk-appearance" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  {language === 'he' ? 'רשום כהופעה במשחק (+1 הופעה בסגל)' : 'Count as match appearance (+1 appearance, +1 eligible game)'}
                </label>
              </div>

              {/* Goals & Assists in this game */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'שערים במשחק זה' : 'Goals in this match'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matchGoals}
                    onChange={e => setMatchGoals(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'בישולים במשחק זה' : 'Assists in this match'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matchAssists}
                    onChange={e => setMatchAssists(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Match Notes / Opponent */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'הערת משחק / יריבה (אופציונלי)' : 'Match Opponent / Performance Note (Optional)'}
                </label>
                <input
                  type="text"
                  value={matchNotes}
                  onChange={e => setMatchNotes(e.target.value)}
                  placeholder="e.g. vs Maccabi Haifa - Started at CAM, scored winning goal"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          ) : (
            /* Mode 2: Direct Override */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Minutes Played
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalMinutes}
                    onChange={e => setTotalMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Matches Eligible (Games)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalMatchesEligible}
                    onChange={e => setTotalMatchesEligible(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Matches Played
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalMatchesPlayed}
                    onChange={e => setTotalMatchesPlayed(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Goals
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalGoals}
                    onChange={e => setTotalGoals(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assists
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalAssists}
                    onChange={e => setTotalAssists(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GOAL INVOLVEMENT TARGET (MANUAL TARGET: GOALS + ASSISTS) */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-600 text-white shadow-2xs">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.goalInvolvementTarget}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {t.manualTargetHelp}
                  </p>
                </div>
              </div>

              {/* Quick Presets & Target Number Input */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <div className="flex items-center gap-1">
                  {[5, 10, 15, 20, 25].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGoalInvolvementTarget(preset)}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
                        goalInvolvementTarget === preset
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="w-16">
                  <input
                    type="number"
                    min="0"
                    value={goalInvolvementTarget}
                    onChange={e => setGoalInvolvementTarget(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1 text-xs font-bold font-mono-tabular text-center rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200"
                  />
                </div>
              </div>
            </div>

            {/* Target Progress Bar & Feedback */}
            {targetProgress.hasTarget && (
              <div className="pt-2 border-t border-amber-200/70 dark:border-amber-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                    Projected: <strong className="font-mono-tabular text-slate-900 dark:text-white">{projectedInvolvements} / {goalInvolvementTarget} G+A</strong>
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${targetStyle.badgeBg} ${targetStyle.badgeText} ${targetStyle.badgeBorder}`}>
                    {targetProgress.isReached ? t.targetReached : `${targetProgress.remaining} ${t.remainingToTarget}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold font-mono-tabular text-amber-800 dark:text-amber-300">
                    {targetProgress.percentage}%
                  </span>
                  <div className="w-24 bg-amber-200/50 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${targetStyle.barColor} transition-all duration-300`}
                      style={{ width: `${Math.min(targetProgress.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PROJECTED RESULT PREVIEW */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Projected New Season Stats
              </span>
              <span className={`font-mono-tabular font-extrabold text-sm ${pctStyle.text}`}>
                {projectedPct}% Play Time
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full ${pctStyle.barColor} transition-all duration-300`}
                style={{ width: `${projectedPct}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 font-mono-tabular">
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Total Minutes</span>
                <span className="font-bold text-slate-900 dark:text-white">{projectedMinutes}m / {projectedPossibleMinutes}m</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Appearances</span>
                <span className="font-bold text-slate-900 dark:text-white">{projectedPlayed} of {projectedEligible}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">G+A Total</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{projectedGoals + projectedAssists} ({projectedGoals}G+{projectedAssists}A)</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'he' ? 'שמור דקות משחק' : 'Save Playing Time'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
