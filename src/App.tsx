import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Player,
  TalkProspect,
  TalkStage,
  ForeignProspect,
  ConversationLog,
  YouthCategory,
  AgentProfile,
  Language,
  Currency,
  TrackedPlayer,
  TrackerCategory,
  NavigationTab,
  TrainingAgreementData,
  TeamMemberRule,
  WorkspacePermissions
} from './types/player';
import { INITIAL_PLAYERS, INITIAL_PROSPECTS } from './data/mockPlayers';
import { INITIAL_TRACKED_PLAYERS } from './data/mockTrackedPlayers';
import { DEFAULT_AGENTS } from './data/defaultAgents';
import { getContractDaysRemaining } from './utils/contractAlerts';
import { getUpcomingBirthdays } from './utils/birthdayAlerts';
import { getDefaultNextTransferWindowDate } from './utils/trainingCompensation';
import {
  findMatchingTrackedPlayer,
  syncExistingTrackedPlayersWithRosters
} from './utils/trainingAgreementSync';
import { TRANSLATIONS } from './translations/translations';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { PlayerListView } from './components/PlayerListView';
import { InTalkWithView } from './components/InTalkWithView';
import { AlertsHubView } from './components/AlertsHubView';
import { AgentSettingsView } from './components/AgentSettingsView';
import { PlayerTrackerView } from './components/PlayerTrackerView';
import { TrainingCompensationView } from './components/TrainingCompensationView';
import { YouthMatchesView } from './components/YouthMatchesView';
import { AddTrackedPlayerModal } from './components/AddTrackedPlayerModal';
import { ManualMinutesModal } from './components/ManualMinutesModal';
import { PlayerModal } from './components/PlayerModal';
import { ProspectModal } from './components/ProspectModal';
import { ForeignProspectModal } from './components/ForeignProspectModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { ConversationLogModal } from './components/ConversationLogModal';
import { QuickExtendModal } from './components/QuickExtendModal';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AuthModal } from './components/AuthModal';
import { LoginPortalView } from './components/LoginPortalView';
import { CheckCircle2, X, ShieldAlert, LogOut, Copy, Check } from 'lucide-react';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  loginWithEmail,
  resetPasswordWithEmail,
  getAuthErrorDiagnostic
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  subscribeToPlayers,
  savePlayerToFirestore,
  deletePlayerFromFirestore,
  deleteMultiplePlayersFromFirestore,
  subscribeToMalePlayers,
  saveMalePlayerToFirestore,
  deleteMalePlayerFromFirestore,
  deleteMultipleMalePlayersFromFirestore,
  subscribeToProspects,
  saveProspectToFirestore,
  deleteProspectFromFirestore,
  subscribeToTrackedPlayers,
  saveTrackedPlayerToFirestore,
  deleteTrackedPlayerFromFirestore,
  deleteMultipleTrackedPlayersFromFirestore,
  subscribeToForeignProspects,
  saveForeignProspectToFirestore,
  deleteForeignProspectFromFirestore,
  subscribeToAgents,
  saveAgentsToFirestore,
  subscribeToPreferences,
  savePreferencesToFirestore,
  syncLocalDataToFirestoreIfEmpty,
  registerWorkspaceDirectory,
  seedDefaultTeamMemberIfMissing,
  resolveWorkspaceForUser,
  subscribeToTeamMembers,
  subscribeToMyTeamMemberRule,
  saveTeamMemberRuleToFirestore,
  deleteTeamMemberRuleFromFirestore,
  isQuotaExceededError,
  resetWriteQuotaPause
} from './services/firestoreService';

export default function App() {
  // Purge legacy mock data on first load to give user a pristine clean canvas
  useEffect(() => {
    try {
      if (!localStorage.getItem('aura_agency_v4_cleared')) {
        localStorage.removeItem('aura_agency_players_v3');
        localStorage.removeItem('aura_agency_prospects_v3');
        localStorage.removeItem('aura_player_tracker_v1');
        localStorage.setItem('aura_agency_v4_cleared', 'true');
      }
    } catch (e) {}
  }, []);

  // Language state (English ⇄ Hebrew)
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('aura_agency_language_v1');
      if (stored === 'he' || stored === 'en') return stored;
    } catch (e) {
      console.error('Failed to load language', e);
    }
    return 'en';
  });

  // Currency state (EUR, USD, ILS/NIS)
  const [currency, setCurrency] = useState<Currency>(() => {
    try {
      const stored = localStorage.getItem('aura_agency_currency_v1');
      if (stored === 'EUR' || stored === 'USD' || stored === 'ILS') return stored;
    } catch (e) {
      console.error('Failed to load currency', e);
    }
    return 'EUR';
  });

  // Global Target Transfer Window Opening Date (used for roster training compensation estimates)
  const [nextTransferWindowDate, setNextTransferWindowDate] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('aura_next_transfer_window_date_v1');
      if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) return stored;
    } catch (e) {
      console.error('Failed to load nextTransferWindowDate', e);
    }
    return getDefaultNextTransferWindowDate();
  });

  // Selected Male & Female player keys for Dashboard Next Match Center
  const [watchedNextMatchKeys, setWatchedNextMatchKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('aura_watched_next_match_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((x): x is string => typeof x === 'string').slice(0, 24);
        }
      }
    } catch (e) {
      console.error('Failed to load watchedNextMatchKeys', e);
    }
    return [];
  });

  // User-owned Female Roster Players State
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const stored = localStorage.getItem('aura_agency_players_v4');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load players from storage', e);
    }
    return INITIAL_PLAYERS;
  });

  // User-owned Male / Youth Roster Players State
  const [malePlayers, setMalePlayers] = useState<Player[]>(() => {
    try {
      const stored = localStorage.getItem('aura_male_players_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load male players from storage', e);
    }
    return [];
  });

  // User-owned Prospects State
  const [prospects, setProspects] = useState<TalkProspect[]>(() => {
    try {
      const stored = localStorage.getItem('aura_agency_prospects_v4');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load prospects from storage', e);
    }
    return INITIAL_PROSPECTS;
  });

  // User-owned Tracked Players State (Player Tracker)
  const [trackedPlayers, setTrackedPlayers] = useState<TrackedPlayer[]>(() => {
    try {
      const stored = localStorage.getItem('aura_player_tracker_v2');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load tracked players from storage', e);
    }
    return INITIAL_TRACKED_PLAYERS;
  });

  // User-owned International / Foreign Female Prospects State
  const [foreignProspects, setForeignProspects] = useState<ForeignProspect[]>(() => {
    try {
      const stored = localStorage.getItem('aura_foreign_prospects_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load foreign prospects from storage', e);
    }
    return [];
  });

  // Agency Agents Directory State (Roy Shpitalnik & Aviv Kamara)
  const [agents, setAgents] = useState<AgentProfile[]>(() => {
    try {
      const stored = localStorage.getItem('aura_agency_agents_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load agents from storage', e);
    }
    return DEFAULT_AGENTS;
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [inTalkSubTab, setInTalkSubTab] = useState<'candidates' | 'foreign'>('candidates');
  const [alertsSubTab, setAlertsSubTab] = useState<'contracts' | 'birthdays'>('contracts');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Firebase Auth, Workspace RBAC & Cloud Syncing state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [hasChosenLocalWorkspace, setHasChosenLocalWorkspace] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('aura_local_guest_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [workspaceUid, setWorkspaceUid] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<'local' | 'owner' | 'member' | 'disabled' | 'unauthorized'>('local');
  const [myMemberRule, setMyMemberRule] = useState<TeamMemberRule | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberRule[]>([]);
  const [copiedUid, setCopiedUid] = useState(false);

  // Sync & Quota Safety Refs (prevents preference echo write-loops and quota backoff storms)
  const isWriteQuotaPausedRef = useRef<boolean>(false);
  const hasShownQuotaToastRef = useRef<boolean>(false);
  const lastSavedPersonalPrefsJsonRef = useRef<string | null>(null);
  const lastRemoteWatchedKeysRef = useRef<string | null>(null);
  const prevPersonalPrefsTupleRef = useRef<{
    language: Language;
    currency: Currency;
    isDarkMode: boolean;
    watchedKeysJson: string;
  } | null>(null);

  const permissions = useMemo<WorkspacePermissions>(() => {
    if (accessStatus === 'local' || accessStatus === 'owner') {
      return {
        canViewPlayers: true,
        canCreatePlayers: true,
        canEditPlayers: true,
        canDeletePlayers: true,
        canAccessScouting: true,
        canEditTracker: true,
        isOwner: true
      };
    }
    if (accessStatus === 'member' && myMemberRule && myMemberRule.active) {
      return {
        canViewPlayers: myMemberRule.canViewPlayers,
        canCreatePlayers: myMemberRule.canCreatePlayers,
        canEditPlayers: myMemberRule.canEditPlayers,
        canDeletePlayers: myMemberRule.canDeletePlayers,
        canAccessScouting: myMemberRule.canAccessScouting,
        canEditTracker: myMemberRule.canEditTracker,
        isOwner: false
      };
    }
    return {
      canViewPlayers: false,
      canCreatePlayers: false,
      canEditPlayers: false,
      canDeletePlayers: false,
      canAccessScouting: false,
      canEditTracker: false,
      isOwner: false
    };
  }, [accessStatus, myMemberRule]);

  const accessRoleLabel = useMemo(() => {
    if (accessStatus === 'owner') return language === 'he' ? 'בעלים' : 'Owner';
    if (accessStatus === 'member' && myMemberRule) {
      if (myMemberRule.role === 'manager') return language === 'he' ? 'מנהל/ת' : 'Manager';
      if (myMemberRule.role === 'viewer') return language === 'he' ? 'צופה' : 'Viewer';
      return language === 'he' ? 'משתמש רגיל' : 'Regular User';
    }
    if (accessStatus === 'disabled') return language === 'he' ? 'מושעה' : 'Suspended';
    if (accessStatus === 'unauthorized') return language === 'he' ? 'ממתין לאישור' : 'Pending Approval';
    return undefined;
  }, [accessStatus, myMemberRule, language]);

  // Mobile sidebar drawer state & Desktop icon-rail collapse state
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aura_sidebar_collapsed_v1') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aura_sidebar_collapsed_v1', String(isSidebarCollapsed));
    } catch (e) {
      console.error('Failed to persist sidebar state', e);
    }
  }, [isSidebarCollapsed]);

  // Modal dialog states
  const [isAddTrackedModalOpen, setIsAddTrackedModalOpen] = useState(false);
  const [trackedPlayerToEdit, setTrackedPlayerToEdit] = useState<TrackedPlayer | null>(null);
  const [defaultTrackerCategory, setDefaultTrackerCategory] = useState<TrackerCategory>('U17');

  // Manual Playing Time Modal State
  const [manualMinutesPlayer, setManualMinutesPlayer] = useState<TrackedPlayer | null>(null);

  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [playerModalRosterType, setPlayerModalRosterType] = useState<'female' | 'male'>('female');

  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);
  const [prospectToEdit, setProspectToEdit] = useState<TalkProspect | null>(null);

  const [isForeignProspectModalOpen, setIsForeignProspectModalOpen] = useState(false);
  const [foreignProspectToEdit, setForeignProspectToEdit] = useState<ForeignProspect | null>(null);

  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [detailPlayerRosterType, setDetailPlayerRosterType] = useState<'female' | 'male'>('female');
  const [quickExtendPlayer, setQuickExtendPlayer] = useState<Player | null>(null);
  const [quickExtendRosterType, setQuickExtendRosterType] = useState<'female' | 'male'>('female');

  // Cloud Database Authentication & Diagnostic Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDiagnostic, setAuthDiagnostic] = useState<any>(null);

  // Easy Deletion states
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean;
    type:
      | 'single_player'
      | 'multiple_players'
      | 'single_male_player'
      | 'multiple_male_players'
      | 'single_prospect'
      | 'single_foreign_prospect'
      | 'single_tracked'
      | 'multiple_tracked';
    player?: Player;
    playerIds?: string[];
    prospect?: TalkProspect;
    foreignProspect?: ForeignProspect;
    trackedPlayer?: TrackedPlayer;
    trackedIds?: string[];
  }>({
    isOpen: false,
    type: 'single_player'
  });

  const [videoModalData, setVideoModalData] = useState<{
    isOpen: boolean;
    title: string;
    videoUrl: string;
    description?: string;
    item?: any;
  }>({
    isOpen: false,
    title: '',
    videoUrl: '',
  });

  const [conversationModalProspect, setConversationModalProspect] = useState<TalkProspect | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync language, direction (RTL for Hebrew, LTR for English)
  useEffect(() => {
    try {
      localStorage.setItem('aura_agency_language_v1', language);
    } catch (e) {
      console.error('Failed to persist language', e);
    }
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [language]);

  const handleToggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'he' : 'en'));
  };

  // Sync dark mode class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Persist currency
  useEffect(() => {
    try {
      localStorage.setItem('aura_agency_currency_v1', currency);
    } catch (e) {
      console.error('Failed to persist currency', e);
    }
  }, [currency]);

  // Keep activeTab valid for current user permissions
  useEffect(() => {
    if (activeTab === 'agent-settings' && !permissions.isOwner) {
      setActiveTab('dashboard');
    } else if (activeTab === 'in-talk' && !permissions.canAccessScouting) {
      setActiveTab('dashboard');
    } else if (
      (activeTab === 'roster' || activeTab === 'male-roster' || activeTab === 'alerts' || activeTab === 'compensation') &&
      !permissions.canViewPlayers
    ) {
      setActiveTab('dashboard');
    } else if (activeTab === 'tracker' && !permissions.canViewPlayers && !permissions.canEditTracker) {
      setActiveTab('dashboard');
    }
  }, [activeTab, permissions]);

  // Persist female players (only in local or owner mode so restricted team sessions don't overwrite owner cache)
  useEffect(() => {
    if (accessStatus !== 'local' && accessStatus !== 'owner') return;
    try {
      localStorage.setItem('aura_agency_players_v4', JSON.stringify(players));
    } catch (e) {
      console.error('Failed to save players', e);
    }
  }, [players, accessStatus]);

  // Persist male players
  useEffect(() => {
    if (accessStatus !== 'local' && accessStatus !== 'owner') return;
    try {
      localStorage.setItem('aura_male_players_v1', JSON.stringify(malePlayers));
    } catch (e) {
      console.error('Failed to save male players', e);
    }
  }, [malePlayers, accessStatus]);

  // Persist prospects
  useEffect(() => {
    if (accessStatus !== 'local' && accessStatus !== 'owner') return;
    try {
      localStorage.setItem('aura_agency_prospects_v4', JSON.stringify(prospects));
    } catch (e) {
      console.error('Failed to save prospects', e);
    }
  }, [prospects, accessStatus]);

  // Persist tracked players (Player Tracker)
  useEffect(() => {
    if (accessStatus !== 'local' && accessStatus !== 'owner') return;
    try {
      localStorage.setItem('aura_player_tracker_v2', JSON.stringify(trackedPlayers));
    } catch (e) {
      console.error('Failed to save tracked players', e);
    }
  }, [trackedPlayers, accessStatus]);

  // Persist foreign prospects
  useEffect(() => {
    if (accessStatus !== 'local' && accessStatus !== 'owner') return;
    try {
      localStorage.setItem('aura_foreign_prospects_v1', JSON.stringify(foreignProspects));
    } catch (e) {
      console.error('Failed to save foreign prospects', e);
    }
  }, [foreignProspects, accessStatus]);

  // Persist agent directory settings
  useEffect(() => {
    if (accessStatus !== 'local' && accessStatus !== 'owner') return;
    try {
      localStorage.setItem('aura_agency_agents_v1', JSON.stringify(agents));
    } catch (e) {
      console.error('Failed to save agents', e);
    }
  }, [agents, accessStatus]);

  // Persist global transfer window opening date
  useEffect(() => {
    if (accessStatus !== 'local' && accessStatus !== 'owner') return;
    try {
      localStorage.setItem('aura_next_transfer_window_date_v1', nextTransferWindowDate);
    } catch (e) {
      console.error('Failed to save nextTransferWindowDate', e);
    }
  }, [nextTransferWindowDate, accessStatus]);

  // Persist Dashboard Next Match selected player keys
  useEffect(() => {
    try {
      localStorage.setItem('aura_watched_next_match_v1', JSON.stringify(watchedNextMatchKeys));
    } catch (e) {
      console.error('Failed to save watchedNextMatchKeys', e);
    }
  }, [watchedNextMatchKeys]);

  // 1) Firebase Auth & Workspace Role Resolution
  useEffect(() => {
    let unsubTeamMembers: (() => void) | undefined;
    let unsubMyRule: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubTeamMembers) {
        unsubTeamMembers();
        unsubTeamMembers = undefined;
      }
      if (unsubMyRule) {
        unsubMyRule();
        unsubMyRule = undefined;
      }

      setCurrentUser(user);

      if (!user) {
        setWorkspaceUid(null);
        setAccessStatus('local');
        setMyMemberRule(null);
        setTeamMembers([]);
        resetWriteQuotaPause();
        isWriteQuotaPausedRef.current = false;
        hasShownQuotaToastRef.current = false;
        lastSavedPersonalPrefsJsonRef.current = null;
        lastRemoteWatchedKeysRef.current = null;
        prevPersonalPrefsTupleRef.current = null;
        setIsAuthReady(true);
        return;
      }

      resetWriteQuotaPause();
      isWriteQuotaPausedRef.current = false;
      hasShownQuotaToastRef.current = false;
      lastSavedPersonalPrefsJsonRef.current = null;
      lastRemoteWatchedKeysRef.current = null;
      prevPersonalPrefsTupleRef.current = null;

      setIsCloudSyncing(true);
      try {
        const res = await resolveWorkspaceForUser(user);

        if (res.status === 'owner') {
          setWorkspaceUid(res.workspaceUid);
          setAccessStatus('owner');
          setMyMemberRule(null);

          try {
            await registerWorkspaceDirectory(user.uid);
            await seedDefaultTeamMemberIfMissing(user.uid);
            await syncLocalDataToFirestoreIfEmpty(user.uid, players, prospects, trackedPlayers, foreignProspects, malePlayers, agents);
          } catch (err) {
            if (isQuotaExceededError(err)) {
              isWriteQuotaPausedRef.current = true;
            } else {
              console.error('Error initializing owner workspace:', err);
            }
          }

          unsubTeamMembers = subscribeToTeamMembers(
            user.uid,
            (members) => {
              setTeamMembers(members);
            },
            (err) => handleBackgroundQuotaError(err)
          );
        } else if (res.status === 'member' || res.status === 'disabled') {
          setWorkspaceUid(res.workspaceUid);
          setMyMemberRule(res.rule);
          setAccessStatus(res.status);
          setTeamMembers([]);

          if (res.status === 'disabled') {
            setPlayers([]);
            setMalePlayers([]);
            setProspects([]);
            setForeignProspects([]);
            setTrackedPlayers([]);
          }

          unsubMyRule = subscribeToMyTeamMemberRule(res.workspaceUid, user.uid, (liveRule) => {
            if (!liveRule) {
              setMyMemberRule(null);
              setAccessStatus('unauthorized');
            } else if (!liveRule.active) {
              setMyMemberRule(liveRule);
              setAccessStatus('disabled');
            } else {
              setMyMemberRule(liveRule);
              setAccessStatus('member');
            }
          });
        } else {
          setWorkspaceUid(null);
          setMyMemberRule(null);
          setTeamMembers([]);
          setAccessStatus('unauthorized');
          setPlayers([]);
          setMalePlayers([]);
          setProspects([]);
          setForeignProspects([]);
          setTrackedPlayers([]);
        }
      } catch (err) {
        console.error('Workspace resolution error:', err);
        setAccessStatus('unauthorized');
      } finally {
        setIsCloudSyncing(false);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubTeamMembers) unsubTeamMembers();
      if (unsubMyRule) unsubMyRule();
    };
  }, []);

  // 2) Permission-Scoped Real-time Firestore Data Subscriptions
  useEffect(() => {
    if (!currentUser || !workspaceUid || (accessStatus !== 'owner' && accessStatus !== 'member')) {
      return;
    }

    let unsubPlayers: (() => void) | undefined;
    let unsubMalePlayers: (() => void) | undefined;
    let unsubProspects: (() => void) | undefined;
    let unsubTracked: (() => void) | undefined;
    let unsubForeign: (() => void) | undefined;
    let unsubAgents: (() => void) | undefined;
    let unsubWorkspacePrefs: (() => void) | undefined;
    let unsubPersonalPrefs: (() => void) | undefined;

    if (permissions.canViewPlayers) {
      unsubPlayers = subscribeToPlayers(
        workspaceUid,
        (remotePlayers) => {
          setPlayers(remotePlayers);
        },
        handleBackgroundQuotaError
      );
      unsubMalePlayers = subscribeToMalePlayers(
        workspaceUid,
        (remoteMalePlayers) => {
          setMalePlayers(remoteMalePlayers);
        },
        handleBackgroundQuotaError
      );
    } else {
      setPlayers([]);
      setMalePlayers([]);
    }

    if (permissions.canAccessScouting) {
      unsubProspects = subscribeToProspects(
        workspaceUid,
        (remoteProspects) => {
          setProspects(remoteProspects);
        },
        handleBackgroundQuotaError
      );
      unsubForeign = subscribeToForeignProspects(
        workspaceUid,
        (remoteForeign) => {
          setForeignProspects(remoteForeign);
        },
        handleBackgroundQuotaError
      );
    } else {
      setProspects([]);
      setForeignProspects([]);
    }

    if (permissions.canViewPlayers || permissions.canEditTracker) {
      unsubTracked = subscribeToTrackedPlayers(
        workspaceUid,
        (remoteTracked) => {
          setTrackedPlayers(remoteTracked);
        },
        handleBackgroundQuotaError
      );
    } else {
      setTrackedPlayers([]);
    }

    unsubAgents = subscribeToAgents(
      workspaceUid,
      (remoteAgents) => {
        setAgents(remoteAgents);
      },
      handleBackgroundQuotaError
    );

    unsubWorkspacePrefs = subscribeToPreferences(
      workspaceUid,
      (remotePrefs) => {
        if (remotePrefs.nextTransferWindowDate && /^\d{4}-\d{2}-\d{2}$/.test(remotePrefs.nextTransferWindowDate)) {
          const remoteDate = remotePrefs.nextTransferWindowDate;
          setNextTransferWindowDate(prev => (prev === remoteDate ? prev : remoteDate));
        }
        if (permissions.isOwner && Array.isArray(remotePrefs.watchedNextMatchKeys)) {
          const nextKeys = remotePrefs.watchedNextMatchKeys
            .filter((x): x is string => typeof x === 'string')
            .slice(0, 24);
          lastRemoteWatchedKeysRef.current = JSON.stringify(nextKeys);
          setWatchedNextMatchKeys(prev =>
            prev.length === nextKeys.length && prev.every((k, i) => k === nextKeys[i])
              ? prev
              : nextKeys
          );
        }
      },
      handleBackgroundQuotaError
    );

    if (!permissions.isOwner) {
      unsubPersonalPrefs = subscribeToPreferences(
        currentUser.uid,
        (myPrefs) => {
          if (Array.isArray(myPrefs.watchedNextMatchKeys)) {
            const nextKeys = myPrefs.watchedNextMatchKeys
              .filter((x): x is string => typeof x === 'string')
              .slice(0, 24);
            lastRemoteWatchedKeysRef.current = JSON.stringify(nextKeys);
            setWatchedNextMatchKeys(prev =>
              prev.length === nextKeys.length && prev.every((k, i) => k === nextKeys[i])
                ? prev
                : nextKeys
            );
          }
        },
        handleBackgroundQuotaError
      );
    }

    return () => {
      if (unsubPlayers) unsubPlayers();
      if (unsubMalePlayers) unsubMalePlayers();
      if (unsubProspects) unsubProspects();
      if (unsubTracked) unsubTracked();
      if (unsubForeign) unsubForeign();
      if (unsubAgents) unsubAgents();
      if (unsubWorkspacePrefs) unsubWorkspacePrefs();
      if (unsubPersonalPrefs) unsubPersonalPrefs();
    };
  }, [
    currentUser?.uid,
    workspaceUid,
    accessStatus,
    permissions.canViewPlayers,
    permissions.canAccessScouting,
    permissions.canEditTracker,
    permissions.isOwner
  ]);

  const handleBackgroundQuotaError = (err: unknown) => {
    if (isQuotaExceededError(err)) {
      isWriteQuotaPausedRef.current = true;
      if (!hasShownQuotaToastRef.current) {
        hasShownQuotaToastRef.current = true;
        showToast(
          language === 'he'
            ? 'מכסת הכתיבה היומית ב-Firestore הגיעה לגבול (המכסה מתאפסת מחר). השינויים נשמרים מקומית בינתיים.'
            : 'Firestore daily free write quota reached (resets tomorrow). Changes remain saved locally in the meantime.'
        );
      }
      return;
    }
    console.error(err);
  };

  // Sync personal UI preferences only when the user actually changes them locally (never echo remote snapshots)
  useEffect(() => {
    if (!currentUser || (accessStatus !== 'owner' && accessStatus !== 'member')) {
      return;
    }

    const watchedKeysJson = JSON.stringify(watchedNextMatchKeys);
    const currentJson = JSON.stringify({ language, currency, isDarkMode, watchedNextMatchKeys });
    const prevTuple = prevPersonalPrefsTupleRef.current;

    if (!prevTuple || lastSavedPersonalPrefsJsonRef.current === null) {
      prevPersonalPrefsTupleRef.current = { language, currency, isDarkMode, watchedKeysJson };
      lastSavedPersonalPrefsJsonRef.current = currentJson;
      return;
    }

    const onlyWatchedKeysChangedFromRemote =
      prevTuple.language === language &&
      prevTuple.currency === currency &&
      prevTuple.isDarkMode === isDarkMode &&
      prevTuple.watchedKeysJson !== watchedKeysJson &&
      watchedKeysJson === lastRemoteWatchedKeysRef.current;

    prevPersonalPrefsTupleRef.current = { language, currency, isDarkMode, watchedKeysJson };

    if (onlyWatchedKeysChangedFromRemote || lastSavedPersonalPrefsJsonRef.current === currentJson) {
      lastSavedPersonalPrefsJsonRef.current = currentJson;
      return;
    }

    if (isWriteQuotaPausedRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (isWriteQuotaPausedRef.current) return;
      lastSavedPersonalPrefsJsonRef.current = currentJson;
      savePreferencesToFirestore(currentUser.uid, {
        language,
        currency,
        isDarkMode,
        watchedNextMatchKeys
      }).catch(handleBackgroundQuotaError);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [currentUser, accessStatus, language, currency, isDarkMode, watchedNextMatchKeys]);

  // Keep existing Player Tracker entries aligned in-memory with Female & Male Rosters (explicit saves & manual Sync button persist to Firestore)
  useEffect(() => {
    if (trackedPlayers.length === 0) return;
    if (players.length === 0 && malePlayers.length === 0) return;

    const { nextTrackedPlayers, updatedTrackedPlayers } = syncExistingTrackedPlayersWithRosters(
      trackedPlayers,
      players,
      malePlayers
    );

    if (updatedTrackedPlayers.length > 0) {
      setTrackedPlayers(nextTrackedPlayers);
    }
  }, [players, malePlayers, trackedPlayers]);

  const handleChangeNextTransferWindowDate = (newDate: string) => {
    if (currentUser && !permissions.isOwner) return;
    setNextTransferWindowDate(newDate);
    if (currentUser && workspaceUid && permissions.isOwner && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      savePreferencesToFirestore(workspaceUid, {
        language,
        currency,
        isDarkMode,
        nextTransferWindowDate: newDate
      }).catch(handleBackgroundQuotaError);
    }
  };

  // Authentication Handlers (Google Owner Sign-In & Team Email/Password Sign-In)
  const handleGoogleLogin = async () => {
    try {
      setIsCloudSyncing(true);
      await loginWithGoogle();
      setIsAuthModalOpen(false);
      setAuthDiagnostic(null);
      showToast(language === 'he' ? 'התחברת בהצלחה עם Google. הנתונים מסונכרנים לענן.' : 'Signed in with Google. Data is now synced to Firebase.');
    } catch (err: any) {
      console.error('Login error:', err);
      const diag = getAuthErrorDiagnostic(err);
      setAuthDiagnostic(diag);
      if (hasChosenLocalWorkspace || currentUser) {
        setIsAuthModalOpen(true);
        showToast(language === 'he' ? 'שגיאה בהתחברות ל-Google. נפתח מדריך פתרון.' : 'Failed to sign in with Google. Solution guide opened.');
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    try {
      setIsCloudSyncing(true);
      await loginWithEmail(email, pass);
      setIsAuthModalOpen(false);
      setAuthDiagnostic(null);
      showToast(language === 'he' ? 'התחברת בהצלחה! החשבון מסונכרן מול סביבת העבודה.' : 'Signed in successfully! Syncing with agency workspace.');
    } catch (err: any) {
      console.error('Email login error:', err);
      throw err;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    await resetPasswordWithEmail(email);
    showToast(language === 'he' ? 'נשלח מייל לאיפוס סיסמה.' : 'Password reset email sent.');
  };

  const handleContinueLocal = () => {
    setHasChosenLocalWorkspace(true);
    setAuthDiagnostic(null);
    try {
      sessionStorage.setItem('aura_local_guest_v1', 'true');
    } catch {
      // Ignore storage failures
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setWorkspaceUid(null);
      setAccessStatus('local');
      setMyMemberRule(null);
      setTeamMembers([]);
      setHasChosenLocalWorkspace(false);
      try {
        sessionStorage.removeItem('aura_local_guest_v1');
      } catch {
        // Ignore storage failures
      }
      showToast(language === 'he' ? 'התנתקת בהצלחה.' : 'Signed out.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Unified contract alerts across both Female and Male rosters (expiring <= 30 days or expired)
  const criticalAlertsCount =
    players.filter(p => getContractDaysRemaining(p.contractExpiryDate) <= 30).length +
    malePlayers.filter(p => getContractDaysRemaining(p.contractExpiryDate) <= 30).length;

  // Unified upcoming birthdays across both Female and Male rosters (next 30 days)
  const upcomingBirthdaysCount =
    getUpcomingBirthdays(players, 30).length +
    getUpcomingBirthdays(malePlayers, 30).length;

  // Male Youth Roster count (U14-U17) for Sidebar Youth Matches badge
  const maleYouthU14ToU17Count = useMemo(() => {
    return malePlayers.filter(p => {
      if (p.youthCategory === 'U14' || p.youthCategory === 'U15' || p.youthCategory === 'U16' || p.youthCategory === 'U17') {
        return true;
      }
      if (p.youthCategory === 'U19' || p.youthCategory === 'Senior') return false;
      return typeof p.age === 'number' && p.age >= 12 && p.age <= 17;
    }).length;
  }, [malePlayers]);

  // Agent settings save handler (Owner only)
  const handleSaveAgents = (updatedAgents: AgentProfile[]) => {
    if (currentUser && !permissions.isOwner) {
      showToast(language === 'he' ? 'רק בעל הסוכנות יכול לערוך הגדרות סוכנים.' : 'Only the agency owner can edit agent settings.');
      return;
    }
    setAgents(updatedAgents);
    if (currentUser && workspaceUid) {
      saveAgentsToFirestore(workspaceUid, updatedAgents).catch(handleBackgroundQuotaError);
    }
    showToast(language === 'he' ? 'פרטי הסוכנים נשמרו בהצלחה.' : 'Agent contact details saved successfully.');
  };

  // Owner-only CRM Team Access Rules handlers
  const handleSaveTeamMember = async (member: TeamMemberRule) => {
    if (!currentUser || !workspaceUid || !permissions.isOwner) {
      const msg = language === 'he'
        ? 'רק בעל הסוכנות יכול לנהל הרשאות משתמשים.'
        : 'Only the agency owner can edit user access rules.';
      showToast(msg);
      throw new Error(msg);
    }
    try {
      const saved = await saveTeamMemberRuleToFirestore(workspaceUid, {
        ...member,
        userId: workspaceUid
      });
      setTeamMembers(prev => {
        const exists = prev.some(m => m.uid === saved.uid);
        const next = exists
          ? prev.map(m => (m.uid === saved.uid ? saved : m))
          : [...prev, saved];
        return next.sort((a, b) => (a.displayName || a.uid).localeCompare(b.displayName || b.uid));
      });
      showToast(
        language === 'he'
          ? `הרשאות המשתמש נשמרו עבור ${saved.displayName || saved.uid}.`
          : `Access rules saved for ${saved.displayName || saved.uid}.`
      );
    } catch (err: any) {
      if (isQuotaExceededError(err)) {
        isWriteQuotaPausedRef.current = true;
        showToast(
          language === 'he'
            ? 'מכסת הכתיבה היומית ב-Firestore הגיעה לגבול — לא ניתן לשמור הרשאות חדשות עד איפוס המכסה מחר.'
            : 'Firestore daily write quota exceeded — team rule changes cannot be saved until the quota resets tomorrow.'
        );
      } else {
        showToast(
          language === 'he'
            ? 'שגיאה בשמירת הרשאות המשתמש ב-Firebase.'
            : 'Failed to save user access rule to Firebase.'
        );
      }
      throw err;
    }
  };

  const handleDeleteTeamMember = async (memberUid: string) => {
    if (!currentUser || !workspaceUid || !permissions.isOwner) {
      showToast(language === 'he' ? 'רק בעל הסוכנות יכול להסיר משתמשים.' : 'Only the agency owner can revoke user access.');
      return;
    }
    try {
      await deleteTeamMemberRuleFromFirestore(workspaceUid, memberUid);
      setTeamMembers(prev => prev.filter(m => m.uid !== memberUid));
      showToast(language === 'he' ? 'הגישה של המשתמש הוסרה.' : 'User workspace access revoked.');
    } catch (err) {
      if (isQuotaExceededError(err)) {
        isWriteQuotaPausedRef.current = true;
        showToast(
          language === 'he'
            ? 'מכסת הכתיבה היומית ב-Firestore הגיעה לגבול — לא ניתן לעדכן הרשאות עד איפוס המכסה מחר.'
            : 'Firestore daily write quota exceeded — cannot update access rules until the quota resets tomorrow.'
        );
      } else {
        showToast(language === 'he' ? 'שגיאה בהסרת המשתמש.' : 'Failed to revoke user access.');
      }
      throw err;
    }
  };

  // Helper to sync a single roster player update onto any existing matching Player Tracker row (never creates a new row)
  const syncSavedRosterPlayerToExistingTracker = (savedPlayer: Player, rosterType: 'female' | 'male') => {
    if (currentUser && !permissions.canEditTracker) return;
    const matchedTracked = findMatchingTrackedPlayer(savedPlayer, rosterType, trackedPlayers);
    if (!matchedTracked) return;

    const agreement = savedPlayer.trainingAgreement;
    let nextMinPct = matchedTracked.minMinutesClausePct;
    let nextCheckpoint = matchedTracked.minutesCheckpoint;
    if (agreement) {
      if (agreement.minutesClauseEnabled && agreement.minutesThresholdPct && agreement.syncMinutesWithTracker !== false) {
        nextMinPct = agreement.minutesThresholdPct;
        nextCheckpoint = agreement.minutesCheckpoint;
      } else if (!agreement.minutesClauseEnabled) {
        nextMinPct = undefined;
        nextCheckpoint = undefined;
      }
    }

    const updatedTracked: TrackedPlayer = {
      ...matchedTracked,
      linkedPlayerId: savedPlayer.id,
      linkedRosterType: rosterType,
      clubName: savedPlayer.clubName || matchedTracked.clubName,
      league: savedPlayer.league || matchedTracked.league,
      age: savedPlayer.age || matchedTracked.age,
      position: savedPlayer.position || matchedTracked.position,
      photoUrl: savedPlayer.photoUrl || matchedTracked.photoUrl,
      minMinutesClausePct: nextMinPct,
      minutesCheckpoint: nextCheckpoint
    };

    setTrackedPlayers(prev => prev.map(tp => (tp.id === matchedTracked.id ? updatedTracked : tp)));
    if (currentUser && workspaceUid && permissions.canEditTracker) {
      saveTrackedPlayerToFirestore(workspaceUid, updatedTracked).catch(handleBackgroundQuotaError);
    }
  };

  // Handlers for Female & Male Roster Players
  const handleSavePlayer = (savedPlayer: Player) => {
    const targetList = playerModalRosterType === 'male' ? malePlayers : players;
    const isExisting = targetList.some(p => p.id === savedPlayer.id);
    if (currentUser) {
      if (isExisting && !permissions.canEditPlayers) {
        showToast(language === 'he' ? 'אין לך הרשאה לערוך שחקנים קיימים.' : 'You do not have permission to edit existing players.');
        return;
      }
      if (!isExisting && !permissions.canCreatePlayers) {
        showToast(language === 'he' ? 'אין לך הרשאה ליצור שחקנים חדשים.' : 'You do not have permission to create new players.');
        return;
      }
    }

    if (playerModalRosterType === 'male') {
      setMalePlayers(prev => {
        const idx = prev.findIndex(p => p.id === savedPlayer.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = savedPlayer;
          return updated;
        }
        return [savedPlayer, ...prev];
      });
      if (currentUser && workspaceUid) {
        saveMalePlayerToFirestore(workspaceUid, savedPlayer).catch(handleBackgroundQuotaError);
      }
      syncSavedRosterPlayerToExistingTracker(savedPlayer, 'male');
      showToast(language === 'he'
        ? `פרטי השחקן "${savedPlayer.name}" נשמרו בהצלחה.`
        : `Male player "${savedPlayer.name}" representation saved successfully.`);
      return;
    }

    setPlayers(prev => {
      const idx = prev.findIndex(p => p.id === savedPlayer.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedPlayer;
        return updated;
      }
      return [savedPlayer, ...prev];
    });
    if (currentUser && workspaceUid) {
      savePlayerToFirestore(workspaceUid, savedPlayer).catch(handleBackgroundQuotaError);
    }
    syncSavedRosterPlayerToExistingTracker(savedPlayer, 'female');
    showToast(language === 'he' 
      ? `פרטי השחקנית "${savedPlayer.name}" נשמרו בהצלחה.` 
      : `Player "${savedPlayer.name}" representation saved successfully.`);
  };

  // Manual one-click sync of Male & Female Rosters to existing Player Tracker players (never adds new players)
  const handleSyncRostersToTracker = () => {
    if (currentUser && !permissions.canEditTracker) return;
    const { nextTrackedPlayers, updatedTrackedPlayers, linkedCount, unmatchedCount } =
      syncExistingTrackedPlayersWithRosters(trackedPlayers, players, malePlayers);

    if (updatedTrackedPlayers.length > 0) {
      setTrackedPlayers(nextTrackedPlayers);
      if (currentUser && workspaceUid) {
        updatedTrackedPlayers.forEach(tp => {
          saveTrackedPlayerToFirestore(workspaceUid, tp).catch(handleBackgroundQuotaError);
        });
      }
    }

    showToast(
      language === 'he'
        ? `סונכרנו ${linkedCount} שחקנים קיימים מול סגלי בנים ובנות (${updatedTrackedPlayers.length} עודכנו, ${unmatchedCount} ללא תואם, ללא הוספת שחקנים חדשים).`
        : `Synced ${linkedCount} existing Player Tracker players with Male & Female Rosters (${updatedTrackedPlayers.length} updated, ${unmatchedCount} unmatched, no new players added).`
    );
  };

  // Save Training Agreement & Sync Minutes Clause ONLY to existing Player Tracker players (never adds new players)
  const handleSaveTrainingAgreement = (
    playerId: string,
    rosterType: 'female' | 'male',
    agreement: TrainingAgreementData,
    linkedTrackedPlayerId?: string
  ) => {
    if (currentUser && !permissions.canEditPlayers) {
      showToast(language === 'he' ? 'אין לך הרשאה לעדכן הסכמי אימון.' : 'You do not have permission to edit training agreements.');
      return;
    }
    const sourceList = rosterType === 'male' ? malePlayers : players;
    const existingPlayer = sourceList.find(p => p.id === playerId);
    if (!existingPlayer) return;

    const updatedPlayer: Player = {
      ...existingPlayer,
      trainingAgreement: agreement
    };

    if (rosterType === 'male') {
      setMalePlayers(prev => prev.map(p => (p.id === playerId ? updatedPlayer : p)));
      if (currentUser && workspaceUid) {
        saveMalePlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
      }
    } else {
      setPlayers(prev => prev.map(p => (p.id === playerId ? updatedPlayer : p)));
      if (currentUser && workspaceUid) {
        savePlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
      }
    }

    if (detailPlayer?.id === playerId) {
      setDetailPlayer(updatedPlayer);
    }

    // Sync strictly to existing Player Tracker entry if matched or manually linked (never creates new tracked players)
    const matchedTracked =
      (linkedTrackedPlayerId
        ? trackedPlayers.find(tp => tp.id === linkedTrackedPlayerId)
        : undefined) || findMatchingTrackedPlayer(updatedPlayer, rosterType, trackedPlayers);

    let syncedTrackedUpdated = false;

    if (matchedTracked && (!currentUser || permissions.canEditTracker)) {
      if (agreement.minutesClauseEnabled && agreement.syncMinutesWithTracker !== false) {
        const nextTracked: TrackedPlayer = {
          ...matchedTracked,
          linkedPlayerId: updatedPlayer.id,
          linkedRosterType: rosterType,
          clubName: updatedPlayer.clubName || matchedTracked.clubName,
          minMinutesClausePct: agreement.minutesThresholdPct,
          minutesCheckpoint: agreement.minutesCheckpoint
        };
        setTrackedPlayers(prev => prev.map(tp => (tp.id === matchedTracked.id ? nextTracked : tp)));
        if (currentUser && workspaceUid) {
          saveTrackedPlayerToFirestore(workspaceUid, nextTracked).catch(handleBackgroundQuotaError);
        }
        syncedTrackedUpdated = true;
      } else if (
        matchedTracked.minMinutesClausePct ||
        matchedTracked.minutesCheckpoint ||
        matchedTracked.linkedPlayerId !== updatedPlayer.id
      ) {
        const clearedTracked: TrackedPlayer = {
          ...matchedTracked,
          linkedPlayerId: updatedPlayer.id,
          linkedRosterType: rosterType,
          minMinutesClausePct: undefined,
          minutesCheckpoint: undefined
        };
        setTrackedPlayers(prev => prev.map(tp => (tp.id === matchedTracked.id ? clearedTracked : tp)));
        if (currentUser && workspaceUid) {
          saveTrackedPlayerToFirestore(workspaceUid, clearedTracked).catch(handleBackgroundQuotaError);
        }
      }
    }

    if (syncedTrackedUpdated) {
      showToast(
        language === 'he'
          ? `הסכם האימון נשמר וסונכרן עם השורה הקיימת במעקב הדקות עבור ${updatedPlayer.name} (${agreement.minutesThresholdPct}%).`
          : `Training Agreement saved & synced to existing Player Tracker entry (${agreement.minutesThresholdPct}% clause).`
      );
    } else {
      showToast(
        language === 'he'
          ? `הסכם האימון נשמר עבור ${updatedPlayer.name}.`
          : `Training Agreement saved for ${updatedPlayer.name}.`
      );
    }
  };

  const handleUpdateYouthCategory = (playerId: string, category: YouthCategory, rosterType: 'female' | 'male' = 'female') => {
    if (currentUser && !permissions.canEditPlayers) return;
    let updatedPlayer: Player | undefined;
    if (rosterType === 'male') {
      setMalePlayers(prev => prev.map(p => {
        if (p.id === playerId) {
          updatedPlayer = { ...p, youthCategory: category };
          return updatedPlayer;
        }
        return p;
      }));
      if (currentUser && workspaceUid && updatedPlayer) {
        saveMalePlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
      }
    } else {
      setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
          updatedPlayer = { ...p, youthCategory: category };
          return updatedPlayer;
        }
        return p;
      }));
      if (currentUser && workspaceUid && updatedPlayer) {
        savePlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
      }
    }
    showToast(language === 'he'
      ? `שכבת הגיל עודכנה ל-${category}.`
      : `Age category updated to ${category}.`);
  };

  // Deletion triggers
  const handleRequestDeletePlayer = (player: Player) => {
    if (currentUser && !permissions.canDeletePlayers) return;
    setDeleteTarget({
      isOpen: true,
      type: 'single_player',
      player
    });
  };

  const handleRequestDeleteMultiple = (playerIds: string[]) => {
    if (currentUser && !permissions.canDeletePlayers) return;
    setDeleteTarget({
      isOpen: true,
      type: 'multiple_players',
      playerIds
    });
  };

  const handleRequestDeleteMalePlayer = (player: Player) => {
    if (currentUser && !permissions.canDeletePlayers) return;
    setDeleteTarget({
      isOpen: true,
      type: 'single_male_player',
      player
    });
  };

  const handleRequestDeleteMultipleMale = (playerIds: string[]) => {
    if (currentUser && !permissions.canDeletePlayers) return;
    setDeleteTarget({
      isOpen: true,
      type: 'multiple_male_players',
      playerIds
    });
  };

  const handleRequestDeleteProspect = (prospect: TalkProspect) => {
    if (currentUser && (!permissions.canAccessScouting || !permissions.canDeletePlayers)) return;
    setDeleteTarget({
      isOpen: true,
      type: 'single_prospect',
      prospect
    });
  };

  const handleRequestDeleteForeignProspect = (foreignProspect: ForeignProspect) => {
    if (currentUser && (!permissions.canAccessScouting || !permissions.canDeletePlayers)) return;
    setDeleteTarget({
      isOpen: true,
      type: 'single_foreign_prospect',
      foreignProspect
    });
  };

  const handleConfirmDelete = () => {
    if (currentUser && !permissions.canDeletePlayers) return;
    if (deleteTarget.type === 'single_player' && deleteTarget.player) {
      const pid = deleteTarget.player.id;
      setPlayers(prev => prev.filter(p => p.id !== pid));
      if (detailPlayer?.id === pid) setDetailPlayer(null);
      if (currentUser && workspaceUid) {
        deletePlayerFromFirestore(workspaceUid, pid).catch(handleBackgroundQuotaError);
      }
      showToast(language === 'he' ? 'השחקנית נמחקה מסגל השחקניות.' : 'Player removed from female roster.');
    } else if (deleteTarget.type === 'multiple_players' && deleteTarget.playerIds) {
      const ids = new Set(deleteTarget.playerIds);
      setPlayers(prev => prev.filter(p => !ids.has(p.id)));
      if (currentUser && workspaceUid) {
        deleteMultiplePlayersFromFirestore(workspaceUid, deleteTarget.playerIds).catch(handleBackgroundQuotaError);
      }
      showToast(language === 'he' 
        ? `${deleteTarget.playerIds.length} שחקניות נמחקו מסגל השחקניות.` 
        : `${deleteTarget.playerIds.length} players removed from female roster.`);
    } else if (deleteTarget.type === 'single_male_player' && deleteTarget.player) {
      const pid = deleteTarget.player.id;
      setMalePlayers(prev => prev.filter(p => p.id !== pid));
      if (detailPlayer?.id === pid) setDetailPlayer(null);
      if (currentUser && workspaceUid) {
        deleteMalePlayerFromFirestore(workspaceUid, pid).catch(handleBackgroundQuotaError);
      }
      showToast(language === 'he' ? 'השחקן נמחק מסגל בנים ונוער.' : 'Player removed from male roster.');
    } else if (deleteTarget.type === 'multiple_male_players' && deleteTarget.playerIds) {
      const ids = new Set(deleteTarget.playerIds);
      setMalePlayers(prev => prev.filter(p => !ids.has(p.id)));
      if (currentUser && workspaceUid) {
        deleteMultipleMalePlayersFromFirestore(workspaceUid, deleteTarget.playerIds).catch(handleBackgroundQuotaError);
      }
      showToast(language === 'he'
        ? `${deleteTarget.playerIds.length} שחקנים נמחקו מסגל בנים ונוער.`
        : `${deleteTarget.playerIds.length} players removed from male roster.`);
    } else if (deleteTarget.type === 'single_prospect' && deleteTarget.prospect) {
      const pid = deleteTarget.prospect.id;
      setProspects(prev => prev.filter(p => p.id !== pid));
      if (currentUser && workspaceUid) {
        deleteProspectFromFirestore(workspaceUid, pid).catch(handleBackgroundQuotaError);
      }
      showToast(language === 'he' ? 'המועמדת הוסרה מצינור השיחות.' : 'Candidate removed from talk pipeline.');
    } else if (deleteTarget.type === 'single_foreign_prospect' && deleteTarget.foreignProspect) {
      const pid = deleteTarget.foreignProspect.id;
      setForeignProspects(prev => prev.filter(p => p.id !== pid));
      if (currentUser && workspaceUid) {
        deleteForeignProspectFromFirestore(workspaceUid, pid).catch(handleBackgroundQuotaError);
      }
      showToast(language === 'he' ? 'השחקנית הזרה הוסרה מרשימת המעקב.' : 'Foreign prospect removed from pipeline.');
    } else if (deleteTarget.type === 'single_tracked' && deleteTarget.trackedPlayer) {
      if (currentUser && !permissions.canEditTracker) return;
      const pid = deleteTarget.trackedPlayer.id;
      setTrackedPlayers(prev => prev.filter(p => p.id !== pid));
      if (currentUser && workspaceUid) {
        deleteTrackedPlayerFromFirestore(workspaceUid, pid).catch(handleBackgroundQuotaError);
      }
      showToast(language === 'he' ? 'השחקן/ית הוסר/ה מכלי המעקב.' : 'Player removed from Player Tracker.');
    } else if (deleteTarget.type === 'multiple_tracked' && deleteTarget.trackedIds) {
      if (currentUser && !permissions.canEditTracker) return;
      const ids = new Set(deleteTarget.trackedIds);
      setTrackedPlayers(prev => prev.filter(p => !ids.has(p.id)));
      if (currentUser && workspaceUid) {
        deleteMultipleTrackedPlayersFromFirestore(workspaceUid, deleteTarget.trackedIds).catch(handleBackgroundQuotaError);
      }
      showToast(language === 'he' 
        ? `${deleteTarget.trackedIds.length} שחקנים הוסרו מהמעקב.` 
        : `${deleteTarget.trackedIds.length} players removed from Player Tracker.`);
    }
  };

  // Handlers for Player Tracker
  const handleSaveTrackedPlayer = (player: TrackedPlayer) => {
    if (currentUser && !permissions.canEditTracker) return;
    setTrackedPlayers(prev => {
      const idx = prev.findIndex(p => p.id === player.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = player;
        return updated;
      }
      return [player, ...prev];
    });
    if (currentUser && workspaceUid) {
      saveTrackedPlayerToFirestore(workspaceUid, player).catch(handleBackgroundQuotaError);
    }
    showToast(language === 'he' 
      ? `השחקן/ית "${player.name}" נשמר/ה בהצלחה במעקב.` 
      : `Player "${player.name}" saved to Player Tracker.`);
  };

  const handleQuickAddGoal = (playerId: string) => {
    if (currentUser && !permissions.canEditTracker) return;
    let updatedPlayer: TrackedPlayer | undefined;
    setTrackedPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const nextGoals = p.goals + 1;
        showToast(language === 'he' 
          ? `⚽ שער נרשם עבור ${p.name}! (סה״כ: ${nextGoals})` 
          : `⚽ +1 Goal recorded for ${p.name}! (Total: ${nextGoals}G)`);
        updatedPlayer = { ...p, goals: nextGoals };
        return updatedPlayer;
      }
      return p;
    }));
    if (currentUser && workspaceUid && updatedPlayer) {
      saveTrackedPlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
    }
  };

  const handleQuickAddAssist = (playerId: string) => {
    if (currentUser && !permissions.canEditTracker) return;
    let updatedPlayer: TrackedPlayer | undefined;
    setTrackedPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const nextAssists = p.assists + 1;
        showToast(language === 'he' 
          ? `🎯 בישול נרשם עבור ${p.name}! (סה״כ: ${nextAssists})` 
          : `🎯 +1 Assist recorded for ${p.name}! (Total: ${nextAssists}A)`);
        updatedPlayer = { ...p, assists: nextAssists };
        return updatedPlayer;
      }
      return p;
    }));
    if (currentUser && workspaceUid && updatedPlayer) {
      saveTrackedPlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
    }
  };

  const handleQuickAddMinutes = (playerId: string, minutes: number) => {
    if (currentUser && !permissions.canEditTracker) return;
    let updatedPlayer: TrackedPlayer | undefined;
    setTrackedPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const nextMinutes = p.minutesPlayed + minutes;
        showToast(language === 'he' 
          ? `⏱️ נוספו ${minutes} דקות עבור ${p.name}! (סה״כ: ${nextMinutes} דק׳)` 
          : `⏱️ +${minutes} minutes recorded for ${p.name}! (Total: ${nextMinutes}m)`);
        updatedPlayer = { ...p, minutesPlayed: nextMinutes };
        return updatedPlayer;
      }
      return p;
    }));
    if (currentUser && workspaceUid && updatedPlayer) {
      saveTrackedPlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
    }
  };

  const handleQuickAddMatch = (playerId: string) => {
    if (currentUser && !permissions.canEditTracker) return;
    let updatedPlayer: TrackedPlayer | undefined;
    setTrackedPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const nextEligible = p.matchesEligible + 1;
        const nextPlayed = p.matchesPlayed + 1;
        showToast(language === 'he' 
          ? `🏟️ הופעת משחק נרשמה עבור ${p.name}! (${nextPlayed}/${nextEligible})` 
          : `🏟️ Match appearance recorded for ${p.name}! (${nextPlayed}/${nextEligible} games)`);
        updatedPlayer = { ...p, matchesEligible: nextEligible, matchesPlayed: nextPlayed };
        return updatedPlayer;
      }
      return p;
    }));
    if (currentUser && workspaceUid && updatedPlayer) {
      saveTrackedPlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
    }
  };

  const handleSaveManualMinutes = (
    playerId: string,
    updatedStats: {
      minutesPlayed: number;
      matchesPlayed: number;
      matchesEligible: number;
      goals: number;
      assists: number;
      goalInvolvementTarget?: number;
      note?: string;
    }
  ) => {
    if (currentUser && !permissions.canEditTracker) return;
    let updatedPlayer: TrackedPlayer | undefined;
    setTrackedPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        showToast(language === 'he' 
          ? `⏱️ דקות המשחק והיעדים עודכנו בהצלחה עבור ${p.name}.` 
          : `⏱️ Playing time & targets updated successfully for ${p.name}.`);
        updatedPlayer = {
          ...p,
          minutesPlayed: updatedStats.minutesPlayed,
          matchesPlayed: updatedStats.matchesPlayed,
          matchesEligible: updatedStats.matchesEligible,
          goals: updatedStats.goals,
          assists: updatedStats.assists,
          goalInvolvementTarget: updatedStats.goalInvolvementTarget !== undefined ? updatedStats.goalInvolvementTarget : p.goalInvolvementTarget,
          notes: updatedStats.note || p.notes
        };
        return updatedPlayer;
      }
      return p;
    }));
    if (currentUser && workspaceUid && updatedPlayer) {
      saveTrackedPlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
    }
  };

  const handleUpdateTarget = (playerId: string, target: number) => {
    if (currentUser && !permissions.canEditTracker) return;
    let updatedPlayer: TrackedPlayer | undefined;
    setTrackedPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        updatedPlayer = { ...p, goalInvolvementTarget: Math.max(0, target) };
        return updatedPlayer;
      }
      return p;
    }));
    if (currentUser && workspaceUid && updatedPlayer) {
      saveTrackedPlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
    }
    showToast(language === 'he' ? 'יעד מעורבות בשערים עודכן בהצלחה.' : 'Goal involvement target updated successfully.');
  };

  const handleQuickExtend = (playerId: string, newExpiryDate: string, updatedStatus: any, renewalNote: string) => {
    if (currentUser && !permissions.canEditPlayers) return;
    let updatedPlayer: Player | undefined;
    if (quickExtendRosterType === 'male') {
      setMalePlayers(prev => prev.map(p => {
        if (p.id === playerId) {
          updatedPlayer = {
            ...p,
            contractExpiryDate: newExpiryDate,
            status: updatedStatus || 'Active',
            notes: renewalNote ? `${p.notes ? p.notes + '\n' : ''}[Extension]: ${renewalNote}` : p.notes
          };
          return updatedPlayer;
        }
        return p;
      }));
      if (currentUser && workspaceUid && updatedPlayer) {
        saveMalePlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
      }
    } else {
      setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
          updatedPlayer = {
            ...p,
            contractExpiryDate: newExpiryDate,
            status: updatedStatus || 'Active',
            notes: renewalNote ? `${p.notes ? p.notes + '\n' : ''}[Extension]: ${renewalNote}` : p.notes
          };
          return updatedPlayer;
        }
        return p;
      }));
      if (currentUser && workspaceUid && updatedPlayer) {
        savePlayerToFirestore(workspaceUid, updatedPlayer).catch(handleBackgroundQuotaError);
      }
    }
    showToast(language === 'he' ? 'הארכת החוזה נרשמה בהצלחה.' : 'Contract extension recorded and expiration alert updated.');
  };

  // Handlers for Prospects ("In Talk With")
  const handleSaveProspect = (savedProspect: TalkProspect) => {
    if (currentUser && !permissions.canAccessScouting) return;
    // If user marked stage as 'Signed', automatically move to agency roster!
    if (savedProspect.talkStage === 'Signed') {
      handleSignProspectToRoster(savedProspect);
      return;
    }

    setProspects(prev => {
      const idx = prev.findIndex(p => p.id === savedProspect.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedProspect;
        return updated;
      }
      return [savedProspect, ...prev];
    });
    if (currentUser && workspaceUid) {
      saveProspectToFirestore(workspaceUid, savedProspect).catch(handleBackgroundQuotaError);
    }
    const isMale = savedProspect.gender === 'Male';
    showToast(language === 'he' 
      ? `${isMale ? 'המועמד' : 'המועמדת'} "${savedProspect.name}" נשמר במועמדים לייצוג בסוכנות.` 
      : `Candidate "${savedProspect.name}" saved to agency pipeline.`);
  };

  const handleUpdateProspectStage = (prospect: TalkProspect, nextStage: TalkStage) => {
    if (currentUser && !permissions.canAccessScouting) return;
    if (prospect.talkStage === nextStage) return;

    if (nextStage === 'Signed') {
      handleSignProspectToRoster(prospect);
      return;
    }

    const updatedProspect: TalkProspect = {
      ...prospect,
      talkStage: nextStage
    };

    setProspects(prev => prev.map(p => (p.id === prospect.id ? updatedProspect : p)));
    if (currentUser && workspaceUid) {
      saveProspectToFirestore(workspaceUid, updatedProspect).catch(handleBackgroundQuotaError);
    }
    showToast(
      language === 'he'
        ? `"${prospect.name}" הועבר/ה לשלב ${nextStage}.`
        : `Moved "${prospect.name}" to ${nextStage}.`
    );
  };

  // Handlers for International / Foreign Female Prospects
  const handleSaveForeignProspect = (savedForeign: ForeignProspect) => {
    if (currentUser && !permissions.canAccessScouting) return;
    setForeignProspects(prev => {
      const idx = prev.findIndex(p => p.id === savedForeign.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedForeign;
        return updated;
      }
      return [savedForeign, ...prev];
    });
    if (currentUser && workspaceUid) {
      saveForeignProspectToFirestore(workspaceUid, savedForeign).catch(handleBackgroundQuotaError);
    }
    showToast(language === 'he'
      ? `השחקנית הזרה "${savedForeign.fullName}" נשמרה בהצלחה.`
      : `Foreign prospect "${savedForeign.fullName}" saved successfully.`);
  };

  const handleAddConversationLog = (prospectId: string, newLog: ConversationLog) => {
    if (currentUser && !permissions.canAccessScouting) return;
    let updatedProspect: TalkProspect | undefined;
    setProspects(prev => prev.map(p => {
      if (p.id === prospectId) {
        updatedProspect = {
          ...p,
          conversationHistory: [...p.conversationHistory, newLog]
        };
        return updatedProspect;
      }
      return p;
    }));
    if (currentUser && workspaceUid && updatedProspect) {
      saveProspectToFirestore(workspaceUid, updatedProspect).catch(handleBackgroundQuotaError);
    }
    showToast(language === 'he' ? 'סיכום שיחה חדש נוסף ליומן.' : 'New interaction note logged.');
  };

  // Convert "In Talk With" Prospect to Signed Agency Player and MOVE to Agency Roster!
  const handleSignProspectToRoster = (prospect: TalkProspect) => {
    if (currentUser && (!permissions.canAccessScouting || !permissions.canCreatePlayers)) return;
    const isMale = prospect.gender === 'Male';
    const now = new Date();
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2);

    const calculatedMarketVal = isMale
      ? (prospect.scope === 'International' ? '€300,000' : '€150,000')
      : (prospect.scope === 'International' ? '€500,000' : '€350,000');

    const defaultYouth: YouthCategory =
      prospect.youthCategory ||
      (isMale && prospect.age <= 14
        ? 'U14'
        : prospect.age <= 15
        ? 'U15'
        : isMale && prospect.age === 16
        ? 'U16'
        : prospect.age <= 17
        ? 'U17'
        : prospect.age <= 19
        ? 'U19'
        : 'Senior');

    const newPlayer: Player = {
      id: `${isMale ? 'mply' : 'ply'}-signed-${Date.now()}`,
      name: prospect.name,
      photoUrl: prospect.photoUrl || '/src/assets/images/player_portrait_midfield_1794074972939.jpg',
      age: prospect.age,
      birthDate: prospect.birthDate,
      nationality: prospect.nationality,
      countryCode: prospect.countryCode,
      clubName: prospect.currentClub,
      league: prospect.league,
      position: prospect.position,
      youthCategory: defaultYouth,
      jerseyNumber: 10,
      dominantFoot: prospect.scoutingReport.dominantFoot,
      contractStartDate: now.toISOString().split('T')[0],
      contractExpiryDate: expiry.toISOString().split('T')[0],
      status: 'Active',
      marketValue: calculatedMarketVal,
      agencyFeePct: 10,
      representationType: 'Exclusive',
      assignedAgent: prospect.assignedAgent || agents[0]?.name || 'Roy Shpitalnik',
      notes: `Signed to BRIT SPORT GROUP Management representation from ${prospect.currentClub}. Assigned agent: ${prospect.assignedAgent}.`,
      videoHighlightsUrl: prospect.videoUrl || '',
      createdAt: now.toISOString().split('T')[0]
    };

    // 1. Add to Female or Male Agency Roster
    if (isMale) {
      setMalePlayers(prev => [newPlayer, ...prev]);
    } else {
      setPlayers(prev => [newPlayer, ...prev]);
    }

    // 2. Move out of "In Talk With" candidates list when user can delete prospects
    if (!currentUser || permissions.canDeletePlayers) {
      setProspects(prev => prev.filter(p => p.id !== prospect.id));
    }

    // 3. Persist in Firestore
    if (currentUser && workspaceUid) {
      if (isMale) {
        saveMalePlayerToFirestore(workspaceUid, newPlayer).catch(handleBackgroundQuotaError);
      } else {
        savePlayerToFirestore(workspaceUid, newPlayer).catch(handleBackgroundQuotaError);
      }
      if (permissions.canDeletePlayers) {
        deleteProspectFromFirestore(workspaceUid, prospect.id).catch(handleBackgroundQuotaError);
      }
    }

    if (isMale) {
      showToast(language === 'he'
        ? `🎉 ברכות! ${prospect.name} נחתם בסוכנות והועבר ישירות לסגל בנים ונוער!`
        : `🎉 Congratulations! ${prospect.name} signed to agency and moved to Male Roster!`);
      setActiveTab('male-roster');
    } else {
      showToast(language === 'he'
        ? `🎉 ברכות! ${prospect.name} נחתמה בסוכנות והועברה ישירות לסגל השחקניות הרשמי!`
        : `🎉 Congratulations! ${prospect.name} signed to agency and moved to Female Roster!`);
      setActiveTab('roster');
    }
  };

  // Video viewer launcher
  const handleWatchVideo = (title: string, videoUrl: string, item: any, desc?: string) => {
    setVideoModalData({
      isOpen: true,
      title,
      videoUrl,
      description: desc,
      item
    });
  };

  // Export offline JSON backup of all agency data anytime
  const handleExportBackup = () => {
    try {
      const backupData = {
        agencyName: "BRIT SPORT GROUP Management | Women's Football Agency",
        exportTimestamp: new Date().toISOString(),
        userEmail: currentUser?.email || 'local_session',
        totalPlayers: players.length,
        totalMalePlayers: malePlayers.length,
        totalProspects: prospects.length,
        totalForeignProspects: foreignProspects.length,
        totalTrackedPlayers: trackedPlayers.length,
        players,
        malePlayers,
        prospects,
        foreignProspects,
        trackedPlayers,
        agents,
        settings: {
          currency,
          language,
          isDarkMode
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brit_sport_group_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(language === 'he' ? 'קובץ הגיבוי המלא הורד בהצלחה למחשב שלך!' : 'Full agency backup JSON downloaded successfully!');
    } catch (e) {
      console.error('Failed to export backup', e);
    }
  };

  const t = TRANSLATIONS[language];

  if (!isAuthReady && !hasChosenLocalWorkspace) {
    return (
      <div
        dir={language === 'he' ? 'rtl' : 'ltr'}
        className={`min-h-screen w-full flex flex-col items-center justify-center bg-[#F7F8FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased px-6 ${
          language === 'he' ? 'font-hebrew' : 'font-sans'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white px-4 py-2.5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <img
              src="/assets/aistudio/Brit_gold_c815fbe0.png"
              alt="BRIT SPORT GROUP"
              referrerPolicy="no-referrer"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{language === 'he' ? 'טוען סביבת עבודה...' : 'Loading agency workspace...'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser && !hasChosenLocalWorkspace) {
    return (
      <LoginPortalView
        language={language}
        onToggleLanguage={handleToggleLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        diagnostic={authDiagnostic}
        onLoginWithGoogle={handleGoogleLogin}
        onLoginWithEmail={handleEmailLogin}
        onResetPassword={handleResetPassword}
        onContinueLocal={handleContinueLocal}
        isSyncing={isCloudSyncing}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#F7F8FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors antialiased ${language === 'he' ? 'font-hebrew' : ''}`}>
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        playerCount={players.length}
        malePlayerCount={malePlayers.length}
        youthMatchesCount={maleYouthU14ToU17Count}
        prospectCount={prospects.length + foreignProspects.length}
        criticalAlertsCount={criticalAlertsCount}
        upcomingBirthdaysCount={upcomingBirthdaysCount}
        trackedCount={trackedPlayers.length}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        currency={currency}
        onChangeCurrency={setCurrency}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        currentUser={currentUser}
        onLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isCloudSyncing={isCloudSyncing}
        onExportBackup={handleExportBackup}
        permissions={permissions}
        accessRoleLabel={accessRoleLabel}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
          onOpenAddPlayer={() => {
            setPlayerModalRosterType('female');
            setPlayerToEdit(null);
            setIsPlayerModalOpen(true);
          }}
          onOpenAddMalePlayer={() => {
            setPlayerModalRosterType('male');
            setPlayerToEdit(null);
            setIsPlayerModalOpen(true);
          }}
          onOpenAddProspect={() => {
            setProspectToEdit(null);
            setIsProspectModalOpen(true);
          }}
          onOpenAddTrackedPlayer={() => {
            setTrackedPlayerToEdit(null);
            setIsAddTrackedModalOpen(true);
          }}
          playerCount={players.length}
          malePlayerCount={malePlayers.length}
          prospectCount={prospects.length + foreignProspects.length}
          criticalAlertsCount={criticalAlertsCount}
          trackedCount={trackedPlayers.length}
          currency={currency}
          onChangeCurrency={setCurrency}
          language={language}
          onToggleLanguage={handleToggleLanguage}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          currentUser={currentUser}
          onLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          isCloudSyncing={isCloudSyncing}
          permissions={permissions}
        />

        {/* Main Viewport Container */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser && (accessStatus === 'unauthorized' || accessStatus === 'disabled') ? (
          <div className="max-w-lg mx-auto mt-10 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-6 sm:p-8 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {accessStatus === 'disabled'
                  ? language === 'he' ? 'הגישה שלך הושהתה על ידי בעל הסוכנות' : 'Workspace Access Suspended'
                  : language === 'he' ? 'החשבון ממתין לאישור בעל הסוכנות' : 'Workspace Approval Required'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {accessStatus === 'disabled'
                  ? language === 'he'
                    ? 'בעל הסוכנות השהה זמנית את הרשאות הגישה שלך בהגדרות הסוכנות.'
                    : 'Your team access has been temporarily suspended by the agency owner in Agent Settings.'
                  : language === 'he'
                    ? 'המשתמש מחובר ל-Firebase, אך עדיין לא אושר בהרשאות הסוכנות (או שבעל הסוכנות טרם התחבר עם Google כדי לפתוח את סביבת העבודה).'
                    : 'You are signed in to Firebase, but your User UID is not active in the owner workspace yet (or the agency owner must sign in once with Google to initialize team sharing).'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-left rtl:text-right space-y-1.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Email: <strong className="text-slate-900 dark:text-white">{currentUser.email || '—'}</strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  UID: <code className="font-mono text-slate-900 dark:text-white">{currentUser.uid}</code>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser.uid);
                    setCopiedUid(true);
                    setTimeout(() => setCopiedUid(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
                >
                  {copiedUid ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUid ? 'Copied' : 'Copy UID'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.signOut}</span>
            </button>
          </div>
        ) : (
        <>
        {activeTab === 'dashboard' && (
          <DashboardView
            players={players}
            malePlayers={malePlayers}
            prospects={prospects}
            foreignProspects={foreignProspects}
            trackedPlayers={trackedPlayers}
            agents={agents}
            watchedNextMatchKeys={watchedNextMatchKeys}
            onChangeWatchedNextMatchKeys={setWatchedNextMatchKeys}
            permissions={permissions}
            onNavigateTab={setActiveTab}
            onNavigateAlertsHub={(subTab) => {
              setAlertsSubTab(subTab);
              setActiveTab('alerts');
            }}
            onNavigateForeignProspects={() => {
              setInTalkSubTab('foreign');
              setActiveTab('in-talk');
            }}
            onSelectPlayer={(player, rosterType) => {
              setDetailPlayerRosterType(rosterType);
              setDetailPlayer(player);
            }}
            onSelectProspect={prospect => {
              if (!permissions.canAccessScouting) return;
              if (prospect.videoUrl && prospect.videoUrl.trim()) {
                handleWatchVideo(
                  prospect.videoTitle,
                  prospect.videoUrl,
                  prospect,
                  prospect.videoDescription
                );
              } else {
                setProspectToEdit(prospect);
                setIsProspectModalOpen(true);
              }
            }}
            onSelectForeignProspect={fp => {
              if (!permissions.canAccessScouting) return;
              setForeignProspectToEdit(fp);
              setIsForeignProspectModalOpen(true);
            }}
            onOpenQuickExtend={(player, rosterType) => {
              if (!permissions.canEditPlayers) return;
              setQuickExtendRosterType(rosterType);
              setQuickExtendPlayer(player);
            }}
            onOpenAddPlayer={(rosterType) => {
              if (!permissions.canCreatePlayers) return;
              setPlayerModalRosterType(rosterType);
              setPlayerToEdit(null);
              setIsPlayerModalOpen(true);
            }}
            language={language}
            currency={currency}
            nextTransferWindowDate={nextTransferWindowDate}
          />
        )}

        {activeTab === 'roster' && permissions.canViewPlayers && (
          <PlayerListView
            players={players}
            rosterType="female"
            agents={agents}
            nextTransferWindowDate={nextTransferWindowDate}
            onChangeNextTransferWindowDate={permissions.isOwner ? handleChangeNextTransferWindowDate : undefined}
            canCreatePlayers={permissions.canCreatePlayers}
            canEditPlayers={permissions.canEditPlayers}
            canDeletePlayers={permissions.canDeletePlayers}
            onSelectPlayer={player => {
              setDetailPlayerRosterType('female');
              setDetailPlayer(player);
            }}
            onEditPlayer={player => {
              if (!permissions.canEditPlayers) return;
              setPlayerModalRosterType('female');
              setPlayerToEdit(player);
              setIsPlayerModalOpen(true);
            }}
            onRequestDeletePlayer={handleRequestDeletePlayer}
            onRequestDeleteMultiple={handleRequestDeleteMultiple}
            onQuickExtend={player => {
              if (!permissions.canEditPlayers) return;
              setQuickExtendRosterType('female');
              setQuickExtendPlayer(player);
            }}
            onOpenAddPlayer={() => {
              if (!permissions.canCreatePlayers) return;
              setPlayerModalRosterType('female');
              setPlayerToEdit(null);
              setIsPlayerModalOpen(true);
            }}
            onUpdateYouthCategory={(id, cat) => handleUpdateYouthCategory(id, cat, 'female')}
            language={language}
            currency={currency}
          />
        )}

        {activeTab === 'male-roster' && permissions.canViewPlayers && (
          <PlayerListView
            players={malePlayers}
            rosterType="male"
            agents={agents}
            nextTransferWindowDate={nextTransferWindowDate}
            onChangeNextTransferWindowDate={permissions.isOwner ? handleChangeNextTransferWindowDate : undefined}
            canCreatePlayers={permissions.canCreatePlayers}
            canEditPlayers={permissions.canEditPlayers}
            canDeletePlayers={permissions.canDeletePlayers}
            onSelectPlayer={player => {
              setDetailPlayerRosterType('male');
              setDetailPlayer(player);
            }}
            onEditPlayer={player => {
              if (!permissions.canEditPlayers) return;
              setPlayerModalRosterType('male');
              setPlayerToEdit(player);
              setIsPlayerModalOpen(true);
            }}
            onRequestDeletePlayer={handleRequestDeleteMalePlayer}
            onRequestDeleteMultiple={handleRequestDeleteMultipleMale}
            onQuickExtend={player => {
              if (!permissions.canEditPlayers) return;
              setQuickExtendRosterType('male');
              setQuickExtendPlayer(player);
            }}
            onOpenAddPlayer={() => {
              if (!permissions.canCreatePlayers) return;
              setPlayerModalRosterType('male');
              setPlayerToEdit(null);
              setIsPlayerModalOpen(true);
            }}
            onUpdateYouthCategory={(id, cat) => handleUpdateYouthCategory(id, cat, 'male')}
            language={language}
            currency={currency}
          />
        )}

        {activeTab === 'youth-matches' && permissions.canViewPlayers && (
          <YouthMatchesView
            malePlayers={malePlayers}
            onSelectPlayer={(player, rosterType) => {
              setDetailPlayerRosterType(rosterType);
              setDetailPlayer(player);
            }}
            onNavigateMaleRoster={() => setActiveTab('male-roster')}
            language={language}
          />
        )}

        {activeTab === 'in-talk' && permissions.canAccessScouting && (
          <InTalkWithView
            prospects={prospects}
            foreignProspects={foreignProspects}
            subTab={inTalkSubTab}
            onSubTabChange={setInTalkSubTab}
            onOpenAddProspect={() => {
              setProspectToEdit(null);
              setIsProspectModalOpen(true);
            }}
            onEditProspect={prospect => {
              setProspectToEdit(prospect);
              setIsProspectModalOpen(true);
            }}
            onRequestDeleteProspect={handleRequestDeleteProspect}
            onWatchVideo={prospect => {
              handleWatchVideo(
                prospect.videoTitle,
                prospect.videoUrl,
                prospect,
                prospect.videoDescription
              );
            }}
            onOpenConversationLog={prospect => setConversationModalProspect(prospect)}
            onSignProspectToRoster={handleSignProspectToRoster}
            onUpdateProspectStage={handleUpdateProspectStage}
            onOpenAddForeignProspect={() => {
              setForeignProspectToEdit(null);
              setIsForeignProspectModalOpen(true);
            }}
            onEditForeignProspect={fp => {
              setForeignProspectToEdit(fp);
              setIsForeignProspectModalOpen(true);
            }}
            onUpdateForeignProspect={handleSaveForeignProspect}
            onRequestDeleteForeignProspect={handleRequestDeleteForeignProspect}
            language={language}
            currency={currency}
          />
        )}

        {activeTab === 'alerts' && permissions.canViewPlayers && (
          <AlertsHubView
            femalePlayers={players}
            malePlayers={malePlayers}
            agents={agents}
            subTab={alertsSubTab}
            onSubTabChange={setAlertsSubTab}
            canEditPlayers={permissions.canEditPlayers}
            onSelectPlayer={(player, rosterType) => {
              setDetailPlayerRosterType(rosterType);
              setDetailPlayer(player);
            }}
            onQuickExtend={(player, rosterType) => {
              if (!permissions.canEditPlayers) return;
              setQuickExtendRosterType(rosterType);
              setQuickExtendPlayer(player);
            }}
            onEditPlayer={(player, rosterType) => {
              if (!permissions.canEditPlayers) return;
              setPlayerModalRosterType(rosterType);
              setPlayerToEdit(player);
              setIsPlayerModalOpen(true);
            }}
            language={language}
          />
        )}

        {/* Player Tracker Tool Tab */}
        {activeTab === 'tracker' && (permissions.canViewPlayers || permissions.canEditTracker) && (
          <PlayerTrackerView
            players={trackedPlayers}
            femalePlayers={players}
            malePlayers={malePlayers}
            canEditTracker={permissions.canEditTracker}
            canDeletePlayers={permissions.canDeletePlayers}
            onOpenRosterPlayer={(p, rosterType) => {
              setDetailPlayerRosterType(rosterType);
              setDetailPlayer(p);
            }}
            onSyncWithRosters={handleSyncRostersToTracker}
            onOpenAddPlayer={(cat) => {
              if (!permissions.canEditTracker) return;
              if (cat) setDefaultTrackerCategory(cat);
              setTrackedPlayerToEdit(null);
              setIsAddTrackedModalOpen(true);
            }}
            onEditPlayer={(p) => {
              if (!permissions.canEditTracker) return;
              setTrackedPlayerToEdit(p);
              setIsAddTrackedModalOpen(true);
            }}
            onOpenManualMinutes={(p) => {
              if (!permissions.canEditTracker) return;
              setManualMinutesPlayer(p);
            }}
            onUpdateTarget={handleUpdateTarget}
            onRequestDeletePlayer={(p) => {
              if (!permissions.canEditTracker || !permissions.canDeletePlayers) return;
              setDeleteTarget({
                isOpen: true,
                type: 'single_tracked',
                trackedPlayer: p
              });
            }}
            onRequestDeleteMultiple={(ids) => {
              if (!permissions.canEditTracker || !permissions.canDeletePlayers) return;
              setDeleteTarget({
                isOpen: true,
                type: 'multiple_tracked',
                trackedIds: ids
              });
            }}
            onQuickAddGoal={handleQuickAddGoal}
            onQuickAddAssist={handleQuickAddAssist}
            onQuickAddMinutes={handleQuickAddMinutes}
            onQuickAddMatch={handleQuickAddMatch}
            language={language}
          />
        )}

        {/* Training Compensation Calculator Tab */}
        {activeTab === 'compensation' && permissions.canViewPlayers && <TrainingCompensationView />}

        {/* Agent Settings Tab (Owner Only) */}
        {activeTab === 'agent-settings' && permissions.isOwner && (
          <AgentSettingsView
            agents={agents}
            onSaveAgents={handleSaveAgents}
            femalePlayers={players}
            malePlayers={malePlayers}
            language={language}
            nextTransferWindowDate={nextTransferWindowDate}
            onChangeNextTransferWindowDate={handleChangeNextTransferWindowDate}
            isOwner={permissions.isOwner}
            ownerUid={workspaceUid || currentUser?.uid || ''}
            teamMembers={teamMembers}
            onSaveTeamMember={handleSaveTeamMember}
            onDeleteTeamMember={handleDeleteTeamMember}
          />
        )}
        </>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-emerald-600 shadow-lg border border-slate-700 dark:border-emerald-500 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:opacity-75 ml-2 rtl:ml-0 rtl:mr-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dedicated Easy Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        playerToDelete={
          deleteTarget.player ||
          deleteTarget.prospect ||
          deleteTarget.trackedPlayer ||
          (deleteTarget.foreignProspect
            ? {
                name: deleteTarget.foreignProspect.fullName,
                clubName: deleteTarget.foreignProspect.currentClub,
                position: deleteTarget.foreignProspect.primaryPosition
              }
            : undefined)
        }
        countToDelete={deleteTarget.playerIds?.length || deleteTarget.trackedIds?.length}
        language={language}
      />

      {/* Player Tracker Add / Edit Modal */}
      <AddTrackedPlayerModal
        isOpen={isAddTrackedModalOpen}
        onClose={() => {
          setIsAddTrackedModalOpen(false);
          setTrackedPlayerToEdit(null);
        }}
        onSave={handleSaveTrackedPlayer}
        playerToEdit={trackedPlayerToEdit}
        defaultCategory={defaultTrackerCategory}
        femalePlayers={players}
        malePlayers={malePlayers}
        language={language}
      />

      {/* Manual Playing Time Entry Modal */}
      <ManualMinutesModal
        isOpen={!!manualMinutesPlayer}
        onClose={() => setManualMinutesPlayer(null)}
        player={manualMinutesPlayer}
        onSaveManualMinutes={handleSaveManualMinutes}
        language={language}
      />

      {/* Player Add/Edit Modal */}
      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => {
          setIsPlayerModalOpen(false);
          setPlayerToEdit(null);
        }}
        onSave={handleSavePlayer}
        playerToEdit={playerToEdit}
        language={language}
        currency={currency}
        rosterType={playerModalRosterType}
        agents={agents}
        nextTransferWindowDate={nextTransferWindowDate}
      />

      {/* In Talk With Prospect Modal */}
      <ProspectModal
        isOpen={isProspectModalOpen}
        onClose={() => {
          setIsProspectModalOpen(false);
          setProspectToEdit(null);
        }}
        onSave={handleSaveProspect}
        prospectToEdit={prospectToEdit}
        language={language}
        defaultCurrency={currency}
        agents={agents}
      />

      {/* International / Foreign Female Prospect Modal */}
      <ForeignProspectModal
        isOpen={isForeignProspectModalOpen}
        onClose={() => {
          setIsForeignProspectModalOpen(false);
          setForeignProspectToEdit(null);
        }}
        onSave={handleSaveForeignProspect}
        prospectToEdit={foreignProspectToEdit}
        language={language}
      />

      {/* Player Detail Dossier Modal */}
      <PlayerDetailModal
        isOpen={!!detailPlayer}
        onClose={() => setDetailPlayer(null)}
        player={detailPlayer}
        canEditPlayers={permissions.canEditPlayers}
        canDeletePlayers={permissions.canDeletePlayers}
        onEdit={player => {
          if (!permissions.canEditPlayers) return;
          setDetailPlayer(null);
          setPlayerModalRosterType(detailPlayerRosterType);
          setPlayerToEdit(player);
          setIsPlayerModalOpen(true);
        }}
        onQuickExtend={player => {
          if (!permissions.canEditPlayers) return;
          setDetailPlayer(null);
          setQuickExtendRosterType(detailPlayerRosterType);
          setQuickExtendPlayer(player);
        }}
        onRequestDelete={player => {
          if (!permissions.canDeletePlayers) return;
          setDetailPlayer(null);
          if (detailPlayerRosterType === 'male') {
            handleRequestDeleteMalePlayer(player);
          } else {
            handleRequestDeletePlayer(player);
          }
        }}
        onWatchVideo={(title, videoUrl, player) => {
          handleWatchVideo(title, videoUrl, player);
        }}
        language={language}
        currency={currency}
        agents={agents}
        rosterType={detailPlayerRosterType}
        nextTransferWindowDate={nextTransferWindowDate}
        trackedPlayers={trackedPlayers}
        onSaveTrainingAgreement={permissions.canEditPlayers ? handleSaveTrainingAgreement : undefined}
        onNavigateToTracker={() => {
          setDetailPlayer(null);
          setActiveTab('tracker');
        }}
      />

      {/* Quick Extend Contract Modal */}
      <QuickExtendModal
        isOpen={!!quickExtendPlayer}
        onClose={() => setQuickExtendPlayer(null)}
        player={quickExtendPlayer}
        onConfirmExtend={handleQuickExtend}
      />

      {/* Video Highlights Player Modal */}
      <VideoPlayerModal
        isOpen={videoModalData.isOpen}
        onClose={() => setVideoModalData(prev => ({ ...prev, isOpen: false }))}
        title={videoModalData.title}
        videoUrl={videoModalData.videoUrl}
        description={videoModalData.description}
        playerOrProspect={videoModalData.item}
      />

      {/* Conversation Log Modal */}
      <ConversationLogModal
        isOpen={!!conversationModalProspect}
        onClose={() => setConversationModalProspect(null)}
        prospect={conversationModalProspect}
        onAddLog={handleAddConversationLog}
      />

      {/* Firebase Cloud Sync & Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        language={language}
        diagnostic={authDiagnostic}
        onLoginWithGoogle={handleGoogleLogin}
        onLoginWithEmail={handleEmailLogin}
        onResetPassword={handleResetPassword}
        isSyncing={isCloudSyncing}
      />

      {/* Clean quiet agency footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 mt-12 bg-white dark:bg-slate-900 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">{t.footerAgency}</span>
            <span>·</span>
            <span>{t.footerDivision}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>{t.footerRadar}</span>
            <span>·</span>
            <span>FIFA & UEFA Licensed Framework</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
