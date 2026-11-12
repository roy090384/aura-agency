import React, { useState, useEffect } from 'react';
import { Player, TalkProspect, ConversationLog, YouthCategory, Language, Currency, TrackedPlayer, TrackerCategory, NavigationTab } from './types/player';
import { INITIAL_PLAYERS, INITIAL_PROSPECTS } from './data/mockPlayers';
import { INITIAL_TRACKED_PLAYERS } from './data/mockTrackedPlayers';
import { getContractDaysRemaining, getContractUrgency } from './utils/contractAlerts';
import { TRANSLATIONS } from './translations/translations';
import { formatSalary } from './utils/currency';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { PlayerListView } from './components/PlayerListView';
import { InTalkWithView } from './components/InTalkWithView';
import { ContractAlertsView } from './components/ContractAlertsView';
import { PlayerTrackerView } from './components/PlayerTrackerView';
import { AddTrackedPlayerModal } from './components/AddTrackedPlayerModal';
import { ManualMinutesModal } from './components/ManualMinutesModal';
import { PlayerModal } from './components/PlayerModal';
import { ProspectModal } from './components/ProspectModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { ConversationLogModal } from './components/ConversationLogModal';
import { QuickExtendModal } from './components/QuickExtendModal';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AuthModal } from './components/AuthModal';
import { CheckCircle2, Sparkles, X, Cloud } from 'lucide-react';
import { auth, loginWithGoogle, logoutUser, loginWithEmail, loginAnonymouslyUser, getAuthErrorDiagnostic } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  subscribeToPlayers, 
  savePlayerToFirestore, 
  deletePlayerFromFirestore, 
  deleteMultiplePlayersFromFirestore,
  subscribeToProspects, 
  saveProspectToFirestore, 
  deleteProspectFromFirestore,
  subscribeToTrackedPlayers, 
  saveTrackedPlayerToFirestore, 
  deleteTrackedPlayerFromFirestore, 
  deleteMultipleTrackedPlayersFromFirestore,
  savePreferencesToFirestore, 
  syncLocalDataToFirestoreIfEmpty 
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

  // User-owned Players State (Clean start, no non-real players)
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const stored = localStorage.getItem('aura_agency_players_v4');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load players from storage', e);
    }
    return INITIAL_PLAYERS;
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

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Firebase Auth and Cloud Syncing state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Mobile sidebar drawer state
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // Modal dialog states
  const [isAddTrackedModalOpen, setIsAddTrackedModalOpen] = useState(false);
  const [trackedPlayerToEdit, setTrackedPlayerToEdit] = useState<TrackedPlayer | null>(null);
  const [defaultTrackerCategory, setDefaultTrackerCategory] = useState<TrackerCategory>('U17');

  // Manual Playing Time Modal State
  const [manualMinutesPlayer, setManualMinutesPlayer] = useState<TrackedPlayer | null>(null);

  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);
  const [prospectToEdit, setProspectToEdit] = useState<TalkProspect | null>(null);

  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [quickExtendPlayer, setQuickExtendPlayer] = useState<Player | null>(null);

  // Cloud Database Authentication & Diagnostic Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDiagnostic, setAuthDiagnostic] = useState<any>(null);

  // Easy Deletion states
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean;
    type: 'single_player' | 'multiple_players' | 'single_prospect' | 'single_tracked' | 'multiple_tracked';
    player?: Player;
    playerIds?: string[];
    prospect?: TalkProspect;
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

  // Persist players
  useEffect(() => {
    try {
      localStorage.setItem('aura_agency_players_v4', JSON.stringify(players));
    } catch (e) {
      console.error('Failed to save players', e);
    }
  }, [players]);

  // Persist prospects
  useEffect(() => {
    try {
      localStorage.setItem('aura_agency_prospects_v4', JSON.stringify(prospects));
    } catch (e) {
      console.error('Failed to save prospects', e);
    }
  }, [prospects]);

  // Persist tracked players (Player Tracker)
  useEffect(() => {
    try {
      localStorage.setItem('aura_player_tracker_v2', JSON.stringify(trackedPlayers));
    } catch (e) {
      console.error('Failed to save tracked players', e);
    }
  }, [trackedPlayers]);

  // Firebase Auth and real-time Firestore synchronization
  useEffect(() => {
    let unsubPlayers: (() => void) | undefined;
    let unsubProspects: (() => void) | undefined;
    let unsubTracked: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsCloudSyncing(true);
        try {
          await syncLocalDataToFirestoreIfEmpty(user.uid, players, prospects, trackedPlayers);
        } catch (err) {
          console.error('Error syncing initial data:', err);
        } finally {
          setIsCloudSyncing(false);
        }

        unsubPlayers = subscribeToPlayers(user.uid, (remotePlayers) => {
          setPlayers(remotePlayers);
        });

        unsubProspects = subscribeToProspects(user.uid, (remoteProspects) => {
          setProspects(remoteProspects);
        });

        unsubTracked = subscribeToTrackedPlayers(user.uid, (remoteTracked) => {
          setTrackedPlayers(remoteTracked);
        });
      } else {
        if (unsubPlayers) unsubPlayers();
        if (unsubProspects) unsubProspects();
        if (unsubTracked) unsubTracked();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubPlayers) unsubPlayers();
      if (unsubProspects) unsubProspects();
      if (unsubTracked) unsubTracked();
    };
  }, []);

  // Sync preferences (language, currency, dark mode) to cloud for authenticated user
  useEffect(() => {
    if (currentUser) {
      savePreferencesToFirestore(currentUser.uid, { language, currency, isDarkMode }).catch(console.error);
    }
  }, [currentUser, language, currency, isDarkMode]);

  // Authentication Handlers (Google OAuth, Email/Password, and Agent Session)
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
      setIsAuthModalOpen(true);
      showToast(language === 'he' ? 'שגיאה בהתחברות ל-Google. נפתח מדריך פתרון.' : 'Failed to sign in with Google. Solution guide opened.');
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
      showToast(language === 'he' ? 'התחברת בהצלחה! הנתונים מסונכרנים לענן.' : 'Signed in successfully! Data synced to Firebase.');
    } catch (err: any) {
      console.error('Email login error:', err);
      throw err;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      setIsCloudSyncing(true);
      await loginAnonymouslyUser();
      setIsAuthModalOpen(false);
      setAuthDiagnostic(null);
      showToast(language === 'he' ? 'מחובר בסשן סוכן. הנתונים מסונכרנים לענן.' : 'Agent session connected. Data synced to Firebase.');
    } catch (err: any) {
      console.error('Agent login error:', err);
      throw err;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      showToast(language === 'he' ? 'התנתקת בהצלחה. האתר פועל כעת במצב מקומי.' : 'Signed out. Operating in local mode.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Contract alerts: count expiring in <= 30 days (1 month) or expired
  const criticalAlertsCount = players.filter(p => {
    const days = getContractDaysRemaining(p.contractExpiryDate);
    return days <= 30;
  }).length;

  // Handlers for Players
  const handleSavePlayer = (savedPlayer: Player) => {
    setPlayers(prev => {
      const idx = prev.findIndex(p => p.id === savedPlayer.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedPlayer;
        return updated;
      }
      return [savedPlayer, ...prev];
    });
    if (currentUser) {
      savePlayerToFirestore(currentUser.uid, savedPlayer).catch(console.error);
    }
    showToast(language === 'he' 
      ? `פרטי השחקנית "${savedPlayer.name}" נשמרו בהצלחה.` 
      : `Player "${savedPlayer.name}" representation saved successfully.`);
  };

  const handleUpdateYouthCategory = (playerId: string, category: YouthCategory) => {
    let updatedPlayer: Player | undefined;
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        updatedPlayer = { ...p, youthCategory: category };
        return updatedPlayer;
      }
      return p;
    }));
    if (currentUser && updatedPlayer) {
      savePlayerToFirestore(currentUser.uid, updatedPlayer).catch(console.error);
    }
    showToast(language === 'he'
      ? `שכבת הגיל עודכנה ל-${category}.`
      : `Age category updated to ${category}.`);
  };

  // Deletion triggers
  const handleRequestDeletePlayer = (player: Player) => {
    setDeleteTarget({
      isOpen: true,
      type: 'single_player',
      player
    });
  };

  const handleRequestDeleteMultiple = (playerIds: string[]) => {
    setDeleteTarget({
      isOpen: true,
      type: 'multiple_players',
      playerIds
    });
  };

  const handleRequestDeleteProspect = (prospect: TalkProspect) => {
    setDeleteTarget({
      isOpen: true,
      type: 'single_prospect',
      prospect
    });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget.type === 'single_player' && deleteTarget.player) {
      const pid = deleteTarget.player.id;
      setPlayers(prev => prev.filter(p => p.id !== pid));
      if (detailPlayer?.id === pid) setDetailPlayer(null);
      if (currentUser) {
        deletePlayerFromFirestore(currentUser.uid, pid).catch(console.error);
      }
      showToast(language === 'he' ? 'השחקנית נמחקה מהסגל.' : 'Player removed from agency roster.');
    } else if (deleteTarget.type === 'multiple_players' && deleteTarget.playerIds) {
      const ids = new Set(deleteTarget.playerIds);
      setPlayers(prev => prev.filter(p => !ids.has(p.id)));
      if (currentUser) {
        deleteMultiplePlayersFromFirestore(currentUser.uid, deleteTarget.playerIds).catch(console.error);
      }
      showToast(language === 'he' 
        ? `${deleteTarget.playerIds.length} שחקניות נמחקו מהסגל.` 
        : `${deleteTarget.playerIds.length} players removed from agency roster.`);
    } else if (deleteTarget.type === 'single_prospect' && deleteTarget.prospect) {
      const pid = deleteTarget.prospect.id;
      setProspects(prev => prev.filter(p => p.id !== pid));
      if (currentUser) {
        deleteProspectFromFirestore(currentUser.uid, pid).catch(console.error);
      }
      showToast(language === 'he' ? 'המועמדת הוסרה מצינור השיחות.' : 'Candidate removed from talk pipeline.');
    } else if (deleteTarget.type === 'single_tracked' && deleteTarget.trackedPlayer) {
      const pid = deleteTarget.trackedPlayer.id;
      setTrackedPlayers(prev => prev.filter(p => p.id !== pid));
      if (currentUser) {
        deleteTrackedPlayerFromFirestore(currentUser.uid, pid).catch(console.error);
      }
      showToast(language === 'he' ? 'השחקן/ית הוסר/ה מכלי המעקב.' : 'Player removed from Player Tracker.');
    } else if (deleteTarget.type === 'multiple_tracked' && deleteTarget.trackedIds) {
      const ids = new Set(deleteTarget.trackedIds);
      setTrackedPlayers(prev => prev.filter(p => !ids.has(p.id)));
      if (currentUser) {
        deleteMultipleTrackedPlayersFromFirestore(currentUser.uid, deleteTarget.trackedIds).catch(console.error);
      }
      showToast(language === 'he' 
        ? `${deleteTarget.trackedIds.length} שחקנים הוסרו מהמעקב.` 
        : `${deleteTarget.trackedIds.length} players removed from Player Tracker.`);
    }
  };

  // Handlers for Player Tracker
  const handleSaveTrackedPlayer = (player: TrackedPlayer) => {
    setTrackedPlayers(prev => {
      const idx = prev.findIndex(p => p.id === player.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = player;
        return updated;
      }
      return [player, ...prev];
    });
    if (currentUser) {
      saveTrackedPlayerToFirestore(currentUser.uid, player).catch(console.error);
    }
    showToast(language === 'he' 
      ? `השחקן/ית "${player.name}" נשמר/ה בהצלחה במעקב.` 
      : `Player "${player.name}" saved to Player Tracker.`);
  };

  const handleQuickAddGoal = (playerId: string) => {
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
    if (currentUser && updatedPlayer) {
      saveTrackedPlayerToFirestore(currentUser.uid, updatedPlayer).catch(console.error);
    }
  };

  const handleQuickAddAssist = (playerId: string) => {
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
    if (currentUser && updatedPlayer) {
      saveTrackedPlayerToFirestore(currentUser.uid, updatedPlayer).catch(console.error);
    }
  };

  const handleQuickAddMinutes = (playerId: string, minutes: number) => {
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
    if (currentUser && updatedPlayer) {
      saveTrackedPlayerToFirestore(currentUser.uid, updatedPlayer).catch(console.error);
    }
  };

  const handleQuickAddMatch = (playerId: string) => {
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
    if (currentUser && updatedPlayer) {
      saveTrackedPlayerToFirestore(currentUser.uid, updatedPlayer).catch(console.error);
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
    if (currentUser && updatedPlayer) {
      saveTrackedPlayerToFirestore(currentUser.uid, updatedPlayer).catch(console.error);
    }
  };

  const handleUpdateTarget = (playerId: string, target: number) => {
    let updatedPlayer: TrackedPlayer | undefined;
    setTrackedPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        updatedPlayer = { ...p, goalInvolvementTarget: Math.max(0, target) };
        return updatedPlayer;
      }
      return p;
    }));
    if (currentUser && updatedPlayer) {
      saveTrackedPlayerToFirestore(currentUser.uid, updatedPlayer).catch(console.error);
    }
    showToast(language === 'he' ? 'יעד מעורבות בשערים עודכן בהצלחה.' : 'Goal involvement target updated successfully.');
  };

  const handleQuickExtend = (playerId: string, newExpiryDate: string, updatedStatus: any, renewalNote: string) => {
    let updatedPlayer: Player | undefined;
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
    if (currentUser && updatedPlayer) {
      savePlayerToFirestore(currentUser.uid, updatedPlayer).catch(console.error);
    }
    showToast(language === 'he' ? 'הארכת החוזה נרשמה בהצלחה.' : 'Contract extension recorded and expiration alert updated.');
  };

  // Handlers for Prospects ("In Talk With")
  const handleSaveProspect = (savedProspect: TalkProspect) => {
    setProspects(prev => {
      const idx = prev.findIndex(p => p.id === savedProspect.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedProspect;
        return updated;
      }
      return [savedProspect, ...prev];
    });
    if (currentUser) {
      saveProspectToFirestore(currentUser.uid, savedProspect).catch(console.error);
    }
    showToast(language === 'he' 
      ? `המועמדת "${savedProspect.name}" נשמרה בצינור השיחות.` 
      : `Candidate "${savedProspect.name}" saved to talk pipeline.`);
  };

  const handleAddConversationLog = (prospectId: string, newLog: ConversationLog) => {
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
    if (currentUser && updatedProspect) {
      saveProspectToFirestore(currentUser.uid, updatedProspect).catch(console.error);
    }
    showToast(language === 'he' ? 'סיכום שיחה חדש נוסף ליומן.' : 'New interaction note logged.');
  };

  // Convert "In Talk With" Prospect to Signed Agency Player!
  const handleSignProspectToRoster = (prospect: TalkProspect) => {
    const now = new Date();
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2);

    const calculatedMarketVal = prospect.targetSalaryAmount
      ? formatSalary(prospect.targetSalaryAmount * 52 * 2, prospect.targetSalaryCurrency || 'EUR', currency, 'Annual', language)
      : (prospect.scope === 'International' ? '€500,000' : '€350,000');

    const newPlayer: Player = {
      id: `ply-signed-${Date.now()}`,
      name: prospect.name,
      photoUrl: prospect.photoUrl || '/src/assets/images/player_portrait_midfield_1794074972939.jpg',
      age: prospect.age,
      birthDate: prospect.birthDate,
      nationality: prospect.nationality,
      countryCode: prospect.countryCode,
      clubName: prospect.currentClub,
      league: prospect.league,
      position: prospect.position,
      youthCategory: prospect.youthCategory || (prospect.age <= 15 ? 'U15' : prospect.age <= 17 ? 'U17' : prospect.age <= 19 ? 'U19' : 'Senior'),
      jerseyNumber: 10,
      dominantFoot: prospect.scoutingReport.dominantFoot,
      contractStartDate: now.toISOString().split('T')[0],
      contractExpiryDate: expiry.toISOString().split('T')[0],
      status: 'Active',
      marketValue: calculatedMarketVal,
      agencyFeePct: 10,
      representationType: 'Exclusive',
      notes: `Successfully recruited via AURA scouting pipeline from ${prospect.currentClub}. Assigned agent: ${prospect.assignedAgent}.${prospect.targetSalaryAmount ? ` Target compensation agreed at ${formatSalary(prospect.targetSalaryAmount, prospect.targetSalaryCurrency || 'EUR', currency, prospect.targetSalaryPeriod || 'Weekly', language)}.` : ''}`,
      videoHighlightsUrl: prospect.videoUrl,
      createdAt: now.toISOString().split('T')[0]
    };

    setPlayers(prev => [newPlayer, ...prev]);

    let updatedProspect: TalkProspect | undefined;
    setProspects(prev => prev.map(p => {
      if (p.id === prospect.id) {
        updatedProspect = {
          ...p,
          talkStage: 'Signed'
        };
        return updatedProspect;
      }
      return p;
    }));

    if (currentUser) {
      savePlayerToFirestore(currentUser.uid, newPlayer).catch(console.error);
      if (updatedProspect) {
        saveProspectToFirestore(currentUser.uid, updatedProspect).catch(console.error);
      }
    }

    showToast(language === 'he'
      ? `🎉 ברכות! ${prospect.name} הוחתמה רשמית ונוספה לסגל הסוכנות.`
      : `🎉 Congratulations! ${prospect.name} has been officially signed and added to Agency Roster.`);
    setActiveTab('roster');
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
        agencyName: "AURA | Women's Football Agency",
        exportTimestamp: new Date().toISOString(),
        userEmail: currentUser?.email || 'local_session',
        totalPlayers: players.length,
        totalProspects: prospects.length,
        totalTrackedPlayers: trackedPlayers.length,
        players,
        prospects,
        trackedPlayers,
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
      a.download = `aura_agency_backup_${new Date().toISOString().split('T')[0]}.json`;
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

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors antialiased ${language === 'he' ? 'font-hebrew' : ''}`}>
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        playerCount={players.length}
        prospectCount={prospects.length}
        criticalAlertsCount={criticalAlertsCount}
        trackedCount={trackedPlayers.length}
        onOpenAddPlayer={() => {
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
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        currency={currency}
        onChangeCurrency={setCurrency}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
        currentUser={currentUser}
        onLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isCloudSyncing={isCloudSyncing}
        onExportBackup={handleExportBackup}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
          onOpenAddPlayer={() => {
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
          prospectCount={prospects.length}
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
        />

        {/* Main Viewport Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            players={players}
            prospects={prospects}
            onNavigateTab={setActiveTab}
            onSelectPlayer={player => setDetailPlayer(player)}
            onSelectProspect={prospect => {
              handleWatchVideo(
                prospect.videoTitle, 
                prospect.videoUrl, 
                prospect, 
                prospect.videoDescription
              );
            }}
            onOpenQuickExtend={player => setQuickExtendPlayer(player)}
            onOpenAddPlayer={() => {
              setPlayerToEdit(null);
              setIsPlayerModalOpen(true);
            }}
            language={language}
            currency={currency}
          />
        )}

        {activeTab === 'roster' && (
          <PlayerListView
            players={players}
            onSelectPlayer={player => setDetailPlayer(player)}
            onEditPlayer={player => {
              setPlayerToEdit(player);
              setIsPlayerModalOpen(true);
            }}
            onRequestDeletePlayer={handleRequestDeletePlayer}
            onRequestDeleteMultiple={handleRequestDeleteMultiple}
            onQuickExtend={player => setQuickExtendPlayer(player)}
            onOpenAddPlayer={() => {
              setPlayerToEdit(null);
              setIsPlayerModalOpen(true);
            }}
            onUpdateYouthCategory={handleUpdateYouthCategory}
            language={language}
            currency={currency}
          />
        )}

        {activeTab === 'in-talk' && (
          <InTalkWithView
            prospects={prospects}
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
            language={language}
            currency={currency}
          />
        )}

        {activeTab === 'alerts' && (
          <ContractAlertsView
            players={players}
            onSelectPlayer={player => setDetailPlayer(player)}
            onQuickExtend={player => setQuickExtendPlayer(player)}
            onEditPlayer={player => {
              setPlayerToEdit(player);
              setIsPlayerModalOpen(true);
            }}
            language={language}
          />
        )}

        {/* Player Tracker Tool Tab */}
        {activeTab === 'tracker' && (
          <PlayerTrackerView
            players={trackedPlayers}
            onOpenAddPlayer={(cat) => {
              if (cat) setDefaultTrackerCategory(cat);
              setTrackedPlayerToEdit(null);
              setIsAddTrackedModalOpen(true);
            }}
            onEditPlayer={(p) => {
              setTrackedPlayerToEdit(p);
              setIsAddTrackedModalOpen(true);
            }}
            onOpenManualMinutes={(p) => setManualMinutesPlayer(p)}
            onUpdateTarget={handleUpdateTarget}
            onRequestDeletePlayer={(p) => {
              setDeleteTarget({
                isOpen: true,
                type: 'single_tracked',
                trackedPlayer: p
              });
            }}
            onRequestDeleteMultiple={(ids) => {
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
        playerToDelete={deleteTarget.player || deleteTarget.prospect || deleteTarget.trackedPlayer}
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
      />

      {/* Player Detail Dossier Modal */}
      <PlayerDetailModal
        isOpen={!!detailPlayer}
        onClose={() => setDetailPlayer(null)}
        player={detailPlayer}
        onEdit={player => {
          setDetailPlayer(null);
          setPlayerToEdit(player);
          setIsPlayerModalOpen(true);
        }}
        onQuickExtend={player => {
          setDetailPlayer(null);
          setQuickExtendPlayer(player);
        }}
        onRequestDelete={player => {
          setDetailPlayer(null);
          handleRequestDeletePlayer(player);
        }}
        onWatchVideo={(title, videoUrl, player) => {
          handleWatchVideo(title, videoUrl, player);
        }}
        language={language}
        currency={currency}
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
        onLoginAnonymously={handleAnonymousLogin}
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
