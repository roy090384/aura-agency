import React, { useState } from 'react';
import { Player, Language, Currency } from '../types/player';
import { 
  getContractDaysRemaining, 
  getContractUrgency, 
  getUrgencyBadgeConfig, 
  formatDatePretty 
} from '../utils/contractAlerts';
import { 
  TRANSLATIONS, 
  POSITION_TRANSLATIONS, 
  getYouthBadgeColor 
} from '../translations/translations';
import { convertMarketValueString } from '../utils/currency';
import { 
  X, 
  Calendar, 
  AlertTriangle, 
  ShieldCheck, 
  DollarSign, 
  Play, 
  Mail, 
  Phone, 
  Edit, 
  Clock, 
  Award,
  Sparkles,
  FileText,
  Trash2,
  Tag,
  Cake
} from 'lucide-react';
import { findCountry } from '../data/countries';
import { getPlayerBirthdayInfo } from '../utils/birthdayAlerts';

interface PlayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onEdit: (player: Player) => void;
  onQuickExtend: (player: Player) => void;
  onRequestDelete: (player: Player) => void;
  onWatchVideo: (title: string, videoUrl: string, player: Player) => void;
  language?: Language;
  currency?: Currency;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  isOpen,
  onClose,
  player,
  onEdit,
  onQuickExtend,
  onRequestDelete,
  onWatchVideo,
  language = 'en',
  currency = 'EUR'
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'overview' | 'contract' | 'notes'>('overview');

  if (!isOpen || !player) return null;

  const days = getContractDaysRemaining(player.contractExpiryDate);
  const urgency = getContractUrgency(player.contractExpiryDate);
  const badge = getUrgencyBadgeConfig(urgency, days);
  const is1MonthAlert = urgency === 'CRITICAL_1_MONTH';
  const youthCat = player.youthCategory || 'Senior';
  const country = findCountry(player.nationality);
  const bdayInfo = getPlayerBirthdayInfo(player);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        
        {/* Top Banner with Image and Quick Identity */}
        <div className="relative bg-slate-900 text-white p-6 sm:p-8">
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-4 top-4 rtl:right-auto rtl:left-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {player.photoUrl ? (
              <img 
                src={player.photoUrl} 
                alt={player.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg shrink-0" 
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-800 text-white font-extrabold flex items-center justify-center text-2xl border-2 border-emerald-500/40 shrink-0">
                {player.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {player.status}
                </span>

                {/* Youth Category Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getYouthBadgeColor(youthCat)}`}>
                  {youthCat}
                </span>

                <span className="text-xs text-slate-400">
                  {POSITION_TRANSLATIONS[language][player.position] || player.position} {player.jerseyNumber > 0 && `· #${player.jerseyNumber}`}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {player.name}
              </h1>

              <div className="text-sm text-slate-300 mt-1 flex flex-wrap items-center gap-2">
                <strong className="text-white">{player.clubName}</strong>
                <span>·</span>
                <span>{player.league}</span>
                <span>·</span>
                <span>{player.age} yrs ({player.nationality})</span>
              </div>
            </div>

            {/* Contract countdown card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-right rtl:text-left shrink-0">
              <span className="text-[11px] text-slate-400 block">Agency Mandate Expiry:</span>
              <span className={`text-base font-bold font-mono-tabular block mt-0.5 ${
                is1MonthAlert ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {days < 0 ? `${Math.abs(days)}d Overdue` : `${days} Days Left`}
              </span>
              <div className="text-[11px] text-slate-400 font-mono-tabular mt-0.5">
                {formatDatePretty(player.contractExpiryDate)}
              </div>
            </div>
          </div>

          {/* 1-Month Critical Expiration Notification if active */}
          {is1MonthAlert && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>1-Month Warning:</strong> Agency mandate expires in {days} days. Renew representation terms to secure exclusivity.
                </span>
              </div>
              <button
                onClick={() => onQuickExtend(player)}
                className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-colors whitespace-nowrap shrink-0"
              >
                Renew Contract Now
              </button>
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Player Overview & Vitals
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'contract'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Agency Contract & Terms
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'notes'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Representation Notes & Strategy
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5 max-h-[55vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Age Category</span>
                  <strong className="text-sm text-slate-900 dark:text-white">{youthCat}</strong>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Position</span>
                  <strong className="text-sm text-slate-900 dark:text-white">{POSITION_TRANSLATIONS[language][player.position] || player.position}</strong>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Market Valuation</span>
                  <strong className="text-sm text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                    {convertMarketValueString(player.marketValue, currency)}
                  </strong>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Dominant Foot</span>
                  <strong className="text-sm text-slate-900 dark:text-white">{player.dominantFoot}</strong>
                </div>

                {/* Birthday & Countdown Card */}
                <div className="p-3 rounded-lg bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200/60 dark:border-pink-900/40 col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-pink-700 dark:text-pink-300 flex items-center gap-1">
                      <Cake className="w-3.5 h-3.5 text-pink-500" />
                      <span>Date of Birth / Birthday</span>
                    </span>
                    {bdayInfo && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        bdayInfo.isToday
                          ? 'bg-rose-600 text-white animate-pulse'
                          : bdayInfo.isThisWeek
                          ? 'bg-pink-200 dark:bg-pink-900 text-pink-900 dark:text-pink-100'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {bdayInfo.isToday ? 'TODAY! 🎉' : `in ${bdayInfo.daysUntil} days`}
                      </span>
                    )}
                  </div>
                  <strong className="text-sm text-slate-900 dark:text-white font-mono-tabular block mt-1">
                    {player.birthDate ? `${player.birthDate} (${player.age} yrs)` : `${player.age} yrs`}
                  </strong>
                </div>

                {/* Country Card */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 col-span-2">
                  <span className="text-[11px] text-slate-500 block">Nationality & Country Code</span>
                  <strong className="text-sm text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    {country && <span className="text-base">{country.flag}</span>}
                    <span>{player.nationality}</span>
                    {player.countryCode && (
                      <span className="text-xs text-slate-400 font-mono">({player.countryCode})</span>
                    )}
                  </strong>
                </div>
              </div>

              {/* Video highlights reel */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-600 text-white">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 dark:text-white block">
                      Video Highlights Reel Available
                    </strong>
                    <span className="text-xs text-slate-500">
                      Match actions, defensive coverages, tactical analysis
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onWatchVideo(
                    `${player.name} - Official Agency Reel`,
                    player.videoHighlightsUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                    player
                  )}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{t.watchReel}</span>
                </button>
              </div>

              {/* Contact info */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                  Player & Management Contact Channels
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span>{player.contactEmail || 'agency-rep@mgmt-aura.com'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>{player.contactPhone || '+44 20 7946 0912'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contract' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Agency Representation Contract Breakdown
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block">Representation Type:</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-sm">
                      {player.representationType} Mandate
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Agency Commission Fee:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 text-sm font-mono-tabular">
                      {player.agencyFeePct}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Agreement Signed:</span>
                    <span className="font-mono-tabular text-slate-700 dark:text-slate-300">
                      {formatDatePretty(player.contractStartDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Agreement Expiration:</span>
                    <strong className="font-mono-tabular text-slate-900 dark:text-white">
                      {formatDatePretty(player.contractExpiryDate)}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${badge.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}></span>
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => onQuickExtend(player)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors"
                  >
                    {t.extend}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                  Confidential Agent Notes
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {player.notes || 'No confidential agency notes recorded yet.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions with Easy Delete Option */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onRequestDelete(player);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
            title="Delete player from agency"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.deletePlayer}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(player)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{t.editPlayer}</span>
            </button>
            <button
              onClick={() => onQuickExtend(player)}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              {t.extend}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
