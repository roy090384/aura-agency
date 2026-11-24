import React, { useState, useMemo } from 'react';
import { TalkProspect, ForeignProspect, ProspectScope, TalkStage, YouthCategory, Language, Currency } from '../types/player';
import { ForeignProspectsSubView } from './ForeignProspectsSubView';
import { 
  TRANSLATIONS, 
  POSITION_TRANSLATIONS, 
  MALE_POSITION_TRANSLATIONS,
  getYouthBadgeColor 
} from '../translations/translations';
import { formatSalary } from '../utils/currency';
import { 
  Globe, 
  MapPin, 
  Play, 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  UserCheck, 
  Sparkles, 
  Video, 
  Calendar, 
  Phone, 
  FileText, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Columns3,
  LayoutGrid,
  TrendingUp,
  Award,
  Edit,
  Trash2,
  CheckCircle2,
  Tag
} from 'lucide-react';

interface InTalkWithViewProps {
  prospects: TalkProspect[];
  foreignProspects: ForeignProspect[];
  onOpenAddProspect: () => void;
  onEditProspect: (prospect: TalkProspect) => void;
  onRequestDeleteProspect: (prospect: TalkProspect) => void;
  onWatchVideo: (prospect: TalkProspect) => void;
  onOpenConversationLog: (prospect: TalkProspect) => void;
  onSignProspectToRoster: (prospect: TalkProspect) => void;
  onUpdateProspectStage?: (prospect: TalkProspect, nextStage: TalkStage) => void;
  onOpenAddForeignProspect: () => void;
  onEditForeignProspect: (prospect: ForeignProspect) => void;
  onUpdateForeignProspect: (prospect: ForeignProspect) => void;
  onRequestDeleteForeignProspect: (prospect: ForeignProspect) => void;
  subTab?: 'candidates' | 'foreign';
  onSubTabChange?: (tab: 'candidates' | 'foreign') => void;
  language: Language;
  currency: Currency;
}

export const InTalkWithView: React.FC<InTalkWithViewProps> = ({
  prospects,
  foreignProspects,
  onOpenAddProspect,
  onEditProspect,
  onRequestDeleteProspect,
  onWatchVideo,
  onOpenConversationLog,
  onSignProspectToRoster,
  onUpdateProspectStage,
  onOpenAddForeignProspect,
  onEditForeignProspect,
  onUpdateForeignProspect,
  onRequestDeleteForeignProspect,
  subTab,
  onSubTabChange,
  language,
  currency
}) => {
  const t = TRANSLATIONS[language];
  const isHe = language === 'he';
  const [internalSubTab, setInternalSubTab] = useState<'candidates' | 'foreign'>('candidates');
  const inTalkSubTab = subTab ?? internalSubTab;
  const setInTalkSubTab = (tab: 'candidates' | 'foreign') => {
    setInternalSubTab(tab);
    onSubTabChange?.(tab);
  };
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'Local' | 'International'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Female' | 'Male'>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [youthFilter, setYouthFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'cards' | 'stages'>('stages');
  const [draggedProspectId, setDraggedProspectId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<TalkStage | null>(null);

  // Counts
  const localCount = prospects.filter(p => p.scope === 'Local').length;
  const intlCount = prospects.filter(p => p.scope === 'International').length;
  const femaleCount = prospects.filter(p => (p.gender || 'Female') === 'Female').length;
  const maleCount = prospects.filter(p => p.gender === 'Male').length;

  const stages: TalkStage[] = [
    'Initial Contact',
    'Scouting & Video',
    'Meeting Scheduled',
    'Offer Proposed',
    'Contract Drafting',
    'Signed'
  ];

  const STAGE_ACCENTS: Record<TalkStage, { bar: string; labelHe: string }> = {
    'Initial Contact': { bar: 'bg-slate-400 dark:bg-slate-500', labelHe: 'פנייה ראשונית' },
    'Scouting & Video': { bar: 'bg-sky-500', labelHe: 'סקאוטינג ווידאו' },
    'Meeting Scheduled': { bar: 'bg-indigo-500', labelHe: 'פגישה מתוכננת' },
    'Offer Proposed': { bar: 'bg-amber-500', labelHe: 'הצעה הוגשה' },
    'Contract Drafting': { bar: 'bg-gold-500', labelHe: 'טיוטת חוזה' },
    'Signed': { bar: 'bg-emerald-500', labelHe: 'הוחתם בסוכנות' },
    'Declined': { bar: 'bg-rose-500', labelHe: 'נדחה / בוטל' }
  };

  // Filtered prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      // Gender
      if (genderFilter !== 'ALL' && (p.gender || 'Female') !== genderFilter) return false;
      // Scope
      if (scopeFilter !== 'ALL' && p.scope !== scopeFilter) return false;
      // Stage
      if (stageFilter !== 'ALL' && p.talkStage !== stageFilter) return false;
      // Priority
      if (priorityFilter !== 'ALL' && p.priority !== priorityFilter) return false;
      // Youth Category (U14, U15, U16, U17, U19, Senior)
      if (youthFilter !== 'ALL' && (p.youthCategory || 'Senior') !== youthFilter) return false;
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const match = 
          p.name.toLowerCase().includes(q) ||
          p.currentClub.toLowerCase().includes(q) ||
          p.nationality.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q) ||
          p.assignedAgent.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [prospects, genderFilter, scopeFilter, stageFilter, priorityFilter, youthFilter, searchQuery]);

  return (
    <div className="space-y-6">

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.talkTitle}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
              {t.liveNegotiations}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.talkSubtitle}
          </p>
        </div>

        <button
          onClick={inTalkSubTab === 'foreign' ? onOpenAddForeignProspect : onOpenAddProspect}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>
            {inTalkSubTab === 'foreign'
              ? (language === 'he' ? 'הוסף שחקנית זרה' : 'Add Foreign Prospect')
              : t.addTalkProspect}
          </span>
        </button>
      </div>

      {/* Sub-Screen Switcher: Agency Candidates vs International / Foreign Female Prospects */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs w-fit">
        <button
          type="button"
          onClick={() => setInTalkSubTab('candidates')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            inTalkSubTab === 'candidates'
              ? 'bg-emerald-700 text-white shadow-xs dark:bg-emerald-600'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{language === 'he' ? 'מועמדות לייצוג בסוכנות' : 'Agency Candidates'}</span>
          <span className={`px-1.5 py-0.5 text-[11px] rounded-full font-mono-tabular ${
            inTalkSubTab === 'candidates'
              ? 'bg-emerald-800/60 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            {prospects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setInTalkSubTab('foreign')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            inTalkSubTab === 'foreign'
              ? 'bg-sky-700 text-white shadow-xs dark:bg-sky-600'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{language === 'he' ? 'שחקניות זרות ובינלאומיות (ישראל / אירופה)' : 'International / Foreign Prospects'}</span>
          <span className={`px-1.5 py-0.5 text-[11px] rounded-full font-mono-tabular ${
            inTalkSubTab === 'foreign'
              ? 'bg-sky-800/60 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            {foreignProspects.length}
          </span>
        </button>
      </div>

      {inTalkSubTab === 'foreign' ? (
        <ForeignProspectsSubView
          foreignProspects={foreignProspects}
          onOpenAdd={onOpenAddForeignProspect}
          onEdit={onEditForeignProspect}
          onUpdateProspect={onUpdateForeignProspect}
          onRequestDelete={onRequestDeleteForeignProspect}
          language={language}
        />
      ) : (
        <>
      {/* Scope Segmented Filter & Controls */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Local vs International Filter Tabs (Functional segmented button control) */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setScopeFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                scopeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.allTalks} ({prospects.length})
            </button>
            <button
              onClick={() => setScopeFilter('Local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                scopeFilter === 'Local'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t.localProspects} ({localCount})</span>
            </button>
            <button
              onClick={() => setScopeFilter('International')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                scopeFilter === 'International'
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.internationalTargets} ({intlCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Secondary filters: Gender, Youth Category, Stage and Priority */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Gender Filter Pill */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
              <button
                type="button"
                onClick={() => setGenderFilter('ALL')}
                className={`px-2 py-1 text-[11px] font-semibold rounded transition-all ${
                  genderFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'he' ? `הכל (${prospects.length})` : `All (${prospects.length})`}
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('Female')}
                className={`px-2 py-1 text-[11px] font-semibold rounded transition-all ${
                  genderFilter === 'Female'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'he' ? `נשים (${femaleCount})` : `Female (${femaleCount})`}
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('Male')}
                className={`px-2 py-1 text-[11px] font-semibold rounded transition-all ${
                  genderFilter === 'Male'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'he' ? `גברים (${maleCount})` : `Male (${maleCount})`}
              </button>
            </div>

            {/* Youth Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">{t.youthCategory}:</span>
              <select
                value={youthFilter}
                onChange={e => setYouthFilter(e.target.value)}
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="ALL">{t.allAges}</option>
                <option value="Senior">{t.senior}</option>
                <option value="U19">{t.u19}</option>
                <option value="U17">{t.u17}</option>
                <option value="U16">{t.u16}</option>
                <option value="U15">{t.u15}</option>
                <option value="U14">{t.u14}</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">{t.stageLabel}</span>
              <select
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ALL">{t.allStages}</option>
                {stages.map(st => (
                  <option key={st} value={st}>
                    {st === 'Signed' ? t.signToAgency : st}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">{t.priorityLabel}</span>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ALL">{t.allPriorities}</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveView('stages')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeView === 'stages'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>{isHe ? 'לוח קנבן' : 'Pipeline Board'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeView === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t.detailedCards}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      {filteredProspects.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            {language === 'he' ? 'לא נמצאו מועמדות לייצוג בסוכנות' : 'No agency candidates found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {language === 'he'
              ? 'נסה לאפס את המסננים או הוסף מועמדת חדשה לייצוג בסוכנות.'
              : 'Try resetting your filters or add a new candidate being considered for agency representation.'}
          </p>
          <button
            onClick={() => {
              setGenderFilter('ALL');
              setScopeFilter('ALL');
              setStageFilter('ALL');
              setPriorityFilter('ALL');
              setYouthFilter('ALL');
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            {language === 'he' ? 'אפס סינון' : 'Reset Filters'}
          </button>
        </div>
      ) : activeView === 'stages' ? (
        /* INTERACTIVE CRM KANBAN DEAL BOARD */
        <div className="space-y-3">
          {/* Compact Pipeline Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                {isHe ? 'מגעים פעילים:' : 'Active Deals:'}{' '}
                <strong className="text-slate-900 dark:text-white font-mono tabular-nums">
                  {filteredProspects.length}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isHe ? 'עדיפות גבוהה:' : 'High Priority:'}{' '}
                <strong className="text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                  {filteredProspects.filter(p => p.priority === 'High').length}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isHe ? 'הצעות וחוזים:' : 'Offers & Drafting:'}{' '}
                <strong className="text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                  {filteredProspects.filter(p => p.talkStage === 'Offer Proposed' || p.talkStage === 'Contract Drafting').length}
                </strong>
              </span>
            </div>

            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {isHe
                ? 'גרור כרטיסים בין העמודות או לחץ על חצי השלבים להעברה מהירה'
                : 'Drag deals between columns or use step arrows to advance stages'}
            </span>
          </div>

          {/* Horizontal Scrollable Kanban Swimlanes */}
          <div className="overflow-x-auto pb-3 -mx-1 px-1">
            <div className="flex items-stretch gap-3 min-w-[1480px]">
              {stages.map((st, stageIdx) => {
                const inThisStage = filteredProspects.filter(p => p.talkStage === st);
                const stageDisplay = st === 'Signed' ? t.signToAgency : st;
                const isDropTarget = dragOverStage === st;
                const isSignStage = st === 'Signed';
                const accent = STAGE_ACCENTS[st];

                const moveCardToStage = (prospect: TalkProspect, target: TalkStage) => {
                  if (onUpdateProspectStage) {
                    onUpdateProspectStage(prospect, target);
                  } else if (target === 'Signed') {
                    onSignProspectToRoster(prospect);
                  }
                };

                return (
                  <div
                    key={st}
                    onDragOver={e => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverStage !== st) setDragOverStage(st);
                    }}
                    onDragLeave={e => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverStage(null);
                      }
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      setDragOverStage(null);
                      const prospectId = e.dataTransfer.getData('text/plain') || draggedProspectId;
                      setDraggedProspectId(null);
                      if (!prospectId) return;
                      const dropped = prospects.find(p => p.id === prospectId);
                      if (!dropped || dropped.talkStage === st) return;
                      moveCardToStage(dropped, st);
                    }}
                    className={`flex-1 min-w-[242px] rounded-xl border transition-all flex flex-col min-h-[420px] overflow-hidden ${
                      isDropTarget
                        ? isSignStage
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-slate-100/90 dark:bg-slate-800/70 border-slate-400 dark:border-slate-500 ring-2 ring-slate-400/20'
                        : isSignStage
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-900/50'
                        : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Top 2px Stage Hairline */}
                    <div className={`h-0.5 w-full ${accent.bar}`} />

                    {/* Column Header */}
                    <div className="px-3.5 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                            0{stageIdx + 1}
                          </span>
                          <span
                            className={`text-xs font-bold truncate ${
                              isSignStage
                                ? 'text-emerald-800 dark:text-emerald-300'
                                : 'text-slate-900 dark:text-white'
                            }`}
                            title={stageDisplay}
                          >
                            {isHe ? accent.labelHe : stageDisplay}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 shrink-0">
                        {inThisStage.length}
                      </span>
                    </div>

                    {/* Deal Cards List */}
                    <div className="p-2.5 space-y-2.5 flex-1">
                      {inThisStage.map(prospect => {
                        const youthCat = prospect.youthCategory || 'Senior';
                        const hasVideo = Boolean(prospect.videoUrl && prospect.videoUrl.trim().length > 0);
                        const isMaleProspect = prospect.gender === 'Male';
                        const posMap = isMaleProspect ? MALE_POSITION_TRANSLATIONS : POSITION_TRANSLATIONS;
                        const latestConvo = prospect.conversationHistory[prospect.conversationHistory.length - 1];
                        const isDraggingThis = draggedProspectId === prospect.id;
                        const prevStage = stageIdx > 0 ? stages[stageIdx - 1] : null;
                        const nextStage = stageIdx < stages.length - 1 ? stages[stageIdx + 1] : null;
                        const initials = prospect.name
                          .split(' ')
                          .map(part => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase();

                        return (
                          <div
                            key={prospect.id}
                            draggable
                            onDragStart={e => {
                              setDraggedProspectId(prospect.id);
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', prospect.id);
                            }}
                            onDragEnd={() => {
                              setDraggedProspectId(null);
                              setDragOverStage(null);
                            }}
                            className={`group rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing space-y-2.5 ${
                              isDraggingThis ? 'opacity-45 scale-[0.98]' : ''
                            }`}
                          >
                            {/* Row 1: Avatar + Name + Priority + Grip */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {prospect.photoUrl ? (
                                  <img
                                    src={prospect.photoUrl}
                                    alt={prospect.name}
                                    referrerPolicy="no-referrer"
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center shrink-0">
                                    {initials}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => onEditProspect(prospect)}
                                    className="text-left rtl:text-right text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 truncate block w-full transition-colors"
                                  >
                                    {prospect.name}
                                  </button>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {prospect.currentClub || (isHe ? 'ללא מועדון' : 'Free Agent')}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span
                                  className={`text-[10px] font-bold ${
                                    prospect.priority === 'High'
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : prospect.priority === 'Medium'
                                      ? 'text-slate-500 dark:text-slate-400'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                >
                                  {prospect.priority}
                                </span>
                                <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                              </div>
                            </div>

                            {/* Row 2: Unboxed Clean Typographic Metadata */}
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-snug">
                              <span>{posMap[language][prospect.position] || prospect.position}</span>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="font-mono tabular-nums">
                                {prospect.age} {isHe ? 'ש׳' : 'y/o'}
                              </span>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                              <span className={isMaleProspect ? 'text-sky-700 dark:text-sky-400 font-medium' : 'text-rose-700 dark:text-rose-400 font-medium'}>
                                {isMaleProspect ? (isHe ? 'גברים' : 'Male') : isHe ? 'נשים' : 'Female'}
                              </span>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                              <span>{youthCat}</span>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                              <span>{prospect.scope}</span>
                            </div>

                            {/* Target Salary (when available) */}
                            {prospect.targetSalaryAmount && prospect.targetSalaryAmount > 0 && (
                              <div className="text-[11px] font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                                {isHe ? 'יעד שכר:' : 'Target:'}{' '}
                                {formatSalary(
                                  prospect.targetSalaryAmount,
                                  prospect.targetSalaryCurrency || currency,
                                  currency,
                                  prospect.targetSalaryPeriod || 'Monthly',
                                  language
                                )}
                              </div>
                            )}

                            {/* Latest Touch & Next Action */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] space-y-1">
                              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
                                <button
                                  type="button"
                                  onClick={() => onOpenConversationLog(prospect)}
                                  className="inline-flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium truncate"
                                >
                                  <MessageSquare className="w-3 h-3 shrink-0" />
                                  <span className="truncate">
                                    {latestConvo
                                      ? `${latestConvo.channel} · ${latestConvo.date}`
                                      : isHe
                                      ? 'אין תיעוד שיחה'
                                      : 'No talks logged'}
                                  </span>
                                </button>
                                <span className="font-mono tabular-nums text-[10px] text-slate-400 shrink-0">
                                  ({prospect.conversationHistory.length})
                                </span>
                              </div>

                              {latestConvo?.nextAction && (
                                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium truncate">
                                  {t.nextAction} {latestConvo.nextAction}
                                </div>
                              )}
                            </div>

                            {/* Footer Controls & 1-Click Stage Stepper */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1">
                                {hasVideo && (
                                  <button
                                    type="button"
                                    onClick={() => onWatchVideo(prospect)}
                                    title={t.watchReel}
                                    className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onEditProspect(prospect)}
                                  title={isHe ? 'ערוך מועמד' : 'Edit Candidate'}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRequestDeleteProspect(prospect)}
                                  title={isHe ? 'מחק מועמד' : 'Delete Candidate'}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Stage Move Controls */}
                              <div className="flex items-center gap-1">
                                {prevStage && (
                                  <button
                                    type="button"
                                    title={`${isHe ? 'החזר ל' : 'Move back to'} ${prevStage}`}
                                    onClick={() => moveCardToStage(prospect, prevStage)}
                                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                                  </button>
                                )}

                                {nextStage ? (
                                  <button
                                    type="button"
                                    onClick={() => moveCardToStage(prospect, nextStage)}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-colors ${
                                      nextStage === 'Signed'
                                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                                    }`}
                                    title={`${isHe ? 'העבר לשלב' : 'Advance to'} ${nextStage}`}
                                  >
                                    <span>
                                      {nextStage === 'Signed'
                                        ? isHe
                                          ? 'החתם'
                                          : 'Sign'
                                        : isHe
                                        ? 'קדם'
                                        : 'Advance'}
                                    </span>
                                    <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onSignProspectToRoster(prospect)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                                  >
                                    <UserCheck className="w-3 h-3" />
                                    <span>{t.signToAgency}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {inThisStage.length === 0 && (
                        <div
                          className={`h-28 rounded-lg border border-dashed flex items-center justify-center text-center px-3 text-[11px] transition-colors ${
                            isDropTarget
                              ? 'border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {isSignStage
                            ? isHe
                              ? 'גרור לכאן כדי להחתים ולהעביר לסגל'
                              : 'Drop here to sign into agency roster'
                            : isHe
                            ? 'גרור מועמד/ת לכאן'
                            : 'Drop candidate here'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* DETAILED CARDS VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProspects.map(prospect => {
            const latestConvo = prospect.conversationHistory[prospect.conversationHistory.length - 1];
            const youthCat = prospect.youthCategory || 'Senior';
            const hasVideo = Boolean(prospect.videoUrl && prospect.videoUrl.trim().length > 0);
            const isMaleProspect = prospect.gender === 'Male';
            const posMap = isMaleProspect ? MALE_POSITION_TRANSLATIONS : POSITION_TRANSLATIONS;

            return (
              <div
                key={prospect.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isMaleProspect
                          ? 'bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                          : prospect.scope === 'International' 
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' 
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {prospect.nationality.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {prospect.name}
                          </h3>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isMaleProspect
                              ? 'bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200'
                              : 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200'
                          }`}>
                            {isMaleProspect ? (language === 'he' ? 'גברים' : 'Male') : (language === 'he' ? 'נשים' : 'Female')}
                          </span>
                          
                          {/* Youth category tag */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getYouthBadgeColor(youthCat)}`}>
                            {youthCat}
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prospect.scope === 'International' 
                              ? 'bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200' 
                              : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                          }`}>
                            {prospect.scope === 'International' ? '✈️ ' + t.international : '📍 ' + t.local}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                          {prospect.currentClub} · {prospect.league}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {posMap[language][prospect.position] || prospect.position} · {prospect.age} {language === 'he' ? 'שנים' : 'yrs'} · {prospect.nationality}
                        </div>
                      </div>
                    </div>

                    <div className="text-right rtl:text-left shrink-0">
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {prospect.talkStage}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Priority: <strong className={prospect.priority === 'High' ? 'text-amber-600' : 'text-slate-600'}>{prospect.priority}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Video Reel Showcase Box (Only if video attached) */}
                  {hasVideo ? (
                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-white relative group">
                      <div className="p-3 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                            <Play className="w-4 h-4 fill-current" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-white block truncate">
                              {prospect.videoTitle || 'Tactical Video Reel'}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {prospect.videoDescription || 'Tactical match footage and skill analysis'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onWatchVideo(prospect)}
                          className="px-3 py-1.5 text-xs font-bold bg-white text-slate-900 rounded-md hover:bg-emerald-400 hover:text-slate-950 transition-colors shrink-0 ml-2"
                        >
                          {t.watchVideo}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Video className="w-3.5 h-3.5 text-slate-400" />
                        {t.noVideoAttached}
                      </span>
                      <button
                        onClick={() => onEditProspect(prospect)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                      >
                        + {language === 'he' ? 'הוסף קישור וידאו' : 'Add Video'}
                      </button>
                    </div>
                  )}

                  {/* Scouting Report & Info Highlights */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-500 font-medium">{t.scoutedStrengths}</span>
                      {prospect.scoutingReport.strengths.map((str, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-medium text-[11px]"
                        >
                          {str}
                        </span>
                      ))}
                    </div>

                    <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong className="text-slate-700 dark:text-slate-300">{t.tacticalFit} </strong>
                      {prospect.scoutingReport.tacticalFit}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                      <div>
                        {t.dominantFoot} <strong className="text-slate-800 dark:text-slate-200">{prospect.scoutingReport.dominantFoot}</strong>
                      </div>
                      <div>
                        {t.height} <strong className="text-slate-800 dark:text-slate-200">{prospect.scoutingReport.heightCm} cm</strong>
                      </div>
                      <div>
                        {t.intlCaps} <strong className="text-slate-800 dark:text-slate-200 font-mono-tabular">{prospect.scoutingReport.internationalCaps}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Recent Talk & Communication Status */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {t.latestTalk} ({latestConvo?.channel || 'None'})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono-tabular">{latestConvo?.date || 'No logs yet'}</span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 italic text-[11px] line-clamp-2">
                      "{latestConvo?.summary || prospect.generalNotes}"
                    </p>

                    {latestConvo?.nextAction && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1">
                        {t.nextAction} {latestConvo.nextAction}
                      </div>
                    )}
                  </div>

                </div>

                {/* Card Action Footer with Easy Delete */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenConversationLog(prospect)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      {t.talkHistory} ({prospect.conversationHistory.length})
                    </button>

                    <button
                      onClick={() => onEditProspect(prospect)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Edit Candidate"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Easy Delete Icon */}
                    <button
                      onClick={() => onRequestDeleteProspect(prospect)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                      title="Delete Candidate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Convert / Sign button */}
                  <button
                    onClick={() => onSignProspectToRoster(prospect)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{t.signToAgency}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
        </>
      )}

    </div>
  );
};
