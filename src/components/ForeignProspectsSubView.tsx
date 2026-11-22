import React, { useState, useMemo } from 'react';
import {
  ForeignProspect,
  ForeignNegotiationStatus,
  ClubOfferStatus,
  Language
} from '../types/player';
import { POSITION_TRANSLATIONS, MALE_POSITION_TRANSLATIONS } from '../translations/translations';
import {
  TARGET_MARKET_OPTIONS,
  FOREIGN_STATUS_OPTIONS,
  OFFER_STATUS_OPTIONS
} from './ForeignProspectModal';
import {
  Globe,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Building2,
  Banknote,
  LayoutGrid,
  List,
  ShieldCheck
} from 'lucide-react';

interface ForeignProspectsSubViewProps {
  foreignProspects: ForeignProspect[];
  onOpenAdd: () => void;
  onEdit: (prospect: ForeignProspect) => void;
  onUpdateProspect: (updated: ForeignProspect) => void;
  onRequestDelete: (prospect: ForeignProspect) => void;
  language: Language;
}

const getOfferStatusBadgeClass = (status: ClubOfferStatus) => {
  switch (status) {
    case 'Interested':
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'Reviewing':
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'Declined':
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    case 'Sent':
    default:
      return 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800';
  }
};

const getNegotiationBadgeClass = (status: ForeignNegotiationStatus) => {
  switch (status) {
    case 'Signed with Agency':
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'Offered to Clubs':
      return 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800';
    case 'Representation Mandate Sent':
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
};

export const ForeignProspectsSubView: React.FC<ForeignProspectsSubViewProps> = ({
  foreignProspects,
  onOpenAdd,
  onEdit,
  onUpdateProspect,
  onRequestDelete,
  language
}) => {
  const isHe = language === 'he';

  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [offeredClubFilter, setOfferedClubFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Distinct clubs offered across all foreign prospects for filtering
  const allOfferedClubs = useMemo(() => {
    const set = new Set<string>();
    foreignProspects.forEach(p => {
      (p.clubsOfferedTo || []).forEach(c => {
        if (c.clubName.trim()) set.add(c.clubName.trim());
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [foreignProspects]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return foreignProspects.filter(p => {
      if (marketFilter !== 'ALL' && !(p.targetMarkets || []).includes(marketFilter as any)) {
        return false;
      }
      if (statusFilter !== 'ALL' && p.negotiationStatus !== statusFilter) {
        return false;
      }
      if (
        offeredClubFilter !== 'ALL' &&
        !(p.clubsOfferedTo || []).some(c => c.clubName.trim() === offeredClubFilter)
      ) {
        return false;
      }
      if (q) {
        const offeredStr = (p.clubsOfferedTo || []).map(c => c.clubName).join(' ').toLowerCase();
        const match =
          p.fullName.toLowerCase().includes(q) ||
          p.nationalityPassport.toLowerCase().includes(q) ||
          (p.passportCategory || '').toLowerCase().includes(q) ||
          p.currentClub.toLowerCase().includes(q) ||
          p.currentLeague.toLowerCase().includes(q) ||
          p.primaryPosition.toLowerCase().includes(q) ||
          (p.secondaryPosition || '').toLowerCase().includes(q) ||
          offeredStr.includes(q) ||
          (p.agentNotes || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [foreignProspects, searchQuery, marketFilter, statusFilter, offeredClubFilter]);

  // Metrics
  const signedOrMandateCount = foreignProspects.filter(
    p =>
      p.negotiationStatus === 'Signed with Agency' ||
      p.negotiationStatus === 'Representation Mandate Sent' ||
      p.negotiationStatus === 'Offered to Clubs'
  ).length;
  const totalPitches = foreignProspects.reduce(
    (sum, p) => sum + (p.clubsOfferedTo?.length || 0),
    0
  );
  const interestedCount = foreignProspects.reduce(
    (sum, p) =>
      sum + (p.clubsOfferedTo || []).filter(o => o.status === 'Interested').length,
    0
  );

  const handleQuickOfferStatusChange = (
    prospect: ForeignProspect,
    offerId: string,
    nextStatus: ClubOfferStatus
  ) => {
    const updatedOffers = (prospect.clubsOfferedTo || []).map(o =>
      o.id === offerId ? { ...o, status: nextStatus } : o
    );
    onUpdateProspect({
      ...prospect,
      clubsOfferedTo: updatedOffers,
      updatedAt: new Date().toISOString().split('T')[0]
    });
  };

  const handleQuickNegotiationStatusChange = (
    prospect: ForeignProspect,
    nextStatus: ForeignNegotiationStatus
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const statusChanged = nextStatus !== prospect.negotiationStatus;
    onUpdateProspect({
      ...prospect,
      negotiationStatus: nextStatus,
      updatedAt: today,
      statusUpdatedAt: statusChanged
        ? today
        : prospect.statusUpdatedAt || prospect.updatedAt || prospect.createdAt
    });
  };

  const getMarketLabel = (val: string) => {
    const found = TARGET_MARKET_OPTIONS.find(m => m.value === val);
    return found ? (isHe ? found.he : found.en) : val;
  };

  const getStatusLabel = (val: ForeignNegotiationStatus) => {
    const found = FOREIGN_STATUS_OPTIONS.find(s => s.value === val);
    return found ? (isHe ? found.he : found.en) : val;
  };

  const getOfferStatusLabel = (val: ClubOfferStatus) => {
    const found = OFFER_STATUS_OPTIONS.find(o => o.value === val);
    return found ? (isHe ? found.he : found.en) : val;
  };

  return (
    <div className="space-y-5">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {isHe ? 'שחקניות זרות במעקב' : 'Foreign Prospects'}
          </div>
          <div className="text-2xl font-extrabold font-mono-tabular text-slate-900 dark:text-white mt-1">
            {foreignProspects.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {isHe ? 'חתומות / במנדט / מוצעות' : 'Signed / Mandate / Offered'}
          </div>
          <div className="text-2xl font-extrabold font-mono-tabular text-emerald-700 dark:text-emerald-400 mt-1">
            {signedOrMandateCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {isHe ? 'סה״כ הצעות לקבוצות' : 'Total Club Pitches'}
          </div>
          <div className="text-2xl font-extrabold font-mono-tabular text-sky-700 dark:text-sky-400 mt-1">
            {totalPitches}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {isHe ? 'התעניינות מקבוצות' : 'Interested Club Responses'}
          </div>
          <div className="text-2xl font-extrabold font-mono-tabular text-amber-600 dark:text-amber-400 mt-1">
            {interestedCount}
          </div>
        </div>
      </div>

      {/* Filter & View Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                isHe
                  ? 'חיפוש לפי שם, דרכון/לאום, קבוצה, עמדה או קבוצה מוצעת...'
                  : 'Search name, passport/nationality, club, position, offered club...'
              }
              className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isHe ? 'כרטיסים' : 'Cards'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>{isHe ? 'טבלה' : 'Table'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isHe ? 'הוסף שחקנית זרה' : 'Add Foreign Prospect'}</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">
              {isHe ? 'שוק יעד:' : 'Target Market:'}
            </span>
            <select
              value={marketFilter}
              onChange={e => setMarketFilter(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">{isHe ? 'כל השווקים' : 'All Markets'}</option>
              {TARGET_MARKET_OPTIONS.map(m => (
                <option key={m.value} value={m.value}>
                  {isHe ? m.he : m.en}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">
              {isHe ? 'סטטוס מו״מ:' : 'Status:'}
            </span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">{isHe ? 'כל הסטטוסים' : 'All Statuses'}</option>
              {FOREIGN_STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>
                  {isHe ? s.he : s.en}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">
              {isHe ? 'הוצעה לקבוצה:' : 'Offered Club:'}
            </span>
            <select
              value={offeredClubFilter}
              onChange={e => setOfferedClubFilter(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium max-w-[200px]"
            >
              <option value="ALL">{isHe ? 'כל הקבוצות' : 'All Offered Clubs'}</option>
              {allOfferedClubs.map(club => (
                <option key={club} value={club}>
                  {club}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Empty State or Content */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Globe className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            {foreignProspects.length === 0
              ? isHe
                ? 'אין עדיין שחקניות זרות במעקב'
                : 'No international / foreign prospects yet'
              : isHe
              ? 'לא נמצאו תוצאות התואמות לסינון'
              : 'No matching foreign prospects found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            {isHe
              ? 'הוסף שחקניות זרות שמועמדות לייצוג בסוכנות ותעד לאילו קבוצות בישראל ובאירופה הן הוצעו.'
              : 'Add non-Israeli female players in talks with the agency and track club placement offers across Israel and Europe.'}
          </p>
          {foreignProspects.length === 0 ? (
            <button
              type="button"
              onClick={onOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>{isHe ? 'הוסף שחקנית זרה ראשונה' : 'Add First Foreign Prospect'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setMarketFilter('ALL');
                setStatusFilter('ALL');
                setOfferedClubFilter('ALL');
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              {isHe ? 'אפס סינון' : 'Reset Filters'}
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* FILTERABLE TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">{isHe ? 'שחקנית' : 'Player'}</th>
                  <th className="py-3 px-4 font-semibold">{isHe ? 'אזרחות / דרכון' : 'Passport'}</th>
                  <th className="py-3 px-4 font-semibold">{isHe ? 'עמדות' : 'Positions'}</th>
                  <th className="py-3 px-4 font-semibold">{isHe ? 'קבוצה וליגה' : 'Current Club'}</th>
                  <th className="py-3 px-4 font-semibold">{isHe ? 'שוק יעד' : 'Target Market'}</th>
                  <th className="py-3 px-4 font-semibold">{isHe ? 'סטטוס מו״מ' : 'Status'}</th>
                  <th className="py-3 px-4 font-semibold">{isHe ? 'הוצעה לקבוצות' : 'Clubs Offered To'}</th>
                  <th className="py-3 px-4 font-semibold text-right rtl:text-left">{isHe ? 'פעולות' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(p => {
                  const isMale = p.gender === 'Male';
                  const posMap = isMale ? MALE_POSITION_TRANSLATIONS : POSITION_TRANSLATIONS;
                  return (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">{p.fullName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isMale ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {isMale ? (isHe ? 'גברים' : 'Male') : (isHe ? 'נשים' : 'Female')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-tabular">
                        {p.age} {isHe ? 'שנים' : 'yrs'}
                        {p.salaryExpectations ? ` · ${p.salaryExpectations}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {p.nationalityPassport}
                      </div>
                      {p.passportCategory && (
                        <div className="text-[11px] text-slate-500">{p.passportCategory}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {posMap[language][p.primaryPosition as keyof typeof POSITION_TRANSLATIONS['en']] || p.primaryPosition}
                      </div>
                      {p.secondaryPosition && (
                        <div className="text-[11px] text-slate-500">
                          {posMap[language][p.secondaryPosition as keyof typeof POSITION_TRANSLATIONS['en']] || p.secondaryPosition}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{p.currentClub}</div>
                      <div className="text-[11px] text-slate-500">{p.currentLeague}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {(p.targetMarkets || []).map(getMarketLabel).join(' · ')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={p.negotiationStatus}
                        onChange={e =>
                          handleQuickNegotiationStatusChange(
                            p,
                            e.target.value as ForeignNegotiationStatus
                          )
                        }
                        className={`px-2 py-1 text-[11px] font-semibold rounded border ${getNegotiationBadgeClass(
                          p.negotiationStatus
                        )}`}
                      >
                        {FOREIGN_STATUS_OPTIONS.map(s => (
                          <option key={s.value} value={s.value}>
                            {isHe ? s.he : s.en}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {(p.clubsOfferedTo || []).length > 0 ? (
                        <div className="space-y-1">
                          {p.clubsOfferedTo.map(o => (
                            <div key={o.id} className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                                {o.clubName}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded border text-[10px] font-bold shrink-0 ${getOfferStatusBadgeClass(
                                  o.status
                                )}`}
                              >
                                {getOfferStatusLabel(o.status)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {isHe ? 'טרם הוצעה' : 'None yet'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right rtl:text-left whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {p.profileLink && (
                          <a
                            href={p.profileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-md"
                            title={isHe ? 'פתח קישור וידאו / פרופיל' : 'Open Video / Profile Link'}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          title={isHe ? 'ערוך' : 'Edit'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(p)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title={isHe ? 'מחק' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DETAILED CARDS VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(p => {
            const isMale = p.gender === 'Male';
            const posMap = isMale ? MALE_POSITION_TRANSLATIONS : POSITION_TRANSLATIONS;
            return (
            <div
              key={p.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="space-y-3.5">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {p.fullName}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isMale ? 'bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200' : 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200'
                      }`}>
                        {isMale ? (isHe ? 'גברים' : 'Male') : (isHe ? 'נשים' : 'Female')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {p.nationalityPassport}
                      </span>
                      {p.passportCategory && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{p.passportCategory}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {p.age} {isHe ? 'שנים' : 'yrs'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Inline Status Selector */}
                  <select
                    value={p.negotiationStatus}
                    onChange={e =>
                      handleQuickNegotiationStatusChange(
                        p,
                        e.target.value as ForeignNegotiationStatus
                      )
                    }
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md border shrink-0 ${getNegotiationBadgeClass(
                      p.negotiationStatus
                    )}`}
                  >
                    {FOREIGN_STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>
                        {isHe ? s.he : s.en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      {isHe ? 'עמדה ראשית / משנית' : 'Positions'}
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {posMap[language][p.primaryPosition as keyof typeof POSITION_TRANSLATIONS['en']] || p.primaryPosition}
                    </strong>
                    {p.secondaryPosition && (
                      <span className="text-[11px] text-slate-500 block">
                        + {posMap[language][p.secondaryPosition as keyof typeof POSITION_TRANSLATIONS['en']] || p.secondaryPosition}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      {isHe ? 'קבוצה וליגה נוכחית/אחרונה' : 'Current / Last Club'}
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200 block">
                      {p.currentClub}
                    </strong>
                    <span className="text-[11px] text-slate-500">{p.currentLeague}</span>
                  </div>

                  <div className="col-span-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">{isHe ? 'שווקי יעד: ' : 'Target Market: '}</span>
                      <span className="text-slate-900 dark:text-white font-semibold">
                        {(p.targetMarkets || []).map(getMarketLabel).join(' · ')}
                      </span>
                    </div>

                    {p.salaryExpectations && (
                      <div className="text-[11px] font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Banknote className="w-3.5 h-3.5" />
                        <span>{p.salaryExpectations}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clubs Offered To (מעקב הצעות לקבוצות) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>
                        {isHe ? 'מעקב הצעות לקבוצות' : 'Clubs Offered To'} (
                        {p.clubsOfferedTo?.length || 0})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      + {isHe ? 'עדכן / הוסף הצעה' : 'Log / Edit Offers'}
                    </button>
                  </div>

                  {(p.clubsOfferedTo || []).length > 0 ? (
                    <div className="space-y-1.5">
                      {p.clubsOfferedTo.map(offer => (
                        <div
                          key={offer.id}
                          className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                              {offer.clubName}
                            </span>
                            {offer.notes && (
                              <span className="text-[11px] text-slate-500 block truncate">
                                {offer.notes}
                              </span>
                            )}
                          </div>

                          <select
                            value={offer.status}
                            onChange={e =>
                              handleQuickOfferStatusChange(
                                p,
                                offer.id,
                                e.target.value as ClubOfferStatus
                              )
                            }
                            className={`px-2 py-0.5 text-[11px] font-bold rounded border shrink-0 ${getOfferStatusBadgeClass(
                              offer.status
                            )}`}
                          >
                            {OFFER_STATUS_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>
                                {isHe ? o.he : o.en}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic px-1">
                      {isHe
                        ? 'טרם נשלחו הצעות לקבוצות.'
                        : 'No club pitches logged yet.'}
                    </div>
                  )}
                </div>

                {/* Agent Notes */}
                {p.agentNotes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed">
                    {p.agentNotes}
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  {p.profileLink ? (
                    <a
                      href={p.profileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>
                        {isHe ? 'וידאו / Transfermarkt / Soccerway' : 'Video / Profile Link'}
                      </span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      {isHe ? 'ללא קישור פרופיל' : 'No external link'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{isHe ? 'ערוך' : 'Edit'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestDelete(p)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title={isHe ? 'מחק מועמדת' : 'Delete Prospect'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
