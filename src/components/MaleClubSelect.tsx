import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Language } from '../types/player';
import {
  MALE_PREMIER_CLUBS,
  MALE_NATIONAL_CLUBS,
  MaleClubOption,
  MALE_OTHER_FREE_AGENT_VALUE,
  findMaleClubByString,
  formatMaleClubValue,
  getMaleLeagueLabel,
  loadCustomMaleClubs,
  saveCustomMaleClub,
  removeCustomMaleClub
} from '../data/maleClubs';
import { ChevronDown, Search, Shield, Check, Plus, Trash2 } from 'lucide-react';

interface MaleClubSelectProps {
  value: string;
  onChange: (clubName: string, suggestedLeague?: string) => void;
  language?: Language;
  label?: string;
  required?: boolean;
}

export const MaleClubSelect: React.FC<MaleClubSelectProps> = ({
  value,
  onChange,
  language = 'en',
  label,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customClubs, setCustomClubs] = useState<MaleClubOption[]>(() => loadCustomMaleClubs());
  const containerRef = useRef<HTMLDivElement>(null);

  const matchedClub = useMemo(
    () => findMaleClubByString(value, customClubs),
    [value, customClubs]
  );

  useEffect(() => {
    if (value && !matchedClub) {
      setIsCustomMode(true);
    } else if (matchedClub) {
      setIsCustomMode(false);
    }
  }, [value, matchedClub]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPremier = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MALE_PREMIER_CLUBS;
    return MALE_PREMIER_CLUBS.filter(
      c => c.nameEn.toLowerCase().includes(q) || c.nameHe.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredNational = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MALE_NATIONAL_CLUBS;
    return MALE_NATIONAL_CLUBS.filter(
      c => c.nameEn.toLowerCase().includes(q) || c.nameHe.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredCustom = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customClubs;
    return customClubs.filter(
      c => c.nameEn.toLowerCase().includes(q) || c.nameHe.toLowerCase().includes(q)
    );
  }, [searchQuery, customClubs]);

  const hasExactMatch = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return true;
    return !!findMaleClubByString(q, customClubs);
  }, [searchQuery, customClubs]);

  const handleSelectClub = (club: MaleClubOption) => {
    setIsCustomMode(false);
    setSearchQuery('');
    setIsOpen(false);
    const suggested = getMaleLeagueLabel(club.leagueGroup, language);
    onChange(formatMaleClubValue(club, language), suggested || undefined);
  };

  const handleAddAndSelectManual = (clubNameInput: string) => {
    const clean = clubNameInput.trim();
    if (!clean) return;
    const updated = saveCustomMaleClub(clean);
    setCustomClubs(updated);
    setIsCustomMode(false);
    setSearchQuery('');
    setIsOpen(false);
    onChange(clean);
  };

  const handleDeleteCustomClub = (e: React.MouseEvent, id: string, clubName: string) => {
    e.stopPropagation();
    const updated = removeCustomMaleClub(id);
    setCustomClubs(updated);
    if (value === clubName) {
      onChange('');
    }
  };

  const handleSelectOther = () => {
    setIsCustomMode(true);
    const querySeed = searchQuery.trim();
    setSearchQuery('');
    setIsOpen(false);
    if (querySeed) {
      onChange(querySeed);
    } else if (!value || matchedClub) {
      onChange('');
    }
  };

  const displayPlaceholder =
    language === 'he' ? 'בחר מחלקת נוער / קבוצה...' : 'Select a youth department / club...';

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && '*'}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors text-left rtl:text-right"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className={`truncate ${!value ? 'text-slate-400' : 'font-medium'}`}>
            {isCustomMode
              ? value
                ? `${language === 'he' ? 'ידני' : 'Manual'}: ${value}`
                : language === 'he'
                ? 'אחר / הזן קבוצה ידנית'
                : 'Other / Enter Club Manually'
              : value || displayPlaceholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Searchable Grouped Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'he'
                    ? 'חיפוש או הקלדה להוספה ידנית...'
                    : 'Search or type a new club to add...'
                }
                className="w-full pl-8 pr-2.5 rtl:pl-2.5 rtl:pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick-Add option right at top when user types a club not yet in list */}
          {searchQuery.trim() && !hasExactMatch && (
            <button
              type="button"
              onClick={() => handleAddAndSelectManual(searchQuery)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 border-b border-emerald-200/70 dark:border-emerald-800/60 text-left rtl:text-right transition-colors"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {language === 'he'
                  ? `הוסף "${searchQuery.trim()}" ידנית לרשימה ובחר`
                  : `Add "${searchQuery.trim()}" manually & save to list`}
              </span>
            </button>
          )}

          {/* Grouped Club Options */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {/* Group 0: Custom Added Clubs */}
            {filteredCustom.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[11px] font-bold bg-amber-50/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 sticky top-0">
                  {language === 'he' ? 'קבוצות שהוספו ידנית' : 'Manually Added Clubs'}
                </div>
                {filteredCustom.map(club => {
                  const isSelected = matchedClub?.id === club.id && !isCustomMode;
                  return (
                    <div
                      key={club.id}
                      onClick={() => handleSelectClub(club)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{formatMaleClubValue(club, language)}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        <button
                          type="button"
                          onClick={e => handleDeleteCustomClub(e, club.id, club.nameEn)}
                          title={language === 'he' ? 'הסר מהרשימה' : 'Remove from saved list'}
                          className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Group 1: Premier League Youth Departments */}
            {filteredPremier.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[11px] font-bold bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 sticky top-0">
                  {language === 'he'
                    ? 'מחלקות נוער — ליגת העל (Premier League Youth)'
                    : 'Premier League Youth Departments (ליגת העל)'}
                </div>
                {filteredPremier.map(club => {
                  const isSelected = matchedClub?.id === club.id && !isCustomMode;
                  return (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() => handleSelectClub(club)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left rtl:text-right transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate">
                        {formatMaleClubValue(club, language)}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Group 2: National League Youth Departments */}
            {filteredNational.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[11px] font-bold bg-sky-50/80 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 sticky top-0">
                  {language === 'he'
                    ? 'מחלקות נוער — ליגה לאומית (National League Youth)'
                    : 'National League Youth Departments (ליגה לאומית)'}
                </div>
                {filteredNational.map(club => {
                  const isSelected = matchedClub?.id === club.id && !isCustomMode;
                  return (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() => handleSelectClub(club)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left rtl:text-right transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate">
                        {formatMaleClubValue(club, language)}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty search fallback */}
            {filteredPremier.length === 0 && filteredNational.length === 0 && filteredCustom.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">
                {language === 'he'
                  ? 'לא נמצאה קבוצה תואמת — לחץ למעלה להוספה ידנית.'
                  : 'No matching clubs found — click above to add it manually.'}
              </div>
            )}

            {/* Group 3: Other / Add Manually */}
            <div className="bg-slate-50/60 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={handleSelectOther}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold text-left rtl:text-right transition-colors ${
                  isCustomMode
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {language === 'he'
                      ? 'הוסף קבוצה ידנית / שחקן חופשי'
                      : `${MALE_OTHER_FREE_AGENT_VALUE} (Type Manually)`}
                  </span>
                </span>
                {isCustomMode && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Club Manual Input + Optional Save to List */}
      {isCustomMode && (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            required={required}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={
              language === 'he'
                ? 'הקלד שם קבוצה (לדוגמה: הפועל אזור) או "שחקן חופשי"...'
                : 'Type club name manually or "Free Agent"...'
            }
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
          {value.trim() && !findMaleClubByString(value, customClubs) && (
            <button
              type="button"
              onClick={() => handleAddAndSelectManual(value)}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white whitespace-nowrap shrink-0 transition-colors"
              title={language === 'he' ? 'שמור קבוצה לרשימה' : 'Save club to dropdown list'}
            >
              {language === 'he' ? '+ שמור לרשימה' : '+ Save to list'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
