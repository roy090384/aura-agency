import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Player,
  TalkProspect,
  TrackedPlayer,
  ForeignProspect,
  AgentProfile,
  Currency,
  Language,
  TeamMemberRule,
  AGENCY_OWNER_EMAIL,
  DEFAULT_APPROVED_TEAM_UID,
  buildTeamMemberPreset
} from '../types/player';

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

/**
 * Real-time subscription to user's agency players
 */
export function subscribeToPlayers(
  userId: string,
  onUpdate: (players: Player[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/players`;
  const colRef = collection(db, 'users', userId, 'players');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const players: Player[] = [];
      snapshot.forEach((docSnap) => {
        players.push(docSnap.data() as Player);
      });
      onUpdate(players);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Save or update player in Firestore
 */
export async function savePlayerToFirestore(userId: string, player: Player) {
  const path = `users/${userId}/players/${player.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'players', player.id);
    const dataToSave = stripUndefined({ ...player, userId });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete player from Firestore
 */
export async function deletePlayerFromFirestore(userId: string, playerId: string) {
  const path = `users/${userId}/players/${playerId}`;
  try {
    const docRef = doc(db, 'users', userId, 'players', playerId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete multiple players from Firestore
 */
export async function deleteMultiplePlayersFromFirestore(userId: string, playerIds: string[]) {
  for (const id of playerIds) {
    await deletePlayerFromFirestore(userId, id);
  }
}

/**
 * Real-time subscription to user's male / youth roster players
 */
export function subscribeToMalePlayers(
  userId: string,
  onUpdate: (players: Player[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/malePlayers`;
  const colRef = collection(db, 'users', userId, 'malePlayers');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const players: Player[] = [];
      snapshot.forEach((docSnap) => {
        players.push(docSnap.data() as Player);
      });
      onUpdate(players);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Save or update male / youth player in Firestore
 */
export async function saveMalePlayerToFirestore(userId: string, player: Player) {
  const path = `users/${userId}/malePlayers/${player.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'malePlayers', player.id);
    const dataToSave = stripUndefined({ ...player, userId });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete male / youth player from Firestore
 */
export async function deleteMalePlayerFromFirestore(userId: string, playerId: string) {
  const path = `users/${userId}/malePlayers/${playerId}`;
  try {
    const docRef = doc(db, 'users', userId, 'malePlayers', playerId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete multiple male / youth players from Firestore
 */
export async function deleteMultipleMalePlayersFromFirestore(userId: string, playerIds: string[]) {
  for (const id of playerIds) {
    await deleteMalePlayerFromFirestore(userId, id);
  }
}

/**
 * Real-time subscription to user's scouting talk prospects
 */
export function subscribeToProspects(
  userId: string,
  onUpdate: (prospects: TalkProspect[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/prospects`;
  const colRef = collection(db, 'users', userId, 'prospects');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const prospects: TalkProspect[] = [];
      snapshot.forEach((docSnap) => {
        prospects.push(docSnap.data() as TalkProspect);
      });
      onUpdate(prospects);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Save or update prospect in Firestore
 */
export async function saveProspectToFirestore(userId: string, prospect: TalkProspect) {
  const path = `users/${userId}/prospects/${prospect.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'prospects', prospect.id);
    const dataToSave = { ...prospect, userId };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete prospect from Firestore
 */
export async function deleteProspectFromFirestore(userId: string, prospectId: string) {
  const path = `users/${userId}/prospects/${prospectId}`;
  try {
    const docRef = doc(db, 'users', userId, 'prospects', prospectId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time subscription to user's tracked players (Player Tracker)
 */
export function subscribeToTrackedPlayers(
  userId: string,
  onUpdate: (trackedPlayers: TrackedPlayer[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/trackedPlayers`;
  const colRef = collection(db, 'users', userId, 'trackedPlayers');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const trackedPlayers: TrackedPlayer[] = [];
      snapshot.forEach((docSnap) => {
        trackedPlayers.push(docSnap.data() as TrackedPlayer);
      });
      onUpdate(trackedPlayers);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Save or update tracked player in Firestore
 */
export async function saveTrackedPlayerToFirestore(userId: string, trackedPlayer: TrackedPlayer) {
  const path = `users/${userId}/trackedPlayers/${trackedPlayer.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'trackedPlayers', trackedPlayer.id);
    const dataToSave = stripUndefined({ ...trackedPlayer, userId });
    await setDoc(docRef, dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete tracked player from Firestore
 */
export async function deleteTrackedPlayerFromFirestore(userId: string, trackedPlayerId: string) {
  const path = `users/${userId}/trackedPlayers/${trackedPlayerId}`;
  try {
    const docRef = doc(db, 'users', userId, 'trackedPlayers', trackedPlayerId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete multiple tracked players from Firestore
 */
export async function deleteMultipleTrackedPlayersFromFirestore(userId: string, ids: string[]) {
  for (const id of ids) {
    await deleteTrackedPlayerFromFirestore(userId, id);
  }
}

/**
 * Real-time subscription to user's international/foreign female prospects
 */
export function subscribeToForeignProspects(
  userId: string,
  onUpdate: (foreignProspects: ForeignProspect[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/foreignProspects`;
  const colRef = collection(db, 'users', userId, 'foreignProspects');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ForeignProspect[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ForeignProspect);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Save or update foreign prospect in Firestore
 */
export async function saveForeignProspectToFirestore(userId: string, prospect: ForeignProspect) {
  const path = `users/${userId}/foreignProspects/${prospect.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'foreignProspects', prospect.id);
    const dataToSave = { ...prospect, userId };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete foreign prospect from Firestore
 */
export async function deleteForeignProspectFromFirestore(userId: string, prospectId: string) {
  const path = `users/${userId}/foreignProspects/${prospectId}`;
  try {
    const docRef = doc(db, 'users', userId, 'foreignProspects', prospectId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time subscription to user's agency preferences (including nextTransferWindowDate and watchedNextMatchKeys)
 */
export function subscribeToPreferences(
  userId: string,
  onUpdate: (prefs: { currency?: Currency; language?: Language; isDarkMode?: boolean; nextTransferWindowDate?: string; watchedNextMatchKeys?: string[] }) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/settings/preferences`;
  const docRef = doc(db, 'users', userId, 'settings', 'preferences');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as { currency?: Currency; language?: Language; isDarkMode?: boolean; nextTransferWindowDate?: string; watchedNextMatchKeys?: string[] });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Save agency preferences (currency, language, theme, nextTransferWindowDate, watchedNextMatchKeys) to Firestore
 */
export async function savePreferencesToFirestore(
  userId: string,
  preferences: { currency: Currency; language: Language; isDarkMode: boolean; nextTransferWindowDate?: string; watchedNextMatchKeys?: string[] }
) {
  const path = `users/${userId}/settings/preferences`;
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'preferences');
    await setDoc(docRef, stripUndefined({ ...preferences, userId, updatedAt: new Date().toISOString() }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Real-time subscription to user's agent directory settings
 */
export function subscribeToAgents(
  userId: string,
  onUpdate: (agents: AgentProfile[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/settings/agents`;
  const docRef = doc(db, 'users', userId, 'settings', 'agents');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.agents) && data.agents.length > 0) {
          onUpdate(data.agents as AgentProfile[]);
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Save agent directory settings (Roy Shpitalnik, Aviv Kamara) to Firestore
 */
export async function saveAgentsToFirestore(userId: string, agents: AgentProfile[]) {
  const path = `users/${userId}/settings/agents`;
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'agents');
    await setDoc(
      docRef,
      {
        agents: agents.map(a => stripUndefined({ ...a })),
        userId,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Smart cloud sync on login: merges any local records into Firestore
 * WITHOUT EVER overwriting or deleting any existing cloud documents.
 */
export async function syncLocalDataToFirestoreIfEmpty(
  userId: string,
  localPlayers: Player[],
  localProspects: TalkProspect[],
  localTracked: TrackedPlayer[],
  localForeignProspects: ForeignProspect[] = [],
  localMalePlayers: Player[] = [],
  localAgents: AgentProfile[] = []
) {
  try {
    // 1. Players: check existing cloud IDs
    const playersCol = collection(db, 'users', userId, 'players');
    const pSnap = await getDocs(playersCol);
    const existingPlayerIds = new Set(pSnap.docs.map(d => d.id));

    for (const p of localPlayers) {
      if (!existingPlayerIds.has(p.id)) {
        await savePlayerToFirestore(userId, p);
      }
    }

    // 1b. Male Roster Players: check existing cloud IDs
    const malePlayersCol = collection(db, 'users', userId, 'malePlayers');
    const mpSnap = await getDocs(malePlayersCol);
    const existingMaleIds = new Set(mpSnap.docs.map(d => d.id));

    for (const mp of localMalePlayers) {
      if (!existingMaleIds.has(mp.id)) {
        await saveMalePlayerToFirestore(userId, mp);
      }
    }

    // 2. Prospects: check existing cloud IDs
    const prospectsCol = collection(db, 'users', userId, 'prospects');
    const prSnap = await getDocs(prospectsCol);
    const existingProspectIds = new Set(prSnap.docs.map(d => d.id));

    for (const pr of localProspects) {
      if (!existingProspectIds.has(pr.id)) {
        await saveProspectToFirestore(userId, pr);
      }
    }

    // 3. Tracked Players: check existing cloud IDs
    const trackedCol = collection(db, 'users', userId, 'trackedPlayers');
    const tSnap = await getDocs(trackedCol);
    const existingTrackedIds = new Set(tSnap.docs.map(d => d.id));

    for (const tp of localTracked) {
      if (!existingTrackedIds.has(tp.id)) {
        await saveTrackedPlayerToFirestore(userId, tp);
      }
    }

    // 4. Foreign Prospects: check existing cloud IDs
    const foreignCol = collection(db, 'users', userId, 'foreignProspects');
    const fSnap = await getDocs(foreignCol);
    const existingForeignIds = new Set(fSnap.docs.map(d => d.id));

    for (const fp of localForeignProspects) {
      if (!existingForeignIds.has(fp.id)) {
        await saveForeignProspectToFirestore(userId, fp);
      }
    }

    // 5. Agent Settings: seed if document does not exist yet
    if (localAgents.length > 0) {
      const agentsDocRef = doc(db, 'users', userId, 'settings', 'agents');
      const agentsSnap = await getDoc(agentsDocRef);
      if (!agentsSnap.exists()) {
        await saveAgentsToFirestore(userId, localAgents);
      }
    }
  } catch (err) {
    console.error('Error during smart cloud synchronization:', err);
  }
}

export type WorkspaceResolutionResult =
  | { status: 'owner'; workspaceUid: string }
  | { status: 'member'; workspaceUid: string; rule: TeamMemberRule }
  | { status: 'disabled'; workspaceUid: string; rule: TeamMemberRule }
  | { status: 'unauthorized' };

/**
 * Registers the primary shared CRM workspace pointer when the verified agency owner logs in.
 */
export async function registerWorkspaceDirectory(ownerUid: string) {
  const path = 'workspaceDirectory/primary';
  try {
    const docRef = doc(db, 'workspaceDirectory', 'primary');
    await setDoc(
      docRef,
      {
        ownerUid,
        agencyName: 'BRIT SPORT GROUP',
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function normalizeTeamMemberRule(ownerUid: string, raw: Partial<TeamMemberRule> & { uid: string }): TeamMemberRule {
  const now = new Date().toISOString();
  const role: TeamMemberRule['role'] =
    raw.role === 'manager' || raw.role === 'viewer' || raw.role === 'regular'
      ? raw.role
      : 'regular';
  const cleanUid = String(raw.uid || '').trim();
  const cleanEmail = typeof raw.email === 'string' ? raw.email.trim() : '';
  const cleanName = typeof raw.displayName === 'string' ? raw.displayName.trim() : '';

  return {
    uid: cleanUid,
    displayName: cleanName || cleanEmail || 'Team User',
    email: cleanEmail,
    role,
    active: raw.active === undefined ? true : Boolean(raw.active),
    canViewPlayers: Boolean(raw.canViewPlayers),
    canCreatePlayers: Boolean(raw.canCreatePlayers),
    canEditPlayers: Boolean(raw.canEditPlayers),
    canDeletePlayers: Boolean(raw.canDeletePlayers),
    canAccessScouting: Boolean(raw.canAccessScouting),
    canEditTracker: Boolean(raw.canEditTracker),
    userId: ownerUid,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : now
  };
}

/**
 * Seeds the pre-approved regular user UID if not yet stored in teamMembers (Owner only).
 */
export async function seedDefaultTeamMemberIfMissing(ownerUid: string) {
  const path = `users/${ownerUid}/teamMembers/${DEFAULT_APPROVED_TEAM_UID}`;
  try {
    const docRef = doc(db, 'users', ownerUid, 'teamMembers', DEFAULT_APPROVED_TEAM_UID);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      const defaultRule = buildTeamMemberPreset(
        DEFAULT_APPROVED_TEAM_UID,
        ownerUid,
        'regular',
        'Regular User',
        ''
      );
      await setDoc(docRef, stripUndefined(defaultRule));
    }
  } catch (error) {
    console.warn(`Could not verify default team member ${path}:`, error);
  }
}

/**
 * Resolves whether the signed-in Firebase user is the Agency Owner or an approved Team Member.
 */
export async function resolveWorkspaceForUser(user: User): Promise<WorkspaceResolutionResult> {
  const normalizedEmail = (user.email || '').trim().toLowerCase();
  if (normalizedEmail === AGENCY_OWNER_EMAIL && user.emailVerified) {
    return { status: 'owner', workspaceUid: user.uid };
  }

  if (user.isAnonymous) {
    return { status: 'unauthorized' };
  }

  try {
    const dirSnap = await getDoc(doc(db, 'workspaceDirectory', 'primary'));
    if (!dirSnap.exists()) {
      return { status: 'unauthorized' };
    }
    const ownerUid = String(dirSnap.data()?.ownerUid || '');
    if (!ownerUid) {
      return { status: 'unauthorized' };
    }

    const memberSnap = await getDoc(doc(db, 'users', ownerUid, 'teamMembers', user.uid));
    if (!memberSnap.exists()) {
      return { status: 'unauthorized' };
    }

    const rule = normalizeTeamMemberRule(ownerUid, {
      ...(memberSnap.data() as Partial<TeamMemberRule>),
      uid: user.uid
    });
    if (!rule.active) {
      return { status: 'disabled', workspaceUid: ownerUid, rule };
    }

    return { status: 'member', workspaceUid: ownerUid, rule };
  } catch (err) {
    console.warn('Workspace access check denied or unavailable:', err);
    return { status: 'unauthorized' };
  }
}

/**
 * Owner subscription to all approved team member access rules.
 */
export function subscribeToTeamMembers(
  ownerUid: string,
  onUpdate: (members: TeamMemberRule[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${ownerUid}/teamMembers`;
  const colRef = collection(db, 'users', ownerUid, 'teamMembers');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: TeamMemberRule[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as Partial<TeamMemberRule>;
        list.push(
          normalizeTeamMemberRule(ownerUid, {
            ...raw,
            uid: raw.uid || docSnap.id
          })
        );
      });
      list.sort((a, b) => (a.displayName || a.uid).localeCompare(b.displayName || b.uid));
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Team member real-time subscription to their own access rule (so toggles take effect live).
 */
export function subscribeToMyTeamMemberRule(
  ownerUid: string,
  memberUid: string,
  onUpdate: (rule: TeamMemberRule | null) => void
) {
  const docRef = doc(db, 'users', ownerUid, 'teamMembers', memberUid);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null);
      } else {
        const raw = snapshot.data() as Partial<TeamMemberRule>;
        onUpdate(
          normalizeTeamMemberRule(ownerUid, {
            ...raw,
            uid: raw.uid || snapshot.id
          })
        );
      }
    },
    () => {
      onUpdate(null);
    }
  );
}

/**
 * Owner-only write for saving or updating a team member access rule.
 */
export async function saveTeamMemberRuleToFirestore(ownerUid: string, member: TeamMemberRule): Promise<TeamMemberRule> {
  const normalized = normalizeTeamMemberRule(ownerUid, {
    ...member,
    updatedAt: new Date().toISOString()
  });

  if (!normalized.uid || !/^[a-zA-Z0-9_-]+$/.test(normalized.uid) || normalized.uid.length > 128) {
    throw new Error('Invalid Firebase User UID. Please paste the exact alphanumeric Firebase Auth UID (not an email address).');
  }

  const path = `users/${ownerUid}/teamMembers/${normalized.uid}`;
  try {
    const docRef = doc(db, 'users', ownerUid, 'teamMembers', normalized.uid);
    const payload = stripUndefined(normalized);
    await setDoc(docRef, payload, { merge: true });
    return normalized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Owner-only delete for revoking/removing a team member rule.
 */
export async function deleteTeamMemberRuleFromFirestore(ownerUid: string, memberUid: string) {
  const cleanUid = memberUid.trim();
  const path = `users/${ownerUid}/teamMembers/${cleanUid}`;
  try {
    await deleteDoc(doc(db, 'users', ownerUid, 'teamMembers', cleanUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
