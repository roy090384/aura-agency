import React, { useState, useEffect } from 'react';
import { Player } from '../types/player';
import { getContractDaysRemaining, formatDatePretty } from '../utils/contractAlerts';
import { X, Calendar, Check, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface QuickExtendModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onConfirmExtend: (playerId: string, newExpiryDate: string, updatedStatus: any, renewalNote: string) => void;
}

export const QuickExtendModal: React.FC<QuickExtendModalProps> = ({
  isOpen,
  onClose,
  player,
  onConfirmExtend
}) => {
  const [newDate, setNewDate] = useState('');
  const [status, setStatus] = useState<'Active' | 'Negotiating' | 'Pending Renewal'>('Active');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (player) {
      // Default extension is +1 year from existing expiry date
      const curr = new Date(player.contractExpiryDate + 'T00:00:00');
      curr.setFullYear(curr.getFullYear() + 1);
      setNewDate(curr.toISOString().split('T')[0]);
      setStatus('Active');
      setNote(`Contract extension executed for ${player.name} with updated representation mandate terms.`);
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

  const currentDays = getContractDaysRemaining(player.contractExpiryDate);

  const applyPresetMonths = (monthsToAdd: number) => {
    const base = new Date(player.contractExpiryDate + 'T00:00:00');
    // If already expired, base off today
    const startingPoint = currentDays < 0 ? new Date() : base;
    startingPoint.setMonth(startingPoint.getMonth() + monthsToAdd);
    setNewDate(startingPoint.toISOString().split('T')[0]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    onConfirmExtend(player.id, newDate, status, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Extend Agency Representation Agreement
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {player.name} · {player.clubName} ({player.position})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* Current Expiry Alert Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 block">Current Expiration Date:</span>
              <strong className="text-sm text-slate-900 dark:text-white font-mono-tabular">
                {formatDatePretty(player.contractExpiryDate)}
              </strong>
            </div>

            <div className="text-right">
              <span className="text-slate-500 block">Time Remaining:</span>
              <span className={`font-mono-tabular font-bold ${
                currentDays <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {currentDays < 0 ? `${Math.abs(currentDays)} days overdue` : `${currentDays} days left`}
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Quick Extension Duration Presets
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPresetMonths(6)}
                className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
              >
                +6 Months
              </button>
              <button
                type="button"
                onClick={() => applyPresetMonths(12)}
                className="py-1.5 px-2 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 transition-colors text-center"
              >
                +1 Year
              </button>
              <button
                type="button"
                onClick={() => applyPresetMonths(24)}
                className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
              >
                +2 Years
              </button>
              <button
                type="button"
                onClick={() => applyPresetMonths(36)}
                className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
              >
                +3 Years
              </button>
            </div>
          </div>

          {/* Custom Date Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              New Expiration Date *
            </label>
            <input
              type="date"
              required
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border-2 border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono-tabular font-bold"
            />
          </div>

          {/* Updated Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Update Player Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="Active">Active (Mandate Renewed)</option>
              <option value="Negotiating">Negotiating (In Ongoing Formal Talks)</option>
              <option value="Pending Renewal">Pending Renewal</option>
            </select>
          </div>

          {/* Renewal Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Agency Renewal Note
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Extension</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
