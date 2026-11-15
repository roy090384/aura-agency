import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Language } from '../types/player';
import {
  MALE_PREMIER_CLUBS,
  MALE_NATIONAL_CLUBS,
  MaleClubOption,
  MALE_OTHER_FREE_AGENT_VALUE,
  findMaleClubByString,
  formatMaleClubValue,
  getMaleLeagueLabel
} from '../data/maleClubs';
import { ChevronDown, Search, Shield, Check } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  const matchedClub = useMemo(() => findMaleClubByString(value), [value]);

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

  const handleSelectClub = (club: MaleClubOption) => {
    setIsCustomMode(false);
    setSearchQuery('');
    setIsOpen(false);
    onChange(
      formatMaleClubValue(club, language),
      getMaleLeagueLabel(club.leagueGroup, language)
    );
  };

  const handleSelectOther = () => {
    setIsCustomMode(true);
    setSearchQuery('');
    setIsOpen(false);
    if (!value || matchedClub) {
      onChange(
        language === 'he' ? 'שחקן חופשי' : 'Free Agent',
        ''
      );
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
              ? language === 'he'
                ? `אחר / שחקן חופשי${value ? `: ${value}` : ''}`
                : `${MALE_OTHER_FREE_AGENT_VALUE}${value ? `: ${value}` : ''}`
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
                    ? 'חיפוש קבוצה בעברית או באנגלית...'
                    : 'Search club (English or Hebrew)...'
                }
                className="w-full pl-8 pr-2.5 rtl:pl-2.5 rtl:pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Grouped Club Options */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
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
            {filteredPremier.length === 0 && filteredNational.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">
                {language === 'he'
                  ? 'לא נמצאו קבוצות תואמות ברשימה.'
                  : 'No matching clubs found.'}
              </div>
            )}

            {/* Group 3: Other / Free Agent at the bottom */}
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
                <span>
                  {language === 'he'
                    ? 'אחר / שחקן חופשי (Other / Free Agent)'
                    : 'Other / Free Agent (אחר / שחקן חופשי)'}
                </span>
                {isCustomMode && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Club / Free Agent Input when Other / Free Agent is selected */}
      {isCustomMode && (
        <input
          type="text"
          required={required}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={
            language === 'he'
              ? 'הקלד שם קבוצה או השאר "שחקן חופשי"...'
              : 'Enter club name or keep "Free Agent"...'
          }
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        />
      )}
    </div>
  );
};
