import React from 'react';
import { Player, Language } from '../types/player';
import { TRANSLATIONS } from '../translations/translations';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  playerToDelete?: { name: string; clubName?: string; position?: string } | null;
  countToDelete?: number;
  language: Language;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  playerToDelete,
  countToDelete,
  language
}) => {
  if (!isOpen) return null;
  const t = TRANSLATIONS[language];
  const isMultiple = (countToDelete || 0) > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.deleteConfirmTitle}
            </h3>

            {isMultiple ? (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
                {t.deleteConfirmMultiple} ({countToDelete} {t.playersLabel})
              </p>
            ) : playerToDelete ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {t.deleteConfirmSingle}
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <strong className="text-slate-900 dark:text-white block">{playerToDelete.name}</strong>
                  <span className="text-slate-500">{playerToDelete.clubName} · {playerToDelete.position}</span>
                </div>
              </div>
            ) : null}

            {/* Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isMultiple ? t.deleteConfirmMultipleBtn : t.deleteConfirmBtn}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
