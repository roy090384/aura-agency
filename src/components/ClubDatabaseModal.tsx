import React, { useState, useMemo, useRef } from 'react';
import {
  IfaClub,
  ClubCategory,
  parseClubsFromCsvOrText,
  getCategoryLabelHe,
  getCategoryBadgeClasses
} from '../data/ifaClubs';
import {
  X,
  Upload,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ClubDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubs: IfaClub[];
  onSaveClubs: (updated: IfaClub[]) => void;
  onResetDefault: () => void;
}

export const ClubDatabaseModal: React.FC<ClubDatabaseModalProps> = ({
  isOpen,
  onClose,
  clubs,
  onSaveClubs,
  onResetDefault
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState<'ALL' | ClubCategory>('ALL');

  // Manual add state
  const [newClubName, setNewClubName] = useState('');
  const [newClubCategory, setNewClubCategory] = useState<ClubCategory>(2);

  // Import state
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredClubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clubs.filter(c => {
      if (catFilter !== 'ALL' && c.category !== catFilter) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [clubs, searchQuery, catFilter]);

  if (!isOpen) return null;

  const handleAddClub = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClubName.trim();
    if (!trimmed) return;

    const exists = clubs.some(c => c.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setFeedback({ type: 'error', msg: `הקבוצה "${trimmed}" כבר קיימת במאגר.` });
      return;
    }

    const newEntry: IfaClub = {
      id: `ifa-manual-${Date.now()}`,
      name: trimmed,
      category: newClubCategory,
      isDefault: false
    };
    onSaveClubs([newEntry, ...clubs]);
    setNewClubName('');
    setFeedback({ type: 'success', msg: `הקבוצה "${trimmed}" נוספה בהצלחה לקטגוריה ${newClubCategory}.` });
  };

  const handleUpdateClubCategory = (id: string, nextCat: ClubCategory) => {
    const updated = clubs.map(c => (c.id === id ? { ...c, category: nextCat, isDefault: false } : c));
    onSaveClubs(updated);
  };

  const handleDeleteClub = (id: string) => {
    const updated = clubs.filter(c => c.id !== id);
    onSaveClubs(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = typeof ev.target?.result === 'string' ? ev.target.result : '';
      setImportText(content);
      setFeedback({ type: 'success', msg: `נטען תוכן מהקובץ "${file.name}". לחץ על "החל עדכון" לשמירה.` });
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleApplyImport = () => {
    if (!importText.trim()) {
      setFeedback({ type: 'error', msg: 'יש להדביק טקסט או להעלות קובץ CSV לפני השמירה.' });
      return;
    }

    const { clubs: parsed, skippedLines } = parseClubsFromCsvOrText(importText);
    if (parsed.length === 0) {
      setFeedback({
        type: 'error',
        msg: 'לא זוהו שורות תקינות. יש להזין בפורמט: שם קבוצה, קטגוריה (1-4)'
      });
      return;
    }

    if (importMode === 'replace') {
      onSaveClubs(parsed);
    } else {
      const mergedMap = new Map<string, IfaClub>();
      clubs.forEach(c => mergedMap.set(c.name.trim().toLowerCase(), c));
      parsed.forEach(c => mergedMap.set(c.name.trim().toLowerCase(), c));
      onSaveClubs(Array.from(mergedMap.values()));
    }

    setFeedback({
      type: 'success',
      msg: `המאגר עודכן בהצלחה (${parsed.length} קבוצות נקלטו${skippedLines > 0 ? `, ${skippedLines} שורות דולגו` : ''}).`
    });
    setActiveTab('list');
  };

  const handleExportCsv = () => {
    const header = 'שם קבוצה,קטגוריה\n';
    const rows = clubs.map(c => `"${c.name.replace(/"/g, '""')}",${c.category}`).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ifa_clubs_categories_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(clubs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ifa_clubs_categories_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 my-6 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                עדכון רשימת קבוצות שנתית (סיווג ההתאחדות)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ניהול סיווג הקבוצות לקטגוריות 1–4 בדפדפן (כל קבוצה שאינה רשומה מסווגת כקטגוריה 4)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="סגור חלון"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Toolbar Tabs & Export/Reset */}
        <div className="px-6 pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              עריכה וצפייה ברשימה ({clubs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'import'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ייבוא CSV / הדבקת טקסט
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ייצא CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ייצא JSON</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onResetDefault();
                setFeedback({
                  type: 'success',
                  msg: 'הרשימה אופסה לסיווג ההתאחדות הרשמי לעונת 2026/27.'
                });
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>אפס לברירת מחדל 2026/27</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'list' ? (
            <>
              {/* Add single club form */}
              <form
                onSubmit={handleAddClub}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
              >
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    הוספת קבוצה חדשה
                  </label>
                  <input
                    type="text"
                    value={newClubName}
                    onChange={e => setNewClubName(e.target.value)}
                    placeholder="לדוגמה: הפועל רמת השרון"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:w-36">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    קטגוריה
                  </label>
                  <select
                    value={newClubCategory}
                    onChange={e => setNewClubCategory(Number(e.target.value) as ClubCategory)}
                    className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={1}>קטגוריה 1</option>
                    <option value={2}>קטגוריה 2</option>
                    <option value={3}>קטגוריה 3</option>
                    <option value={4}>קטגוריה 4</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>הוסף</span>
                </button>
              </form>

              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="חיפוש קבוצה ברשימה..."
                    className="w-full pr-9 pl-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setCatFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md font-semibold ${
                      catFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    הכל
                  </button>
                  {([1, 2, 3, 4] as ClubCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatFilter(cat)}
                      className={`px-2.5 py-1 rounded-md font-semibold font-mono-tabular ${
                        catFilter === cat
                          ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      ק׳ {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clubs table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs sm:text-sm text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">שם הקבוצה</th>
                      <th className="py-2.5 px-4 font-semibold">קטגוריה נוכחית</th>
                      <th className="py-2.5 px-4 font-semibold text-left">שינוי / הסרה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredClubs.map(club => (
                      <tr
                        key={club.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2 px-4 font-medium text-slate-900 dark:text-white">
                          {club.name}
                          {club.rank && (
                            <span className="mr-2 text-[11px] text-slate-400 font-mono-tabular">
                              #{club.rank}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getCategoryBadgeClasses(
                              club.category
                            )}`}
                          >
                            {getCategoryLabelHe(club.category)}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-left">
                          <div className="inline-flex items-center gap-2">
                            <select
                              value={club.category}
                              onChange={e =>
                                handleUpdateClubCategory(
                                  club.id,
                                  Number(e.target.value) as ClubCategory
                                )
                              }
                              aria-label={`קטגוריה עבור ${club.name}`}
                              className="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            >
                              <option value={1}>קטגוריה 1</option>
                              <option value={2}>קטגוריה 2</option>
                              <option value={3}>קטגוריה 3</option>
                              <option value={4}>קטגוריה 4</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleDeleteClub(club.id)}
                              title="הסר קבוצה"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredClubs.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-xs text-slate-400">
                          לא נמצאו קבוצות התואמות לחיפוש.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Import CSV / Text Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      העלאת קובץ CSV / טקסט או הדבקת רשימה
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      פורמט נדרש בכל שורה: <code className="font-mono-tabular">שם קבוצה, קטגוריה (1-4)</code> (ניתן להדביק ישירות מ-Excel / CSV).
                    </p>
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>בחר קובץ CSV / TXT</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={9}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder={`דוגמה:\nמכבי תל אביב, 1\nמכבי חיפה, 1\nהפועל כפר סבא, 2\nבית"ר נהריה, 3`}
                  className="w-full p-3 text-xs font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="accent-emerald-600"
                      />
                      <span>החלף את כל הרשימה הקיימת</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="accent-emerald-600"
                      />
                      <span>מזג ועדכן על הרשימה הקיימת</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyImport}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                  >
                    החל עדכון ושמור בדפדפן
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
