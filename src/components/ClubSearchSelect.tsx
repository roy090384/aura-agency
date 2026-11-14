import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  IfaClub,
  ClubCategory,
  getCategoryLabelHe,
  getCategoryBadgeClasses,
  lookupClubCategory
} from '../data/ifaClubs';
import { ChevronDown, Search, Building2, Check } from 'lucide-react';

interface ClubSearchSelectProps {
  label: string;
  clubs: IfaClub[];
  clubName: string;
  manualOverride: ClubCategory | null;
  onChangeClub: (clubName: string, detectedCategory: ClubCategory) => void;
  onChangeManualOverride: (override: ClubCategory | null) => void;
  placeholder?: string;
}

export const ClubSearchSelect: React.FC<ClubSearchSelectProps> = ({
  label,
  clubs,
  clubName,
  manualOverride,
  onChangeClub,
  onChangeManualOverride,
  placeholder = 'חפש או הקלד שם קבוצה...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(clubName);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(clubName);
  }, [clubName]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter(c => c.name.toLowerCase().includes(q));
  }, [clubs, query]);

  const detectedCategory = lookupClubCategory(clubName, clubs);
  const effectiveCategory: ClubCategory = manualOverride ?? detectedCategory;

  const handleSelectClub = (club: IfaClub) => {
    setQuery(club.name);
    onChangeClub(club.name, club.category);
    setIsOpen(false);
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    setIsOpen(true);
    const cat = lookupClubCategory(val, clubs);
    onChangeClub(val, cat);
  };

  return (
    <div ref={containerRef} className="space-y-2 relative" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{label}</span>
        </label>

        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${getCategoryBadgeClasses(
            effectiveCategory
          )}`}
        >
          {getCategoryLabelHe(effectiveCategory)}
          {manualOverride !== null ? ' (ידני)' : ''}
        </span>
      </div>

      {/* Searchable Combobox Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pr-9 pl-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors"
        />
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          aria-label="פתח רשימת קבוצות"
          className="absolute left-2 top-1.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown List */}
        {isOpen && (
          <div className="absolute z-40 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg divide-y divide-slate-100 dark:divide-slate-800">
            {filteredClubs.length > 0 ? (
              filteredClubs.map(club => {
                const isSelected = club.name === clubName;
                return (
                  <button
                    key={club.id}
                    type="button"
                    onClick={() => handleSelectClub(club)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-right text-xs transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span className="truncate">{club.name}</span>
                      {club.rank && (
                        <span className="text-[10px] text-slate-400 font-mono-tabular shrink-0">
                          #{club.rank}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${getCategoryBadgeClasses(
                        club.category
                      )}`}
                    >
                      {getCategoryLabelHe(club.category)}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  הקבוצה "{query}" אינה מופיעה בקטגוריות 1–3
                </div>
                <div>
                  על פי תקנון ההתאחדות, כל קבוצה שאינה רשומה ברשימה מסווגת אוטומטית כ
                  <strong className="text-slate-800 dark:text-white">קטגוריה 4</strong>.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Category Override Control */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>עקיפת קטגוריה ידנית:</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChangeManualOverride(null)}
            className={`px-2 py-0.5 rounded border text-[11px] font-medium transition-colors ${
              manualOverride === null
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            אוטומטי ({detectedCategory})
          </button>
          {([1, 2, 3, 4] as ClubCategory[]).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => onChangeManualOverride(cat)}
              className={`px-2 py-0.5 rounded border text-[11px] font-bold font-mono-tabular transition-colors ${
                manualOverride === cat
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
