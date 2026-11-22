import React, { useState, useEffect } from 'react';
import {
  AgentProfile,
  Player,
  Language,
  TeamMemberRule,
  TeamUserRole,
  buildTeamMemberPreset,
  AGENCY_OWNER_EMAIL
} from '../types/player';
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
  Calendar,
  KeyRound,
  Plus,
  Trash2,
  Lock
} from 'lucide-react';

interface AgentSettingsViewProps {
  agents: AgentProfile[];
  onSaveAgents: (updatedAgents: AgentProfile[]) => void;
  femalePlayers: Player[];
  malePlayers: Player[];
  language: Language;
  nextTransferWindowDate?: string;
  onChangeNextTransferWindowDate?: (date: string) => void;
  isOwner?: boolean;
  ownerUid?: string;
  teamMembers?: TeamMemberRule[];
  onSaveTeamMember?: (member: TeamMemberRule) => Promise<void> | void;
  onDeleteTeamMember?: (memberUid: string) => Promise<void> | void;
}

export const AgentSettingsView: React.FC<AgentSettingsViewProps> = ({
  agents,
  onSaveAgents,
  femalePlayers,
  malePlayers,
  language,
  nextTransferWindowDate = '',
  onChangeNextTransferWindowDate,
  isOwner = true,
  ownerUid = '',
  teamMembers = [],
  onSaveTeamMember,
  onDeleteTeamMember
}) => {
  const t = TRANSLATIONS[language];
  const isHe = language === 'he';

  const [draftAgents, setDraftAgents] = useState<AgentProfile[]>(agents);
  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Owner-only team access manager state
  const [draftMembers, setDraftMembers] = useState<TeamMemberRule[]>(teamMembers);
  const [newMemberUid, setNewMemberUid] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamUserRole>('regular');
  const [savedMemberUid, setSavedMemberUid] = useState<string | null>(null);

  useEffect(() => {
    setDraftMembers(teamMembers);
  }, [teamMembers]);

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
            disabled={!isOwner}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isHe ? 'שמור הגדרות סוכנים' : 'Save Agent Settings'}</span>
          </button>
        </div>
      </form>

      {/* Owner-Only CRM User Access & Role Rules */}
      {isOwner ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gold-100 dark:bg-gold-950/60 text-gold-700 dark:text-gold-400 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {isHe ? 'ניהול גישת משתמשים והרשאות CRM' : 'CRM User Access & Role Rules'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gold-100 dark:bg-gold-950/60 text-gold-800 dark:text-gold-300 border border-gold-300/70 dark:border-gold-700/60">
                    <Lock className="w-3 h-3" />
                    <span>{isHe ? 'בעלים בלבד' : 'Owner Only'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isHe
                    ? `רק בעל המערכת (${AGENCY_OWNER_EMAIL}) יכול לערוך הרשאות אלו. כל החוקים נאכפים ישירות ב-Firestore.`
                    : `Only the agency owner (${AGENCY_OWNER_EMAIL}) can manage these rules. Permissions are enforced both in UI and Firestore security rules.`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {!ownerUid ? (
              <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20 p-4 text-xs text-amber-800 dark:text-amber-300">
                {isHe
                  ? `התחבר עם חשבון ה-Google של הבעלים (${AGENCY_OWNER_EMAIL}) כדי לנהל ולסנכרן את הרשאות המשתמשים מול Firebase.`
                  : `Sign in with the owner Google account (${AGENCY_OWNER_EMAIL}) to load and save user rules to Firebase.`}
              </div>
            ) : (
              <>
                {draftMembers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                    {isHe ? 'לא הוגדרו משתמשים נוספים עדיין.' : 'No additional team users configured yet.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draftMembers.map(member => {
                      const updateMemberDraft = (patch: Partial<TeamMemberRule>) => {
                        setDraftMembers(prev =>
                          prev.map(m => (m.uid === member.uid ? { ...m, ...patch } : m))
                        );
                      };

                      const applyRolePreset = (role: TeamUserRole) => {
                        const preset = buildTeamMemberPreset(
                          member.uid,
                          ownerUid,
                          role,
                          member.displayName,
                          member.email || ''
                        );
                        updateMemberDraft({
                          role,
                          canViewPlayers: preset.canViewPlayers,
                          canCreatePlayers: preset.canCreatePlayers,
                          canEditPlayers: preset.canEditPlayers,
                          canDeletePlayers: preset.canDeletePlayers,
                          canAccessScouting: preset.canAccessScouting,
                          canEditTracker: preset.canEditTracker
                        });
                      };

                      const permissionSwitches: Array<{
                        key: keyof Pick<
                          TeamMemberRule,
                          | 'canViewPlayers'
                          | 'canCreatePlayers'
                          | 'canEditPlayers'
                          | 'canDeletePlayers'
                          | 'canAccessScouting'
                          | 'canEditTracker'
                        >;
                        labelEn: string;
                        labelHe: string;
                      }> = [
                        { key: 'canViewPlayers', labelEn: 'View Players', labelHe: 'צפייה בשחקנים' },
                        { key: 'canCreatePlayers', labelEn: 'Create Players', labelHe: 'הוספת שחקנים' },
                        { key: 'canEditPlayers', labelEn: 'Edit Players', labelHe: 'עריכת שחקנים' },
                        { key: 'canDeletePlayers', labelEn: 'Delete Players', labelHe: 'מחיקת שחקנים' },
                        { key: 'canAccessScouting', labelEn: 'Scouting (In Talk)', labelHe: 'סקאוטינג (במו"מ)' },
                        { key: 'canEditTracker', labelEn: 'Player Tracker', labelHe: 'מעקב דקות ונתונים' }
                      ];

                      return (
                        <div
                          key={member.uid}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 space-y-3"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                  {isHe ? 'שם תצוגה' : 'Display Name'}
                                </label>
                                <input
                                  type="text"
                                  value={member.displayName}
                                  onChange={e => updateMemberDraft({ displayName: e.target.value })}
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                  {isHe ? 'אימייל (לתיעוד)' : 'Email Note'}
                                </label>
                                <input
                                  type="email"
                                  dir="ltr"
                                  placeholder="user@agency.com"
                                  value={member.email || ''}
                                  onChange={e => updateMemberDraft({ email: e.target.value })}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                  {isHe ? 'תבנית תפקיד' : 'Role Preset'}
                                </label>
                                <select
                                  value={member.role}
                                  onChange={e => applyRolePreset(e.target.value as TeamUserRole)}
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                  <option value="regular">
                                    {isHe ? 'משתמש רגיל (צפייה + יצירה)' : 'Regular User (View & Create)'}
                                  </option>
                                  <option value="manager">
                                    {isHe ? 'מנהל (צפייה + יצירה + עריכה)' : 'Manager (View, Create, Edit & Scouting)'}
                                  </option>
                                  <option value="viewer">
                                    {isHe ? 'צופה בלבד (קריאה בלבד)' : 'Viewer (Read Only)'}
                                  </option>
                                </select>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={member.active}
                                  onChange={e => updateMemberDraft({ active: e.target.checked })}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className={member.active ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                  {member.active ? (isHe ? 'פעיל' : 'Active') : (isHe ? 'מושעה' : 'Suspended')}
                                </span>
                              </label>

                              <button
                                type="button"
                                onClick={async () => {
                                  if (!onSaveTeamMember) return;
                                  await onSaveTeamMember(member);
                                  setSavedMemberUid(member.uid);
                                  setTimeout(() => setSavedMemberUid(null), 2500);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>
                                  {savedMemberUid === member.uid
                                    ? (isHe ? 'נשמר!' : 'Saved!')
                                    : (isHe ? 'שמור' : 'Save')}
                                </span>
                              </button>

                              {onDeleteTeamMember && (
                                <button
                                  type="button"
                                  title={isHe ? 'הסר גישה' : 'Revoke Access'}
                                  onClick={() => onDeleteTeamMember(member.uid)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                            <div className="flex flex-wrap items-center gap-2">
                              {permissionSwitches.map(sw => (
                                <label
                                  key={sw.key}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(member[sw.key])}
                                    onChange={e => updateMemberDraft({ [sw.key]: e.target.checked })}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span>{isHe ? sw.labelHe : sw.labelEn}</span>
                                </label>
                              ))}
                            </div>

                            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 select-all" dir="ltr">
                              UID: {member.uid}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Another Firebase User UID */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    {isHe ? 'הוסף משתמש מאושר מ-Firebase (לפי UID)' : 'Add Approved Firebase User (by User UID)'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={newMemberUid}
                      onChange={e => setNewMemberUid(e.target.value)}
                      placeholder="Firebase User UID"
                      className="lg:col-span-2 px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      placeholder={isHe ? 'שם המשתמש' : 'Display Name'}
                      className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <select
                      value={newMemberRole}
                      onChange={e => setNewMemberRole(e.target.value as TeamUserRole)}
                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="regular">{isHe ? 'משתמש רגיל' : 'Regular User'}</option>
                      <option value="manager">{isHe ? 'מנהל' : 'Manager'}</option>
                      <option value="viewer">{isHe ? 'צופה' : 'Viewer'}</option>
                    </select>
                    <button
                      type="button"
                      disabled={!newMemberUid.trim() || !onSaveTeamMember}
                      onClick={async () => {
                        if (!newMemberUid.trim() || !onSaveTeamMember) return;
                        const uid = newMemberUid.trim();
                        const preset = buildTeamMemberPreset(
                          uid,
                          ownerUid,
                          newMemberRole,
                          newMemberName.trim() || 'Team User',
                          newMemberEmail.trim()
                        );
                        await onSaveTeamMember(preset);
                        setNewMemberUid('');
                        setNewMemberName('');
                        setNewMemberEmail('');
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold transition-colors disabled:opacity-45"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isHe ? 'הוסף משתמש' : 'Add User'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {isHe
              ? 'הגדרות סוכנים וניהול הרשאות משתמשים זמינים לעריכה עבור בעל המערכת בלבד.'
              : 'Agent settings and CRM user permission rules are restricted to the agency owner.'}
          </span>
        </div>
      )}
    </div>
  );
};
