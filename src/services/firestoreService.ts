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
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Player, TalkProspect, TrackedPlayer, ForeignProspect, AgentProfile, Currency, Language } from '../types/player';

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      cleaned[k] = v;
    }
  }
  return cleaned as T;
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
    const dataToSave = { ...trackedPlayer, userId };
    await setDoc(docRef, dataToSave, { merge: true });
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
 * Save agency preferences (currency, language, theme) to Firestore
 */
export async function savePreferencesToFirestore(
  userId: string,
  preferences: { currency: Currency; language: Language; isDarkMode: boolean }
) {
  const path = `users/${userId}/settings/preferences`;
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'preferences');
    await setDoc(docRef, { ...preferences, userId, updatedAt: new Date().toISOString() }, { merge: true });
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
