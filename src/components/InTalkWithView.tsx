import React, { useState, useMemo } from 'react';
import { TalkProspect, ProspectScope, TalkStage, YouthCategory, Language, Currency } from '../types/player';
import { 
  TRANSLATIONS, 
  POSITION_TRANSLATIONS, 
  getYouthBadgeColor 
} from '../translations/translations';
import { 
  formatSalary, 
  parseSalary, 
  CURRENCY_SYMBOLS,
  convertCurrency 
} from '../utils/currency';
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
  TrendingUp,
  Award,
  Edit,
  Trash2,
  CheckCircle2,
  Tag,
  Coins,
  DollarSign
} from 'lucide-react';

interface InTalkWithViewProps {
  prospects: TalkProspect[];
  onOpenAddProspect: () => void;
  onEditProspect: (prospect: TalkProspect) => void;
  onRequestDeleteProspect: (prospect: TalkProspect) => void;
  onWatchVideo: (prospect: TalkProspect) => void;
  onOpenConversationLog: (prospect: TalkProspect) => void;
  onSignProspectToRoster: (prospect: TalkProspect) => void;
  language: Language;
  currency: Currency;
}

export const InTalkWithView: React.FC<InTalkWithViewProps> = ({
  prospects,
  onOpenAddProspect,
  onEditProspect,
  onRequestDeleteProspect,
  onWatchVideo,
  onOpenConversationLog,
  onSignProspectToRoster,
  language,
  currency
}) => {
  const t = TRANSLATIONS[language];
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'Local' | 'International'>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [youthFilter, setYouthFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'cards' | 'stages'>('cards');

  // Counts
  const localCount = prospects.filter(p => p.scope === 'Local').length;
  const intlCount = prospects.filter(p => p.scope === 'International').length;

  const stages: TalkStage[] = [
    'Initial Contact',
    'Scouting & Video',
    'Meeting Scheduled',
    'Offer Proposed',
    'Contract Drafting',
    'Signed'
  ];

  // Helper to get formatted target salary in the active currency (NIS, USD, EUR)
  const getDisplaySalary = (prospect: TalkProspect): string => {
    if (prospect.targetSalaryAmount) {
      return formatSalary(
        prospect.targetSalaryAmount,
        prospect.targetSalaryCurrency || 'EUR',
        currency,
        prospect.targetSalaryPeriod || 'Weekly',
        language
      );
    }
    // Fallback parsing from scoutingReport.estimatedWageWeekly
    const parsed = parseSalary(prospect.scoutingReport?.estimatedWageWeekly, 'EUR');
    return formatSalary(
      parsed.amount,
      parsed.currency,
      currency,
      parsed.period,
      language
    );
  };

  // Filtered prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      // Scope
      if (scopeFilter !== 'ALL' && p.scope !== scopeFilter) return false;
      // Stage
      if (stageFilter !== 'ALL' && p.talkStage !== stageFilter) return false;
      // Priority
      if (priorityFilter !== 'ALL' && p.priority !== priorityFilter) return false;
      // Youth Category (U15, U17, U19, Senior)
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
  }, [prospects, scopeFilter, stageFilter, priorityFilter, youthFilter, searchQuery]);

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
          onClick={onOpenAddProspect}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addTalkProspect}</span>
        </button>
      </div>

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

        {/* Secondary filters: Youth Category, Stage and Priority */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            
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
                <option value="U15">{t.u15}</option>
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
                  <option key={st} value={st}>{st}</option>
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

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
            <button
              onClick={() => setActiveView('cards')}
              className={`px-2.5 py-1 text-xs font-medium rounded ${activeView === 'cards' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
            >
              {t.detailedCards}
            </button>
            <button
              onClick={() => setActiveView('stages')}
              className={`px-2.5 py-1 text-xs font-medium rounded ${activeView === 'stages' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
            >
              {t.stagePipeline}
            </button>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      {filteredProspects.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            No recruitment candidates found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Try resetting your filters or add a new player candidate to begin negotiation tracking.
          </p>
          <button
            onClick={() => {
              setScopeFilter('ALL');
              setStageFilter('ALL');
              setPriorityFilter('ALL');
              setYouthFilter('ALL');
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Reset Filters
          </button>
        </div>
      ) : activeView === 'stages' ? (
        /* STAGE PIPELINE SWIMLANE VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {stages.map(st => {
            const inThisStage = filteredProspects.filter(p => p.talkStage === st);
            return (
              <div 
                key={st}
                className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col min-h-[350px]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={st}>
                    {st}
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono-tabular font-semibold">
                    {inThisStage.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {inThisStage.map(prospect => {
                    const youthCat = prospect.youthCategory || 'Senior';
                    const displaySalary = getDisplaySalary(prospect);

                    return (
                      <div
                        key={prospect.id}
                        className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300 transition-all text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <strong className="text-slate-900 dark:text-white block font-semibold">
                              {prospect.name}
                            </strong>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {prospect.currentClub}
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getYouthBadgeColor(youthCat)}`}>
                              {youthCat}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              prospect.scope === 'International' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {prospect.scope}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          {POSITION_TRANSLATIONS[language][prospect.position] || prospect.position} · {prospect.age} {language === 'he' ? 'שנים' : 'yrs'}
                        </div>

                        {/* TARGET SALARY HIGHLIGHT IN SWIMLANE */}
                        <div className="p-1.5 rounded bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <Coins className="w-3 h-3 text-emerald-600" />
                            {t.targetSalary}:
                          </span>
                          <strong className="text-emerald-700 dark:text-emerald-400 font-mono-tabular font-bold">
                            {displaySalary}
                          </strong>
                        </div>

                        {/* Video Button */}
                        <button
                          onClick={() => onWatchVideo(prospect)}
                          className="w-full flex items-center justify-center gap-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-[11px] transition-colors"
                        >
                          <Play className="w-3 h-3 text-emerald-600" />
                          <span>{t.watchReel}</span>
                        </button>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                          <button
                            onClick={() => onOpenConversationLog(prospect)}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                          >
                            {t.talkHistory} ({prospect.conversationHistory.length})
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onRequestDeleteProspect(prospect)}
                              className="text-slate-400 hover:text-rose-600"
                              title="Delete Candidate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onSignProspectToRoster(prospect)}
                              className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                              title="Sign to Official Agency Roster"
                            >
                              {t.signToAgency} &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {inThisStage.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-slate-400 text-xs italic">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DETAILED CARDS VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProspects.map(prospect => {
            const latestConvo = prospect.conversationHistory[prospect.conversationHistory.length - 1];
            const youthCat = prospect.youthCategory || 'Senior';
            const displaySalary = getDisplaySalary(prospect);

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
                        prospect.scope === 'International' 
                          ? 'bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800' 
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {prospect.nationality.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {prospect.name}
                          </h3>
                          
                          {/* Youth category tag: U15, U17, U19 */}
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
                          {POSITION_TRANSLATIONS[language][prospect.position] || prospect.position} · {prospect.age} {language === 'he' ? 'שנים' : 'yrs'} · {prospect.nationality}
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

                  {/* TARGET SALARY FEATURE HIGHLIGHT BOX */}
                  <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">
                          {t.targetSalary} ({currency})
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-extrabold text-emerald-950 dark:text-emerald-100 font-mono-tabular">
                            {displaySalary}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right rtl:text-left text-[11px] text-slate-500">
                      <span>{t.salaryCadence}: </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {prospect.targetSalaryPeriod || 'Weekly'}
                      </strong>
                    </div>
                  </div>

                  {/* Video Reel Showcase Box */}
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-white relative group">
                    <div className="p-3 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                          <Play className="w-4 h-4 fill-current" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-white block truncate">
                            {prospect.videoTitle}
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

    </div>
  );
};
