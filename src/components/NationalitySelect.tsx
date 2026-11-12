import React, { useState, useRef, useEffect } from 'react';
import { COUNTRIES, Country } from '../data/countries';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';
import { Language } from '../types/player';

interface NationalitySelectProps {
  value: string;
  countryCode?: string;
  onChange: (countryName: string, countryCode: string) => void;
  language?: Language;
  label?: string;
  placeholder?: string;
}

export const NationalitySelect: React.FC<NationalitySelectProps> = ({
  value,
  countryCode,
  onChange,
  language = 'en',
  label = 'Nationality',
  placeholder = 'Select or search nationality...'
}) => {
  const isHe = language === 'he';
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries
  const filtered = COUNTRIES.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.hebrewName.includes(q)
    );
  });

  const selectedCountry = COUNTRIES.find(
    c => c.name.toLowerCase() === value?.toLowerCase() || (countryCode && c.code.toUpperCase() === countryCode.toUpperCase())
  );

  const handleSelect = (country: Country) => {
    onChange(country.name, country.code);
    setIsOpen(false);
    setSearch('');
  };

  const handleCustomInput = (customValue: string) => {
    onChange(customValue, countryCode || 'XX');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label} *
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-600 focus:ring-2 focus:ring-emerald-500 transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedCountry ? (
            <>
              <span className="text-base leading-none">{selectedCountry.flag}</span>
              <span className="font-medium">
                {isHe ? selectedCountry.hebrewName : selectedCountry.name}
              </span>
              <span className="text-[11px] text-slate-400 font-mono font-normal">
                ({selectedCountry.code})
              </span>
            </>
          ) : value ? (
            <>
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{value}</span>
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          dir={isHe ? 'rtl' : 'ltr'}
        >
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="relative">
              <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-2.5 ${isHe ? 'right-2.5' : 'left-2.5'}`} />
              <input
                type="text"
                autoFocus
                placeholder={isHe ? 'חיפוש מדינה...' : 'Search nation / code...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                  isHe ? 'pr-8 pl-2' : 'pl-8 pr-2'
                }`}
              />
            </div>
          </div>

          {/* Quick list */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/50">
            {filtered.length > 0 ? (
              filtered.map(c => {
                const isSelected = selectedCountry?.code === c.code || value.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full px-2.5 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">{c.flag}</span>
                      <span>{isHe ? c.hebrewName : c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({c.code})</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  {isHe ? 'מדינה לא נמצאה ברשימה' : 'Nation not in predefined list'}
                </p>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCustomInput(search.trim());
                      setIsOpen(false);
                    }}
                    className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {isHe ? `השתמש ב-"${search.trim()}"` : `Use "${search.trim()}"`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
