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
  Lock,
  AlertTriangle,
  Pencil,
  Copy,
  Check,
  X,
  RefreshCw
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

type PermissionFlagKey =
  | 'canViewPlayers'
  | 'canCreatePlayers'
  | 'canEditPlayers'
  | 'canDeletePlayers'
  | 'canAccessScouting'
  | 'canEditTracker';

const PERMISSION_SWITCHES: Array<{
  key: PermissionFlagKey;
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

type PermissionFlags = Record<PermissionFlagKey, boolean> & { active: boolean };

function extractFlagsFromPreset(role: TeamUserRole): PermissionFlags {
  const preset = buildTeamMemberPreset('temp', 'temp', role);
  return {
    active: true,
    canViewPlayers: preset.canViewPlayers,
    canCreatePlayers: preset.canCreatePlayers,
    canEditPlayers: preset.canEditPlayers,
    canDeletePlayers: preset.canDeletePlayers,
    canAccessScouting: preset.canAccessScouting,
    canEditTracker: preset.canEditTracker
  };
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

  // Owner-only CRM User Access manager state
  const [editingMember, setEditingMember] = useState<TeamMemberRule | null>(null);
  const [savingMemberUid, setSavingMemberUid] = useState<string | null>(null);
  const [deletingMemberUid, setDeletingMemberUid] = useState<string | null>(null);
  const [recentlySavedUid, setRecentlySavedUid] = useState<string | null>(null);
  const [copiedMemberUid, setCopiedMemberUid] = useState<string | null>(null);
  const [memberFeedback, setMemberFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Create New User Rule form state (includes live permission checkboxes!)
  const [newMemberUid, setNewMemberUid] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamUserRole>('regular');
  const [newMemberFlags, setNewMemberFlags] = useState<PermissionFlags>(() =>
    extractFlagsFromPreset('regular')
  );
  const [isCreatingMember, setIsCreatingMember] = useState(false);

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

  const getRoleDisplayLabel = (role: TeamUserRole) => {
    if (role === 'manager') return isHe ? 'מנהל' : 'Manager';
    if (role === 'viewer') return isHe ? 'צופה' : 'Viewer';
    return isHe ? 'משתמש רגיל' : 'Regular User';
  };

  const handleNewRolePresetChange = (role: TeamUserRole) => {
    setNewMemberRole(role);
    setNewMemberFlags(extractFlagsFromPreset(role));
  };

  const handleCreateMemberRule = async () => {
    const cleanUid = newMemberUid.trim();
    if (!cleanUid || !onSaveTeamMember) return;

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUid)) {
      setMemberFeedback({
        type: 'error',
        text: isHe
          ? 'מזהה המשתמש (UID) חייב להכיל אותיות ומספרים בלבד מ-Firebase Authentication (ללא רווחים או @).'
          : 'Firebase User UID must contain only letters, numbers, "-" or "_" (paste the User UID from Firebase Auth, not an email address).'
      });
      return;
    }

    setIsCreatingMember(true);
    setMemberFeedback(null);
    try {
      const now = new Date().toISOString();
      const cleanName = newMemberName.trim() || newMemberEmail.trim() || 'Team User';
      const newRule: TeamMemberRule = {
        uid: cleanUid,
        displayName: cleanName,
        email: newMemberEmail.trim(),
        role: newMemberRole,
        active: Boolean(newMemberFlags.active),
        canViewPlayers: Boolean(newMemberFlags.canViewPlayers),
        canCreatePlayers: Boolean(newMemberFlags.canCreatePlayers),
        canEditPlayers: Boolean(newMemberFlags.canEditPlayers),
        canDeletePlayers: Boolean(newMemberFlags.canDeletePlayers),
        canAccessScouting: Boolean(newMemberFlags.canAccessScouting),
        canEditTracker: Boolean(newMemberFlags.canEditTracker),
        userId: ownerUid,
        createdAt: now,
        updatedAt: now
      };

      await onSaveTeamMember(newRule);

      setRecentlySavedUid(cleanUid);
      setTimeout(() => setRecentlySavedUid(prev => (prev === cleanUid ? null : prev)), 5000);

      setMemberFeedback({
        type: 'success',
        text: isHe
          ? `המשתמש "${cleanName}" נשמר בהצלחה ברשימת המשתמשים המאושרים עם ההרשאות שבחרת.`
          : `Saved "${cleanName}" with your selected access permissions. They now appear in Approved Users above.`
      });

      setNewMemberUid('');
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberRole('regular');
      setNewMemberFlags(extractFlagsFromPreset('regular'));
    } catch (err: any) {
      setMemberFeedback({
        type: 'error',
        text:
          err?.message ||
          (isHe
            ? 'שמירת המשתמש נכשלה. ודא שהתחברת כבעל הסוכנות ושה-UID תקין.'
            : 'Failed to save user rule to Firebase. Verify owner sign-in and UID format.')
      });
    } finally {
      setIsCreatingMember(false);
    }
  };

  const handleSaveEditedMember = async () => {
    if (!editingMember || !onSaveTeamMember) return;
    setSavingMemberUid(editingMember.uid);
    setMemberFeedback(null);

    try {
      const sanitized: TeamMemberRule = {
        ...editingMember,
        displayName: editingMember.displayName.trim() || editingMember.email?.trim() || 'Team User',
        email: (editingMember.email || '').trim(),
        active: Boolean(editingMember.active),
        canViewPlayers: Boolean(editingMember.canViewPlayers),
        canCreatePlayers: Boolean(editingMember.canCreatePlayers),
        canEditPlayers: Boolean(editingMember.canEditPlayers),
        canDeletePlayers: Boolean(editingMember.canDeletePlayers),
        canAccessScouting: Boolean(editingMember.canAccessScouting),
        canEditTracker: Boolean(editingMember.canEditTracker),
        userId: ownerUid,
        updatedAt: new Date().toISOString()
      };

      await onSaveTeamMember(sanitized);

      setRecentlySavedUid(sanitized.uid);
      setTimeout(() => setRecentlySavedUid(prev => (prev === sanitized.uid ? null : prev)), 4000);
      setEditingMember(null);
      setMemberFeedback({
        type: 'success',
        text: isHe
          ? `ההרשאות עבור "${sanitized.displayName}" נשמרו ב-Firebase.`
          : `Permissions saved to Firebase for "${sanitized.displayName}".`
      });
    } catch (err: any) {
      setMemberFeedback({
        type: 'error',
        text:
          err?.message ||
          (isHe ? 'שגיאה בעדכון ההרשאות ב-Firebase.' : 'Failed to update permissions in Firebase.')
      });
    } finally {
      setSavingMemberUid(null);
    }
  };

  const handleRevokeMember = async (member: TeamMemberRule) => {
    if (!onDeleteTeamMember) return;
    setDeletingMemberUid(member.uid);
    setMemberFeedback(null);
    try {
      await onDeleteTeamMember(member.uid);
      if (editingMember?.uid === member.uid) {
        setEditingMember(null);
      }
      setMemberFeedback({
        type: 'success',
        text: isHe
          ? `הגישה עבור "${member.displayName}" הוסרה.`
          : `Workspace access revoked for "${member.displayName}".`
      });
    } catch (err: any) {
      setMemberFeedback({
        type: 'error',
        text: err?.message || (isHe ? 'שגיאה בהסרת המשתמש.' : 'Failed to revoke user access.')
      });
    } finally {
      setDeletingMemberUid(null);
    }
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

            {ownerUid && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {teamMembers.length} {isHe ? 'משתמשים שמורים' : 'Approved & Saved'}
                </span>
              </div>
            )}
          </div>

          <div className="p-5 space-y-6">
            {!ownerUid ? (
              <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20 p-4 text-xs text-amber-800 dark:text-amber-300">
                {isHe
                  ? `התחבר עם חשבון ה-Google של הבעלים (${AGENCY_OWNER_EMAIL}) כדי לנהל ולסנכרן את הרשאות המשתמשים מול Firebase.`
                  : `Sign in with the owner Google account (${AGENCY_OWNER_EMAIL}) to load and save user rules to Firebase.`}
              </div>
            ) : (
              <>
                {/* Inline Feedback Banner */}
                {memberFeedback && (
                  <div
                    className={`rounded-xl p-3.5 border text-xs font-semibold flex items-center justify-between gap-3 ${
                      memberFeedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {memberFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{memberFeedback.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMemberFeedback(null)}
                      className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* SECTION 1: APPROVED USERS (SAVED IN FIREBASE) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {isHe ? 'משתמשים מאושרים (שמורים במערכת)' : 'Approved Users (Saved)'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold font-mono-tabular text-slate-600 dark:text-slate-300">
                        {teamMembers.length}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isHe
                        ? 'מסונכרן בזמן אמת מול Firebase Firestore'
                        : 'Live synced with Firebase Firestore'}
                    </span>
                  </div>

                  {teamMembers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-xs text-slate-500 dark:text-slate-400 text-center">
                      {isHe
                        ? 'אין עדיין משתמשים מאושרים שמורים. צור חוק משתמש חדש למטה והוא יופיע כאן מייד לאחר השמירה.'
                        : 'No approved users saved yet. Create a new user rule below and it will appear here as saved.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamMembers.map(member => {
                        const isEditingThis = editingMember?.uid === member.uid;
                        const isJustSaved = recentlySavedUid === member.uid;
                        const isSavingThis = savingMemberUid === member.uid;
                        const isDeletingThis = deletingMemberUid === member.uid;
                        const initials = (member.displayName || 'TU')
                          .split(' ')
                          .map(part => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase();

                        const enabledPermissions = PERMISSION_SWITCHES.filter(sw =>
                          Boolean(member[sw.key])
                        );

                        return (
                          <div
                            key={member.uid}
                            className={`rounded-xl border p-4 transition-all ${
                              isJustSaved
                                ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30'
                            }`}
                          >
                            {/* Saved User Summary Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {initials}
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                      {member.displayName}
                                    </span>

                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>
                                        {isJustSaved
                                          ? isHe
                                            ? 'נשמר עכשיו'
                                            : 'Just Saved'
                                          : isHe
                                          ? 'שמור'
                                          : 'Saved'}
                                      </span>
                                    </span>

                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        member.active
                                          ? 'bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300'
                                          : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                      }`}
                                    >
                                      {member.active
                                        ? isHe
                                          ? 'פעיל'
                                          : 'Active'
                                        : isHe
                                        ? 'מושעה'
                                        : 'Suspended'}
                                    </span>

                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                      {getRoleDisplayLabel(member.role)}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    {member.email && (
                                      <span dir="ltr" className="font-medium text-slate-600 dark:text-slate-300">
                                        {member.email}
                                      </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 font-mono" dir="ltr">
                                      <span>UID: {member.uid}</span>
                                      <button
                                        type="button"
                                        title={isHe ? 'העתק UID' : 'Copy UID'}
                                        onClick={() => {
                                          navigator.clipboard.writeText(member.uid);
                                          setCopiedMemberUid(member.uid);
                                          setTimeout(() => setCopiedMemberUid(null), 2000);
                                        }}
                                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                      >
                                        {copiedMemberUid === member.uid ? (
                                          <Check className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </span>
                                    {member.updatedAt && (
                                      <span className="font-mono-tabular">
                                        {isHe ? 'עודכן: ' : 'Updated: '}
                                        {new Date(member.updatedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingMember(isEditingThis ? null : { ...member })
                                  }
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                    isEditingThis
                                      ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>
                                    {isEditingThis
                                      ? isHe
                                        ? 'סגור עריכה'
                                        : 'Close'
                                      : isHe
                                      ? 'ערוך הרשאות'
                                      : 'Edit Permissions'}
                                  </span>
                                </button>

                                {onDeleteTeamMember && (
                                  <button
                                    type="button"
                                    disabled={isDeletingThis}
                                    title={isHe ? 'הסר גישה' : 'Revoke Access'}
                                    onClick={() => handleRevokeMember(member)}
                                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-45"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Saved Permitted Access Summary Chips */}
                            {!isEditingThis && (
                              <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 rtl:mr-0 rtl:ml-1">
                                  {isHe ? 'הרשאות שמורות:' : 'Saved Access:'}
                                </span>
                                {enabledPermissions.length === 0 ? (
                                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                                    {isHe ? 'אין הרשאות פעילות' : 'No permissions granted'}
                                  </span>
                                ) : (
                                  enabledPermissions.map(sw => (
                                    <span
                                      key={sw.key}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>{isHe ? sw.labelHe : sw.labelEn}</span>
                                    </span>
                                  ))
                                )}
                              </div>
                            )}

                            {/* Inline Edit Permissions Panel */}
                            {isEditingThis && editingMember && (
                              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3 bg-white dark:bg-slate-900 rounded-xl p-3.5 border">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                      {isHe ? 'שם תצוגה' : 'Display Name'}
                                    </label>
                                    <input
                                      type="text"
                                      value={editingMember.displayName}
                                      onChange={e =>
                                        setEditingMember(prev =>
                                          prev ? { ...prev, displayName: e.target.value } : prev
                                        )
                                      }
                                      className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
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
                                      value={editingMember.email || ''}
                                      onChange={e =>
                                        setEditingMember(prev =>
                                          prev ? { ...prev, email: e.target.value } : prev
                                        )
                                      }
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                      {isHe ? 'תבנית תפקיד' : 'Role Preset'}
                                    </label>
                                    <select
                                      value={editingMember.role}
                                      onChange={e => {
                                        const role = e.target.value as TeamUserRole;
                                        const flags = extractFlagsFromPreset(role);
                                        setEditingMember(prev =>
                                          prev
                                            ? {
                                                ...prev,
                                                role,
                                                canViewPlayers: flags.canViewPlayers,
                                                canCreatePlayers: flags.canCreatePlayers,
                                                canEditPlayers: flags.canEditPlayers,
                                                canDeletePlayers: flags.canDeletePlayers,
                                                canAccessScouting: flags.canAccessScouting,
                                                canEditTracker: flags.canEditTracker
                                              }
                                            : prev
                                        );
                                      }}
                                      className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
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

                                <div className="flex flex-wrap items-center gap-2">
                                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(editingMember.active)}
                                      onChange={e =>
                                        setEditingMember(prev =>
                                          prev ? { ...prev, active: e.target.checked } : prev
                                        )
                                      }
                                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span
                                      className={
                                        editingMember.active
                                          ? 'text-emerald-700 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400'
                                      }
                                    >
                                      {editingMember.active
                                        ? isHe
                                          ? 'חשבון פעיל'
                                          : 'Account Active'
                                        : isHe
                                        ? 'חשבון מושעה'
                                        : 'Suspended'}
                                    </span>
                                  </label>

                                  {PERMISSION_SWITCHES.map(sw => (
                                    <label
                                      key={sw.key}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={Boolean(editingMember[sw.key])}
                                        onChange={e =>
                                          setEditingMember(prev =>
                                            prev ? { ...prev, [sw.key]: e.target.checked } : prev
                                          )
                                        }
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                      />
                                      <span>{isHe ? sw.labelHe : sw.labelEn}</span>
                                    </label>
                                  ))}
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingMember(null)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  >
                                    {isHe ? 'ביטול' : 'Cancel'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSavingThis}
                                    onClick={handleSaveEditedMember}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
                                  >
                                    {isSavingThis ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Save className="w-3.5 h-3.5" />
                                    )}
                                    <span>
                                      {isSavingThis
                                        ? isHe
                                          ? 'שומר...'
                                          : 'Saving...'
                                        : isHe
                                        ? 'שמור הרשאות'
                                        : 'Save Permissions'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION 2: CREATE NEW USER RULE (with access permission checkboxes!) */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3.5">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {isHe
                          ? 'יצירת חוק גישה למשתמש חדש (מאושר ב-Firebase)'
                          : 'Create New User Rule (Approve Firebase User)'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isHe
                          ? 'הזן את ה-UID של המשתמש מ-Firebase Authentication, סמן את ההרשאות המותרות ולחץ שמור כדי לצרף אותו לרשימת המאושרים למעלה.'
                          : 'Enter the user’s Firebase Auth UID, check the access permissions you want to grant, and save to add them to Approved Users above.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          {isHe ? 'מזהה משתמש (Firebase UID) *' : 'Firebase User UID *'}
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={newMemberUid}
                          onChange={e => setNewMemberUid(e.target.value)}
                          placeholder="e.g. SfddR4t71dWVcER..."
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          {isHe ? 'שם המשתמש' : 'Display Name'}
                        </label>
                        <input
                          type="text"
                          value={newMemberName}
                          onChange={e => setNewMemberName(e.target.value)}
                          placeholder={isHe ? 'שם מלא / כינוי' : 'e.g. Aviv Kamara'}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          {isHe ? 'אימייל (לתיעוד)' : 'Email Note'}
                        </label>
                        <input
                          type="email"
                          dir="ltr"
                          value={newMemberEmail}
                          onChange={e => setNewMemberEmail(e.target.value)}
                          placeholder="user@agency.com"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          {isHe ? 'תבנית תפקיד' : 'Role Preset'}
                        </label>
                        <select
                          value={newMemberRole}
                          onChange={e => handleNewRolePresetChange(e.target.value as TeamUserRole)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="regular">{isHe ? 'משתמש רגיל (צפייה + יצירה)' : 'Regular User (View & Create)'}</option>
                          <option value="manager">{isHe ? 'מנהל (צפייה + יצירה + עריכה)' : 'Manager (Full Edit & Scouting)'}</option>
                          <option value="viewer">{isHe ? 'צופה בלבד' : 'Viewer (Read Only)'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Access Permission Checkboxes for the New Rule */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {isHe ? 'הרשאות גישה מותרות למשתמש:' : 'Permitted Access Checkboxes:'}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newMemberFlags.active}
                            onChange={e =>
                              setNewMemberFlags(prev => ({ ...prev, active: e.target.checked }))
                            }
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span
                            className={
                              newMemberFlags.active
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {isHe ? 'חשבון פעיל' : 'Active Account'}
                          </span>
                        </label>

                        {PERMISSION_SWITCHES.map(sw => (
                          <label
                            key={sw.key}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-700 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(newMemberFlags[sw.key])}
                              onChange={e =>
                                setNewMemberFlags(prev => ({
                                  ...prev,
                                  [sw.key]: e.target.checked
                                }))
                              }
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{isHe ? sw.labelHe : sw.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        disabled={!newMemberUid.trim() || !onSaveTeamMember || isCreatingMember}
                        onClick={handleCreateMemberRule}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                      >
                        {isCreatingMember ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isCreatingMember
                            ? isHe
                              ? 'שומר משתמש...'
                              : 'Saving User Rule...'
                            : isHe
                            ? 'שמור והוסף משתמש מאושר'
                            : 'Save & Approve User'}
                        </span>
                      </button>
                    </div>
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
