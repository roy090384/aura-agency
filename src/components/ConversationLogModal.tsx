import React, { useState } from 'react';
import { TalkProspect, ConversationLog } from '../types/player';
import { X, MessageSquare, Plus, Calendar, Phone, Video, Users, CheckCircle2 } from 'lucide-react';

interface ConversationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: TalkProspect | null;
  onAddLog: (prospectId: string, log: ConversationLog) => void;
}

export const ConversationLogModal: React.FC<ConversationLogModalProps> = ({
  isOpen,
  onClose,
  prospect,
  onAddLog
}) => {
  const [channel, setChannel] = useState<'Phone' | 'In-Person' | 'Video Call' | 'WhatsApp' | 'Club Meeting'>('In-Person');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [loggedBy, setLoggedBy] = useState('Senior Agent');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen || !prospect) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      alert('Please enter a conversation summary.');
      return;
    }

    const newLog: ConversationLog = {
      id: `c-${Date.now()}`,
      date,
      channel,
      summary: summary.trim(),
      nextAction: nextAction.trim(),
      loggedBy: loggedBy.trim() || 'Agent'
    };

    onAddLog(prospect.id, newLog);
    setSummary('');
    setNextAction('');
    setShowAddForm(false);
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'Phone': return <Phone className="w-3.5 h-3.5" />;
      case 'Video Call': return <Video className="w-3.5 h-3.5" />;
      case 'Club Meeting': return <Users className="w-3.5 h-3.5" />;
      default: return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Conversation & Talk History: {prospect.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {prospect.currentClub} · {prospect.scope} · Stage: <strong>{prospect.talkStage}</strong>
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Action to toggle Add Form */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Logged Interaction Timeline ({prospect.conversationHistory.length})
            </h3>

            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Interaction</span>
              </button>
            )}
          </div>

          {/* Add Interaction Form */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-900/40">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  New Talk Record
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Channel
                  </label>
                  <select
                    value={channel}
                    onChange={e => setChannel(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="In-Person">In-Person Meeting</option>
                    <option value="Video Call">Video Call (Zoom/Teams)</option>
                    <option value="Phone">Phone Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Club Meeting">Club Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Logged By
                  </label>
                  <input
                    type="text"
                    value={loggedBy}
                    onChange={e => setLoggedBy(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Discussion Summary *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Key points covered with the player, parents, or club representative..."
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agreed Next Action & Follow-Up
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deliver contract draft before Friday; arrange scout at next match"
                  value={nextAction}
                  onChange={e => setNextAction(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          )}

          {/* Timeline list */}
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {prospect.conversationHistory.slice().reverse().map(item => (
              <div key={item.id} className="relative flex items-start gap-4 pl-8">
                <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                  {getChannelIcon(item.channel)}
                </div>

                <div className="flex-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.channel}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono-tabular">
                      {item.date} · {item.loggedBy}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>

                  {item.nextAction && (
                    <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      <strong>Next Action: </strong>{item.nextAction}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {prospect.conversationHistory.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs italic pl-8">
                No discussion records logged yet. Click "Log New Interaction" to start.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
