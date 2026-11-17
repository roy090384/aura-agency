import React, { useState, useEffect } from 'react';
import { AgentProfile, Player, Language } from '../types/player';
import { TRANSLATIONS } from '../translations/translations';
import { findAgentProfile } from '../data/defaultAgents';
import {
  UserCog,
  Phone,
  Mail,
  Save,
  CheckCircle2,
  Users,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface AgentSettingsViewProps {
  agents: AgentProfile[];
  onSaveAgents: (updatedAgents: AgentProfile[]) => void;
  femalePlayers: Player[];
  malePlayers: Player[];
  language: Language;
  nextTransferWindowDate?: string;
  onChangeNextTransferWindowDate?: (date: string) => void;
}

export const AgentSettingsView: React.FC<AgentSettingsViewProps> = ({
  agents,
  onSaveAgents,
  femalePlayers,
  malePlayers,
  language,
  nextTransferWindowDate = '',
  onChangeNextTransferWindowDate
}) => {
  const t = TRANSLATIONS[language];
  const isHe = language === 'he';

  const [draftAgents, setDraftAgents] = useState<AgentProfile[]>(agents);
  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setDraftAgents(agents);
    setHasChanges(false);
  }, [agents]);

  const handleFieldChange = (id: string, field: 'phone' | 'email', value: string) => {
    setDraftAgents(prev =>
      prev.map(agent =>
        agent.id === id
          ? { ...agent, [field]: value, updatedAt: new Date().toISOString() }
          : agent
      )
    );
    setHasChanges(true);
    setJustSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftAgents.map(a => ({
      ...a,
      phone: a.phone.trim(),
      email: a.email.trim(),
      updatedAt: new Date().toISOString()
    }));
    onSaveAgents(cleaned);
    setHasChanges(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const getAgentRosterCounts = (agent: AgentProfile) => {
    const fCount = femalePlayers.filter(p => {
      const matched = findAgentProfile([agent], p.assignedAgent);
      return !!matched;
    }).length;
    const mCount = malePlayers.filter(p => {
      const matched = findAgentProfile([agent], p.assignedAgent);
      return !!matched;
    }).length;
    return { fCount, mCount, total: fCount + mCount };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t.agentSettings}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {isHe
                  ? 'ניהול פרטי הקשר של סוכני הסוכנות — שינויים מתעדכנים אוטומטית בכרטיסי השחקנים, בדוחות ובלוחות הבקרה.'
                  : 'Manage contact details for agency representatives. Updates sync dynamically across player rosters, detail cards, and dashboards.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Cards Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {draftAgents.map(agent => {
            const counts = getAgentRosterCounts(agent);
            const initials = agent.name
              .split(' ')
              .map(part => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={agent.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {agent.name}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>{agent.role || (isHe ? 'סוכן מוסמך' : 'Licensed Agency Representative')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Players Count Pill */}
                  <div className="text-right rtl:text-left shrink-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono-tabular">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{counts.total}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {isHe
                        ? `${counts.fCount} נשים · ${counts.mCount} בנים`
                        : `${counts.fCount} Female · ${counts.mCount} Male`}
                    </div>
                  </div>
                </div>

                {/* Editable Contact Fields */}
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isHe ? 'מספר טלפון' : 'Phone Number'}</span>
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="+972 50-000-0000"
                      value={agent.phone}
                      onChange={e => handleFieldChange(agent.id, 'phone', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono-tabular focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isHe ? 'כתובת אימייל' : 'Email Address'}</span>
                    </label>
                    <input
                      type="email"
                      dir="ltr"
                      placeholder="agent@britsportgroup.com"
                      value={agent.email}
                      onChange={e => handleFieldChange(agent.id, 'email', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Quick preview footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {agent.phone || agent.email
                        ? isHe
                          ? 'פרטי התקשרות זמינים בכרטיסי השחקנים'
                          : 'Contact details visible on assigned player cards'
                        : isHe
                        ? 'טרם הוזנו פרטי התקשרות'
                        : 'No contact details configured yet'}
                    </span>
                    {agent.updatedAt && (
                      <span className="font-mono-tabular">
                        {isHe ? 'עודכן: ' : 'Updated: '}
                        {new Date(agent.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Transfer Window Target Date Setting */}
        {onChangeNextTransferWindowDate && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {t.nextTransferWindowDate}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isHe
                    ? 'תאריך יעד גלובלי לחישוב דמי ההשבחה המשוערים על כרטיסי השחקנים בסגל הנשים ובסגל הבנים.'
                    : 'Global target date used to calculate Estimated Training Compensation across all Male & Female Roster player cards.'}
                </p>
              </div>
            </div>

            <input
              type="date"
              value={nextTransferWindowDate}
              onChange={e => onChangeNextTransferWindowDate(e.target.value)}
              className="px-3.5 py-2 text-sm font-mono-tabular font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shrink-0"
            />
          </div>
        )}

        {/* Save Bar */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            {justSaved ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isHe
                    ? 'פרטי הסוכנים נשמרו וסונכרנו בכל המערכת!'
                    : 'Agent settings saved and synced across the application!'}
                </span>
              </span>
            ) : hasChanges ? (
              <span className="text-amber-700 dark:text-amber-400 font-semibold">
                {isHe ? 'ישנם שינויים שלא נשמרו.' : 'You have unsaved changes.'}
              </span>
            ) : (
              <span>
                {isHe
                  ? 'כל פרטי הסוכנים מעודכנים ושמורים.'
                  : 'All agent contact details are up to date.'}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isHe ? 'שמור הגדרות סוכנים' : 'Save Agent Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
