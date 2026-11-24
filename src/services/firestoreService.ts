import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
  getDoc,
  disableNetwork,
  enableNetwork
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

let writeQuotaPaused = false;
const WRITE_BACKOFF_TIMEOUT_MS = 10000;

export function isWriteQuotaPaused(): boolean {
  return writeQuotaPaused;
}

export function resetWriteQuotaPause(): void {
  const wasPaused = writeQuotaPaused;
  writeQuotaPaused = false;
  if (wasPaused) {
    enableNetwork(db).catch(() => {});
  }
}

export function isQuotaExceededError(error: unknown): boolean {
  const raw =
    error instanceof Error
      ? `${(error as any).code || ''} ${error.message}`
      : String(error || '');
  const lower = raw.toLowerCase();
  return (
    lower.includes('resource-exhausted') ||
    lower.includes('quota exceeded') ||
    lower.includes('quota limit exceeded')
  );
}

function pauseForQuota(path: string): never {
  writeQuotaPaused = true;
  // Close Firestore's persistent WriteStream immediately so the SDK stops retrying in maximum backoff loops
  disableNetwork(db).catch(() => {});
  throw new Error(`Firestore daily quota limit reached (resource-exhausted) at ${path}`);
}

function assertWriteQuotaAvailable(path: string) {
  if (writeQuotaPaused) {
    throw new Error(`Firestore daily quota limit reached (resource-exhausted) at ${path}`);
  }
}

async function executeFirestoreWrite<T>(
  path: string,
  operationType: OperationType,
  writeFn: () => Promise<T>
): Promise<T> {
  assertWriteQuotaAvailable(path);
  let timerId: number | undefined;
  try {
    if (typeof window !== 'undefined' && navigator.onLine !== false) {
      return await Promise.race([
        writeFn(),
        new Promise<never>((_, reject) => {
          timerId = window.setTimeout(() => {
            reject(new Error(`Firestore write stalled — quota or backend backoff (resource-exhausted) at ${path}`));
          }, WRITE_BACKOFF_TIMEOUT_MS);
        })
      ]);
    }
    return await writeFn();
  } catch (error) {
    if (isQuotaExceededError(error)) {
      pauseForQuota(path);
    }
    handleFirestoreError(error, operationType, path);
    throw error;
  } finally {
    if (timerId !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(timerId);
    }
  }
}

function handleSnapshotError(error: unknown, path: string, onError?: (err: any) => void) {
  if (onError) onError(error);
  if (isQuotaExceededError(error)) {
    writeQuotaPaused = true;
    disableNetwork(db).catch(() => {});
    console.warn(`Firestore quota reached on listener (${path}). Operating with cached/local state.`);
    return;
  }
  handleFirestoreError(error, OperationType.GET, path);
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
      handleSnapshotError(error, path, onError);
    }
  );
}

/**
 * Save or update player in Firestore
 */
export async function savePlayerToFirestore(userId: string, player: Player) {
  const path = `users/${userId}/players/${player.id}`;
  const docRef = doc(db, 'users', userId, 'players', player.id);
  const dataToSave = stripUndefined({ ...player, userId });
  await executeFirestoreWrite(path, OperationType.WRITE, () =>
    setDoc(docRef, dataToSave, { merge: true })
  );
}

/**
 * Delete player from Firestore
 */
export async function deletePlayerFromFirestore(userId: string, playerId: string) {
  const path = `users/${userId}/players/${playerId}`;
  const docRef = doc(db, 'users', userId, 'players', playerId);
  await executeFirestoreWrite(path, OperationType.DELETE, () => deleteDoc(docRef));
}

/**
 * Delete multiple players from Firestore
 */
export async function deleteMultiplePlayersFromFirestore(userId: string, playerIds: string[]) {
  for (const id of playerIds) {
    if (writeQuotaPaused) break;
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
      handleSnapshotError(error, path, onError);
    }
  );
}

/**
 * Save or update male / youth player in Firestore
 */
export async function saveMalePlayerToFirestore(userId: string, player: Player) {
  const path = `users/${userId}/malePlayers/${player.id}`;
  const docRef = doc(db, 'users', userId, 'malePlayers', player.id);
  const dataToSave = stripUndefined({ ...player, userId });
  await executeFirestoreWrite(path, OperationType.WRITE, () =>
    setDoc(docRef, dataToSave, { merge: true })
  );
}

/**
 * Delete male / youth player from Firestore
 */
export async function deleteMalePlayerFromFirestore(userId: string, playerId: string) {
  const path = `users/${userId}/malePlayers/${playerId}`;
  const docRef = doc(db, 'users', userId, 'malePlayers', playerId);
  await executeFirestoreWrite(path, OperationType.DELETE, () => deleteDoc(docRef));
}

/**
 * Delete multiple male / youth players from Firestore
 */
export async function deleteMultipleMalePlayersFromFirestore(userId: string, playerIds: string[]) {
  for (const id of playerIds) {
    if (writeQuotaPaused) break;
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
      handleSnapshotError(error, path, onError);
    }
  );
}

/**
 * Save or update prospect in Firestore
 */
export async function saveProspectToFirestore(userId: string, prospect: TalkProspect) {
  const path = `users/${userId}/prospects/${prospect.id}`;
  const docRef = doc(db, 'users', userId, 'prospects', prospect.id);
  const dataToSave = stripUndefined({ ...prospect, userId });
  await executeFirestoreWrite(path, OperationType.WRITE, () =>
    setDoc(docRef, dataToSave, { merge: true })
  );
}

/**
 * Delete prospect from Firestore
 */
export async function deleteProspectFromFirestore(userId: string, prospectId: string) {
  const path = `users/${userId}/prospects/${prospectId}`;
  const docRef = doc(db, 'users', userId, 'prospects', prospectId);
  await executeFirestoreWrite(path, OperationType.DELETE, () => deleteDoc(docRef));
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
      handleSnapshotError(error, path, onError);
    }
  );
}

/**
 * Save or update tracked player in Firestore
 */
export async function saveTrackedPlayerToFirestore(userId: string, trackedPlayer: TrackedPlayer) {
  const path = `users/${userId}/trackedPlayers/${trackedPlayer.id}`;
  const docRef = doc(db, 'users', userId, 'trackedPlayers', trackedPlayer.id);
  const dataToSave = stripUndefined({ ...trackedPlayer, userId });
  await executeFirestoreWrite(path, OperationType.WRITE, () => setDoc(docRef, dataToSave));
}

/**
 * Delete tracked player from Firestore
 */
export async function deleteTrackedPlayerFromFirestore(userId: string, trackedPlayerId: string) {
  const path = `users/${userId}/trackedPlayers/${trackedPlayerId}`;
  const docRef = doc(db, 'users', userId, 'trackedPlayers', trackedPlayerId);
  await executeFirestoreWrite(path, OperationType.DELETE, () => deleteDoc(docRef));
}

/**
 * Delete multiple tracked players from Firestore
 */
export async function deleteMultipleTrackedPlayersFromFirestore(userId: string, ids: string[]) {
  for (const id of ids) {
    if (writeQuotaPaused) break;
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
      handleSnapshotError(error, path, onError);
    }
  );
}

/**
 * Save or update foreign prospect in Firestore
 */
export async function saveForeignProspectToFirestore(userId: string, prospect: ForeignProspect) {
  const path = `users/${userId}/foreignProspects/${prospect.id}`;
  const docRef = doc(db, 'users', userId, 'foreignProspects', prospect.id);
  const dataToSave = stripUndefined({ ...prospect, userId });
  await executeFirestoreWrite(path, OperationType.WRITE, () =>
    setDoc(docRef, dataToSave, { merge: true })
  );
}

/**
 * Delete foreign prospect from Firestore
 */
export async function deleteForeignProspectFromFirestore(userId: string, prospectId: string) {
  const path = `users/${userId}/foreignProspects/${prospectId}`;
  const docRef = doc(db, 'users', userId, 'foreignProspects', prospectId);
  await executeFirestoreWrite(path, OperationType.DELETE, () => deleteDoc(docRef));
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
      handleSnapshotError(error, path, onError);
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
  const docRef = doc(db, 'users', userId, 'settings', 'preferences');
  const payload = stripUndefined({ ...preferences, userId, updatedAt: new Date().toISOString() });
  await executeFirestoreWrite(path, OperationType.WRITE, () =>
    setDoc(docRef, payload, { merge: true })
  );
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
      handleSnapshotError(error, path, onError);
    }
  );
}

/**
 * Save agent directory settings (Roy Shpitalnik, Aviv Kamara) to Firestore
 */
export async function saveAgentsToFirestore(userId: string, agents: AgentProfile[]) {
  const path = `users/${userId}/settings/agents`;
  const docRef = doc(db, 'users', userId, 'settings', 'agents');
  await executeFirestoreWrite(path, OperationType.WRITE, () =>
    setDoc(
      docRef,
      {
        agents: agents.map(a => stripUndefined({ ...a })),
        userId,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    )
  );
}

/**
 * Smart cloud sync on initial login: seeds Firestore ONLY if the cloud workspace is genuinely empty
 * (so subsequent page reloads perform zero migration writes).
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
  if (writeQuotaPaused) return;
  const seededKey = `aura_cloud_seeded_${userId}_v1`;
  try {
    if (typeof window !== 'undefined' && localStorage.getItem(seededKey) === '1') {
      return;
    }

    const [pSnap, mpSnap, prSnap, tSnap, fSnap] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'players')),
      getDocs(collection(db, 'users', userId, 'malePlayers')),
      getDocs(collection(db, 'users', userId, 'prospects')),
      getDocs(collection(db, 'users', userId, 'trackedPlayers')),
      getDocs(collection(db, 'users', userId, 'foreignProspects'))
    ]);

    const cloudHasData =
      !pSnap.empty || !mpSnap.empty || !prSnap.empty || !tSnap.empty || !fSnap.empty;

    if (cloudHasData) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(seededKey, '1');
      }
      return;
    }

    for (const p of localPlayers) {
      if (writeQuotaPaused) return;
      await savePlayerToFirestore(userId, p);
    }

    for (const mp of localMalePlayers) {
      if (writeQuotaPaused) return;
      await saveMalePlayerToFirestore(userId, mp);
    }

    for (const pr of localProspects) {
      if (writeQuotaPaused) return;
      await saveProspectToFirestore(userId, pr);
    }

    for (const tp of localTracked) {
      if (writeQuotaPaused) return;
      await saveTrackedPlayerToFirestore(userId, tp);
    }

    for (const fp of localForeignProspects) {
      if (writeQuotaPaused) return;
      await saveForeignProspectToFirestore(userId, fp);
    }

    if (localAgents.length > 0 && !writeQuotaPaused) {
      const agentsDocRef = doc(db, 'users', userId, 'settings', 'agents');
      const agentsSnap = await getDoc(agentsDocRef);
      if (!agentsSnap.exists()) {
        await saveAgentsToFirestore(userId, localAgents);
      }
    }

    if (!writeQuotaPaused && typeof window !== 'undefined') {
      localStorage.setItem(seededKey, '1');
    }
  } catch (err) {
    if (isQuotaExceededError(err)) {
      writeQuotaPaused = true;
      console.warn('Smart cloud synchronization paused because Firestore daily quota was reached.');
      return;
    }
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
  if (writeQuotaPaused) return;
  try {
    const docRef = doc(db, 'workspaceDirectory', 'primary');
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists() && existingSnap.data()?.ownerUid === ownerUid) {
      return;
    }
    await executeFirestoreWrite(path, OperationType.WRITE, () =>
      setDoc(
        docRef,
        {
          ownerUid,
          agencyName: 'BRIT SPORT GROUP',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      )
    );
  } catch (error) {
    if (isQuotaExceededError(error)) {
      writeQuotaPaused = true;
      return;
    }
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
  if (writeQuotaPaused) return;
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
      await executeFirestoreWrite(path, OperationType.WRITE, () =>
        setDoc(docRef, stripUndefined(defaultRule))
      );
    }
  } catch (error) {
    if (isQuotaExceededError(error)) {
      writeQuotaPaused = true;
      return;
    }
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
      handleSnapshotError(error, path, onError);
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
    (error) => {
      if (isQuotaExceededError(error)) {
        writeQuotaPaused = true;
        disableNetwork(db).catch(() => {});
        console.warn('Firestore quota reached on team rule listener; retaining active session permissions.');
        return;
      }
      if ((error as any)?.code === 'permission-denied') {
        onUpdate(null);
      }
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
  const docRef = doc(db, 'users', ownerUid, 'teamMembers', normalized.uid);
  const payload = stripUndefined(normalized);
  await executeFirestoreWrite(path, OperationType.WRITE, () =>
    setDoc(docRef, payload, { merge: true })
  );
  return normalized;
}

/**
 * Owner-only delete for revoking/removing a team member rule.
 */
export async function deleteTeamMemberRuleFromFirestore(ownerUid: string, memberUid: string) {
  const cleanUid = memberUid.trim();
  const path = `users/${ownerUid}/teamMembers/${cleanUid}`;
  await executeFirestoreWrite(path, OperationType.DELETE, () =>
    deleteDoc(doc(db, 'users', ownerUid, 'teamMembers', cleanUid))
  );
}
