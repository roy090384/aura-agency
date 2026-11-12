import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Player, TalkProspect, TrackedPlayer, Currency, Language } from '../types/player';

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
    const dataToSave = { ...player, userId };
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
 * Smart cloud sync on login: merges any local records into Firestore
 * WITHOUT EVER overwriting or deleting any existing cloud documents.
 */
export async function syncLocalDataToFirestoreIfEmpty(
  userId: string,
  localPlayers: Player[],
  localProspects: TalkProspect[],
  localTracked: TrackedPlayer[]
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
  } catch (err) {
    console.error('Error during smart cloud synchronization:', err);
  }
}
