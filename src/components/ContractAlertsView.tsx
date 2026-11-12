import React, { useState, useMemo } from 'react';
import { Player, Language } from '../types/player';
import { 
  getContractDaysRemaining, 
  getContractUrgency, 
  getUrgencyBadgeConfig, 
  formatDatePretty 
} from '../utils/contractAlerts';
import { 
  TRANSLATIONS, 
  POSITION_TRANSLATIONS, 
  STATUS_TRANSLATIONS, 
  getYouthBadgeColor 
} from '../translations/translations';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Download, 
  Edit, 
  Eye, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

interface ContractAlertsViewProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onQuickExtend: (player: Player) => void;
  onEditPlayer: (player: Player) => void;
  language: Language;
}

export const ContractAlertsView: React.FC<ContractAlertsViewProps> = ({
  players,
  onSelectPlayer,
  onQuickExtend,
  onEditPlayer,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [activeCategory, setActiveCategory] = useState<'CRITICAL_1_MONTH' | 'APPROACHING_3_MONTHS' | 'EXPIRED' | 'ALL'>('CRITICAL_1_MONTH');
  const [customThresholdDays, setCustomThresholdDays] = useState<number>(30); // 1 month default

  // Group players by contract status
  const { critical1Month, approaching90d, expired, secure } = useMemo(() => {
    const critical: Player[] = [];
    const approaching: Player[] = [];
    const exp: Player[] = [];
    const sec: Player[] = [];

    players.forEach(p => {
      const days = getContractDaysRemaining(p.contractExpiryDate);
      if (days < 0) {
        exp.push(p);
      } else if (days <= customThresholdDays) {
        critical.push(p);
      } else if (days <= 90) {
        approaching.push(p);
      } else {
        sec.push(p);
      }
    });

    const sorter = (a: Player, b: Player) => 
      getContractDaysRemaining(a.contractExpiryDate) - getContractDaysRemaining(b.contractExpiryDate);

    return {
      critical1Month: critical.sort(sorter),
      approaching90d: approaching.sort(sorter),
      expired: exp.sort(sorter),
      secure: sec.sort(sorter)
    };
  }, [players, customThresholdDays]);

  // Current list to display
  const displayList = useMemo(() => {
    if (activeCategory === 'CRITICAL_1_MONTH') return critical1Month;
    if (activeCategory === 'APPROACHING_3_MONTHS') return approaching90d;
    if (activeCategory === 'EXPIRED') return expired;
    return [...expired, ...critical1Month, ...approaching90d, ...secure];
  }, [activeCategory, critical1Month, approaching90d, expired, secure]);

  // Export audit report
  const handleExportAudit = () => {
    const headers = ['Player ID', 'Name', 'Age Category', 'Current Club', 'Position', 'Contract Expiration Date', 'Days Remaining', 'Alert Level', 'Player Status', 'Notes'];
    const rows = players.map(p => {
      const days = getContractDaysRemaining(p.contractExpiryDate);
      const urgency = getContractUrgency(p.contractExpiryDate);
      return [
        p.id,
        `"${p.name}"`,
        p.youthCategory || 'Senior',
        `"${p.clubName}"`,
        `"${p.position}"`,
        p.contractExpiryDate,
        days,
        urgency,
        p.status,
        `"${p.notes || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AURA_Contract_Expiration_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">

      {/* Header and Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.alertsTitle}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
              {t.alertsBadge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.alertsDesc}
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.exportAuditCsv}</span>
        </button>
      </div>

      {/* Top Urgent Alert Banner */}
      {critical1Month.length > 0 && (
        <div className="p-5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800/80 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-200">
                {t.warningTitle}: {critical1Month.length} {t.warningSub}
              </h3>
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-300 mt-1">
                {t.warningDesc}
              </p>
              
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {critical1Month.map(p => {
                  const days = getContractDaysRemaining(p.contractExpiryDate);
                  const youthCat = p.youthCategory || 'Senior';
                  return (
                    <div 
                      key={p.id}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <strong className="text-slate-900 dark:text-white truncate">{p.name}</strong>
                          {youthCat !== 'Senior' && (
                            <span className={`text-[10px] font-bold px-1 rounded border ${getYouthBadgeColor(youthCat)}`}>
                              {youthCat}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">{p.clubName}</span>
                      </div>
                      <div className="text-right rtl:text-left shrink-0">
                        <span className="font-bold text-amber-600 dark:text-amber-400 font-mono-tabular">
                          {days === 0 ? t.expiresToday : `${days}d`}
                        </span>
                        <button
                          onClick={() => onQuickExtend(p)}
                          className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline mt-0.5"
                        >
                          {t.extend}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Threshold & Category Controls */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Category Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveCategory('CRITICAL_1_MONTH')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeCategory === 'CRITICAL_1_MONTH'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.tab1Month} ({critical1Month.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory('APPROACHING_3_MONTHS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeCategory === 'APPROACHING_3_MONTHS'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t.tab90Days} ({approaching90d.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory('EXPIRED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeCategory === 'EXPIRED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t.tabExpired} ({expired.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory('ALL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeCategory === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.tabAll} ({players.length})</span>
            </button>
          </div>

          {/* Alert Threshold Adjuster */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{t.alertWindow}</span>
            <select
              value={customThresholdDays}
              onChange={e => setCustomThresholdDays(Number(e.target.value))}
              className="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value={15}>15 Days</option>
              <option value={30}>30 Days (1 Month)</option>
              <option value={45}>45 Days</option>
              <option value={60}>60 Days (2 Months)</option>
              <option value={90}>90 Days (3 Months)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contract Alert Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {displayList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No contracts found in this category
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              All representation agreements in this range are accounted for.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">{t.thPlayer}</th>
                  <th className="py-3 px-4">{t.thAgreementPeriod}</th>
                  <th className="py-3 px-4">{t.thUrgencyCountdown}</th>
                  <th className="py-3 px-4">{t.thPlayerStatus}</th>
                  <th className="py-3 px-4">{t.thAgentStrategy}</th>
                  <th className="py-3 px-4 text-center">{t.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {displayList.map(player => {
                  const days = getContractDaysRemaining(player.contractExpiryDate);
                  const urgency = getContractUrgency(player.contractExpiryDate);
                  const badge = getUrgencyBadgeConfig(urgency, days);
                  const is1Month = urgency === 'CRITICAL_1_MONTH';
                  const youthCat = player.youthCategory || 'Senior';

                  return (
                    <tr 
                      key={player.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        is1Month ? 'bg-amber-50/20 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {player.photoUrl ? (
                            <img 
                              src={player.photoUrl} 
                              alt={player.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {player.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onSelectPlayer(player)}
                                className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 text-left rtl:text-right block"
                              >
                                {player.name}
                              </button>
                              {youthCat !== 'Senior' && (
                                <span className={`text-[10px] font-bold px-1 rounded border ${getYouthBadgeColor(youthCat)}`}>
                                  {youthCat}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              {player.clubName} · {POSITION_TRANSLATIONS[language][player.position] || player.position}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono-tabular text-slate-800 dark:text-slate-200 text-xs">
                          {formatDatePretty(player.contractStartDate)} &rarr; <strong>{formatDatePretty(player.contractExpiryDate)}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {player.representationType} ({player.agencyFeePct}% fee)
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${badge.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}></span>
                            <span>{badge.label}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {STATUS_TRANSLATIONS[language][player.status] || player.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {player.notes || 'No active notes logged for this contract.'}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onQuickExtend(player)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-2xs whitespace-nowrap shrink-0"
                          >
                            {t.extend}
                          </button>
                          <button
                            onClick={() => onEditPlayer(player)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Edit Contract Terms"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
