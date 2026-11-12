import React, { useState, useEffect } from 'react';
import { TrackedPlayer, TrackerCategory, PlayerGender, Language } from '../types/player';
import { TRANSLATIONS, TRACKER_CATEGORY_LABELS, getTrackerCategoryBadgeColor } from '../translations/translations';
import { 
  getGameDurationMinutes, 
  calculatePlayTimePercentage, 
  getTotalPossibleMinutes, 
  calculateGoalInvolvements,
  calculateTargetProgress,
  getTargetProgressColor,
  getPercentageColor 
} from '../utils/trackerCalculations';
import { X, Activity, User, Shield, Trophy, Sparkles, Clock, Check, Target } from 'lucide-react';

interface AddTrackedPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: TrackedPlayer) => void;
  playerToEdit?: TrackedPlayer | null;
  defaultCategory?: TrackerCategory;
  language: Language;
}

const COMMON_POSITIONS = [
  'Striker (ST)',
  'Left Winger (LW)',
  'Right Winger (RW)',
  'Attacking Midfield (CAM)',
  'Central Midfield (CM)',
  'Defensive Midfield (CDM)',
  'Left-Back (LB)',
  'Right-Back (RB)',
  'Centre-Back (CB)',
  'Goalkeeper (GK)'
];

export const AddTrackedPlayerModal: React.FC<AddTrackedPlayerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  playerToEdit,
  defaultCategory = 'U17',
  language
}) => {
  const t = TRANSLATIONS[language];

  const [name, setName] = useState('');
  const [gender, setGender] = useState<PlayerGender>('Female');
  const [category, setCategory] = useState<TrackerCategory>(defaultCategory);
  const [age, setAge] = useState<number>(17);
  const [clubName, setClubName] = useState('');
  const [league, setLeague] = useState('');
  const [position, setPosition] = useState('Central Midfield (CM)');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [matchesEligible, setMatchesEligible] = useState<number>(10);
  const [matchesPlayed, setMatchesPlayed] = useState<number>(10);
  const [minutesPlayed, setMinutesPlayed] = useState<number>(720);
  const [goals, setGoals] = useState<number>(3);
  const [assists, setAssists] = useState<number>(4);
  const [goalInvolvementTarget, setGoalInvolvementTarget] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Populate when editing
  useEffect(() => {
    if (playerToEdit) {
      setName(playerToEdit.name);
      setGender(playerToEdit.gender);
      setCategory(playerToEdit.category);
      setAge(playerToEdit.age);
      setClubName(playerToEdit.clubName);
      setLeague(playerToEdit.league || '');
      setPosition(playerToEdit.position);
      setJerseyNumber(playerToEdit.jerseyNumber || 10);
      setMatchesEligible(playerToEdit.matchesEligible);
      setMatchesPlayed(playerToEdit.matchesPlayed);
      setMinutesPlayed(playerToEdit.minutesPlayed);
      setGoals(playerToEdit.goals);
      setAssists(playerToEdit.assists);
      setGoalInvolvementTarget(playerToEdit.goalInvolvementTarget ?? 10);
      setNotes(playerToEdit.notes || '');
      setPhotoUrl(playerToEdit.photoUrl || '');
    } else {
      // Default reset
      setName('');
      setGender(defaultCategory === 'Womans' ? 'Female' : 'Female');
      setCategory(defaultCategory);
      setAge(defaultCategory === 'U15' ? 14 : defaultCategory === 'U16' ? 15 : defaultCategory === 'U17' ? 16 : defaultCategory === 'U19' ? 18 : 22);
      setClubName('');
      setLeague('');
      setPosition('Central Midfield (CM)');
      setJerseyNumber(10);
      setMatchesEligible(10);
      setMatchesPlayed(8);
      setMinutesPlayed(defaultCategory === 'U15' || defaultCategory === 'U16' ? 560 : 630);
      setGoals(2);
      setAssists(2);
      setGoalInvolvementTarget(10);
      setNotes('');
      setPhotoUrl('');
    }
  }, [playerToEdit, isOpen, defaultCategory]);

  if (!isOpen) return null;

  // Real-time calculation previews based on category rule
  const matchDuration = getGameDurationMinutes(category);
  const totalPossible = getTotalPossibleMinutes(matchesEligible, category, minutesPlayed);
  const playPct = calculatePlayTimePercentage(minutesPlayed, matchesEligible, category);
  const goalInvolvements = calculateGoalInvolvements(goals, assists);
  const targetProgress = calculateTargetProgress(goals, assists, goalInvolvementTarget);
  const pctStyle = getPercentageColor(playPct);
  const targetStyle = getTargetProgressColor(targetProgress);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clubName.trim()) return;

    const savedPlayer: TrackedPlayer = {
      id: playerToEdit ? playerToEdit.id : `trk-${Date.now()}`,
      name: name.trim(),
      photoUrl: photoUrl.trim() || (gender === 'Female' ? '/src/assets/images/player_portrait_midfield_1794074972939.jpg' : undefined),
      gender,
      category,
      age: Number(age) || 16,
      clubName: clubName.trim(),
      league: league.trim() || undefined,
      position,
      jerseyNumber: Number(jerseyNumber) || undefined,
      matchesEligible: Math.max(0, Number(matchesEligible) || 0),
      matchesPlayed: Math.max(0, Number(matchesPlayed) || 0),
      minutesPlayed: Math.max(0, Number(minutesPlayed) || 0),
      goals: Math.max(0, Number(goals) || 0),
      assists: Math.max(0, Number(assists) || 0),
      goalInvolvementTarget: Math.max(0, Number(goalInvolvementTarget) || 0),
      notes: notes.trim() || undefined,
      createdAt: playerToEdit ? playerToEdit.createdAt : new Date().toISOString().split('T')[0],
    };

    onSave(savedPlayer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {playerToEdit ? t.editTrackedPlayer : t.trackNewPlayer}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {matchDuration} min regulation match calculation applied ({category})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Category & Gender Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.youthCategory} *
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['U15', 'U16', 'U17', 'U19', 'Womans'] as TrackerCategory[]).map(cat => {
                  const duration = getGameDurationMinutes(cat);
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        if (cat === 'Womans') setGender('Female');
                      }}
                      className={`p-2 rounded-lg text-center border transition-all text-xs font-bold ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/30' 
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs truncate">{cat === 'Womans' ? "Woman's" : cat}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{duration}m</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {category === 'U15' || category === 'U16' ? '⚡ U15 & U16: calculated per 80 min match' : '⚡ U17, U19 & Woman\'s: calculated per 90 min match'}
              </p>
            </div>

            {/* Gender Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.gender} *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                    gender === 'Female'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>👩 {t.female}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  disabled={category === 'Womans'}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                    gender === 'Male'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  } ${category === 'Womans' ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span>👦 {t.male}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Name & Age & Jersey */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.thPlayer} {language === 'he' ? 'שם השחקן/ית' : 'Player Name'} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Maya Ronen or Liam Cohen"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Age
              </label>
              <input
                type="number"
                min="12"
                max="45"
                value={age}
                onChange={e => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jersey #
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={jerseyNumber}
                onChange={e => setJerseyNumber(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Club & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Club *
              </label>
              <input
                type="text"
                required
                value={clubName}
                onChange={e => setClubName(e.target.value)}
                placeholder="e.g. Maccabi Haifa U17"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Position
              </label>
              <select
                value={position}
                onChange={e => setPosition(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              >
                {COMMON_POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </div>

          {/* STATS SECTION: Minutes, Games, Goals, Assists */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Match Minutes & Involvements</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                1 Match = {matchDuration} mins
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Matches Eligible */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.eligibleMatches}
                </label>
                <input
                  type="number"
                  min="0"
                  value={matchesEligible}
                  onChange={e => setMatchesEligible(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400">Total team matches</span>
              </div>

              {/* Matches Appeared In */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.appearances}
                </label>
                <input
                  type="number"
                  min="0"
                  value={matchesPlayed}
                  onChange={e => setMatchesPlayed(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400">Played in game</span>
              </div>

              {/* Minutes Played */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.minutesPlayed} *
                </label>
                <input
                  type="number"
                  min="0"
                  value={minutesPlayed}
                  onChange={e => setMinutesPlayed(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm font-bold font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400"
                />
                <span className="text-[10px] text-slate-400">Actual pitch minutes</span>
              </div>

              {/* Goals & Assists */}
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.goals}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={goals}
                    onChange={e => setGoals(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm font-bold font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.assists}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={assists}
                    onChange={e => setAssists(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm font-bold font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* GOAL INVOLVEMENT TARGET (MANUAL TARGET: GOALS + ASSISTS) */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {t.goalInvolvementTarget}
                    </label>
                    <span className="text-[10px] text-slate-400 block">
                      {t.manualTargetHelp}
                    </span>
                  </div>
                </div>

                {/* Target Number Input and Preset Chips */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[5, 10, 15, 20, 25].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setGoalInvolvementTarget(preset)}
                        className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
                          goalInvolvementTarget === preset
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-20">
                    <input
                      type="number"
                      min="0"
                      value={goalInvolvementTarget}
                      onChange={e => setGoalInvolvementTarget(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1 text-sm font-extrabold font-mono-tabular text-center rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
                    />
                  </div>
                </div>
              </div>

              {/* Live Target Progress Meter */}
              {targetProgress.hasTarget && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Progress: <strong className="font-mono-tabular text-slate-800 dark:text-slate-200">{goalInvolvements} / {goalInvolvementTarget} G+A</strong>
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${targetStyle.badgeBg} ${targetStyle.badgeText} ${targetStyle.badgeBorder}`}>
                      {targetProgress.isReached ? t.targetReached : `${targetProgress.remaining} ${t.remainingToTarget}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold font-mono-tabular text-amber-700 dark:text-amber-300">
                      {targetProgress.percentage}%
                    </span>
                    <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full ${targetStyle.barColor} transition-all duration-300`}
                        style={{ width: `${Math.min(targetProgress.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LIVE CALCULATION PREVIEW BOX */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Max Minutes ({matchesEligible} × {matchDuration}m)</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono-tabular text-sm">
                    {totalPossible} mins
                  </strong>
                </div>

                <div className="h-7 w-px bg-slate-200 dark:border-slate-700"></div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Play Time %</span>
                  <span className={`inline-flex items-center gap-1 font-bold text-sm font-mono-tabular ${pctStyle.text}`}>
                    {playPct}%
                  </span>
                </div>

                <div className="h-7 w-px bg-slate-200 dark:border-slate-700"></div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Goal Involvements (G+A)</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono-tabular text-sm">
                    {goalInvolvements} ({goals}G + {assists}A)
                  </strong>
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="w-full sm:w-36 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${pctStyle.barColor} transition-all duration-300`}
                  style={{ width: `${playPct}%` }}
                ></div>
              </div>
            </div>

          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Scouting / Tracking Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Started last 5 matches, played full 80 min, exceptional work rate."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
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
              <span>{playerToEdit ? 'Save Changes' : 'Add to Player Tracker'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
