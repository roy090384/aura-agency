import {
  LeaveCheckpoint,
  MinutesClausePct,
  Player,
  TrackedPlayer,
  TrackerCategory,
  TrainingAgreementData,
  YouthCategory
} from '../types/player';
import { calculatePlayTimePercentage, getTotalPossibleMinutes } from './trackerCalculations';

export const MINUTES_CLAUSE_OPTIONS: MinutesClausePct[] = [30, 40, 50, 55, 60, 70, 80];

export const LEAVE_CHECKPOINT_OPTIONS: LeaveCheckpoint[] = [
  'Winter 27',
  'Summer 27',
  'Winter 28'
];

export function buildDefaultTrainingAgreement(): TrainingAgreementData {
  return {
    contractMode: 'contracted',
    clubContractEndDate: '',
    hasOneSideOption: false,
    optionSide: 'Club Option',
    optionNote: '',
    salaryAmount: '',
    salaryPeriod: 'Monthly',
    minutesClauseEnabled: false,
    minutesThresholdPct: 50,
    minutesCheckpoint: 'Winter 27',
    syncMinutesWithTracker: true,
    benefits: {
      shoes: false,
      shoesDetails: '',
      nationalTeamBonus: false,
      nationalTeamBonusAmount: '',
      appearancesBonus: false,
      appearancesBonusAmount: '',
      appearancesThreshold: ''
    },
    releaseToBiggerClubsEnabled: false,
    releaseClubs: [],
    ifaRegulationNote: '',
    customNotes: ''
  };
}

export function mapYouthCategoryToTrackerCategory(
  youthCat?: YouthCategory,
  rosterType: 'female' | 'male' = 'female'
): TrackerCategory {
  switch (youthCat) {
    case 'U14':
    case 'U15':
      return 'U15';
    case 'U16':
      return 'U16';
    case 'U17':
      return 'U17';
    case 'U19':
      return 'U19';
    case 'Senior':
    default:
      return rosterType === 'female' ? 'Womans' : 'U19';
  }
}

export function findMatchingTrackedPlayer(
  player: Player,
  rosterType: 'female' | 'male',
  trackedPlayers: TrackedPlayer[]
): TrackedPlayer | undefined {
  const byId = trackedPlayers.find(tp => tp.linkedPlayerId === player.id);
  if (byId) return byId;

  const targetGender = rosterType === 'female' ? 'Female' : 'Male';
  const normalizedName = player.name.trim().toLowerCase();
  return trackedPlayers.find(
    tp =>
      tp.gender === targetGender &&
      tp.name.trim().toLowerCase() === normalizedName
  );
}

export function resolveTrackedPlayerMinutesClause(
  trackedPlayer: TrackedPlayer,
  femalePlayers: Player[],
  malePlayers: Player[]
): {
  minPct: number | null;
  checkpoint?: string;
  linkedPlayer?: Player;
  linkedRosterType?: 'female' | 'male';
} {
  const normalizedName = trackedPlayer.name.trim().toLowerCase();

  let linkedPlayer: Player | undefined;
  let linkedRosterType: 'female' | 'male' | undefined = trackedPlayer.linkedRosterType;

  if (trackedPlayer.linkedPlayerId) {
    if (trackedPlayer.linkedRosterType === 'male') {
      linkedPlayer = malePlayers.find(p => p.id === trackedPlayer.linkedPlayerId);
    } else if (trackedPlayer.linkedRosterType === 'female') {
      linkedPlayer = femalePlayers.find(p => p.id === trackedPlayer.linkedPlayerId);
    } else {
      linkedPlayer =
        femalePlayers.find(p => p.id === trackedPlayer.linkedPlayerId) ||
        malePlayers.find(p => p.id === trackedPlayer.linkedPlayerId);
      if (linkedPlayer) {
        linkedRosterType = femalePlayers.some(p => p.id === linkedPlayer?.id) ? 'female' : 'male';
      }
    }
  }

  if (!linkedPlayer) {
    if (trackedPlayer.gender === 'Female') {
      linkedPlayer = femalePlayers.find(p => p.name.trim().toLowerCase() === normalizedName);
      if (linkedPlayer) linkedRosterType = 'female';
    } else {
      linkedPlayer = malePlayers.find(p => p.name.trim().toLowerCase() === normalizedName);
      if (linkedPlayer) linkedRosterType = 'male';
    }
  }

  const agreement = linkedPlayer?.trainingAgreement;
  if (agreement?.minutesClauseEnabled && agreement.minutesThresholdPct) {
    return {
      minPct: agreement.minutesThresholdPct,
      checkpoint: agreement.minutesCheckpoint,
      linkedPlayer,
      linkedRosterType
    };
  }

  if (trackedPlayer.minMinutesClausePct && trackedPlayer.minMinutesClausePct > 0) {
    return {
      minPct: trackedPlayer.minMinutesClausePct,
      checkpoint: trackedPlayer.minutesCheckpoint,
      linkedPlayer,
      linkedRosterType
    };
  }

  return {
    minPct: null,
    linkedPlayer,
    linkedRosterType
  };
}

export function evaluateMinutesClauseStatus(
  trackedPlayer: TrackedPlayer,
  minPct: number
) {
  const actualPct = calculatePlayTimePercentage(
    trackedPlayer.minutesPlayed,
    trackedPlayer.matchesEligible,
    trackedPlayer.category
  );
  const totalPossibleMinutes = getTotalPossibleMinutes(
    trackedPlayer.matchesEligible,
    trackedPlayer.category,
    trackedPlayer.minutesPlayed
  );
  const deltaPct = actualPct - minPct;
  const isMet = actualPct >= minPct;
  const isClose = !isMet && minPct - actualPct <= 5;
  return {
    actualPct,
    minPct,
    deltaPct,
    isMet,
    isClose,
    totalPossibleMinutes
  };
}

export function createSyncedTrackedPlayerFromRoster(
  player: Player,
  rosterType: 'female' | 'male',
  minPct?: number,
  checkpoint?: LeaveCheckpoint
): TrackedPlayer {
  return {
    id: `trk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: player.name,
    photoUrl: player.photoUrl || '',
    gender: rosterType === 'female' ? 'Female' : 'Male',
    category: mapYouthCategoryToTrackerCategory(player.youthCategory, rosterType),
    age: player.age || 18,
    clubName: player.clubName,
    league: player.league || '',
    position: player.position,
    jerseyNumber: player.jerseyNumber || undefined,
    matchesEligible: 0,
    matchesPlayed: 0,
    minutesPlayed: 0,
    goals: player.goals || 0,
    assists: player.assists || 0,
    goalInvolvementTarget: player.goalInvolvementTarget,
    linkedPlayerId: player.id,
    linkedRosterType: rosterType,
    minMinutesClausePct: minPct,
    minutesCheckpoint: checkpoint,
    createdAt: new Date().toISOString().split('T')[0]
  };
}

export function findMatchingRosterPlayerForTracked(
  trackedPlayer: TrackedPlayer,
  femalePlayers: Player[],
  malePlayers: Player[]
): { player: Player; rosterType: 'female' | 'male' } | null {
  if (trackedPlayer.linkedPlayerId) {
    if (trackedPlayer.linkedRosterType === 'male') {
      const m = malePlayers.find(p => p.id === trackedPlayer.linkedPlayerId);
      if (m) return { player: m, rosterType: 'male' };
    } else if (trackedPlayer.linkedRosterType === 'female') {
      const f = femalePlayers.find(p => p.id === trackedPlayer.linkedPlayerId);
      if (f) return { player: f, rosterType: 'female' };
    } else {
      const f = femalePlayers.find(p => p.id === trackedPlayer.linkedPlayerId);
      if (f) return { player: f, rosterType: 'female' };
      const m = malePlayers.find(p => p.id === trackedPlayer.linkedPlayerId);
      if (m) return { player: m, rosterType: 'male' };
    }
  }

  const normalizedName = trackedPlayer.name.trim().toLowerCase();
  if (!normalizedName) return null;

  if (trackedPlayer.gender === 'Male') {
    const m = malePlayers.find(p => p.name.trim().toLowerCase() === normalizedName);
    if (m) return { player: m, rosterType: 'male' };
  } else {
    const f = femalePlayers.find(p => p.name.trim().toLowerCase() === normalizedName);
    if (f) return { player: f, rosterType: 'female' };
  }

  return null;
}

/**
 * Syncs Female Roster & Male Roster details + Training Agreement minutes clauses
 * onto ONLY the players already present in Player Tracker.
 * Strictly keeps the existing trackedPlayers list and NEVER adds new players.
 */
export function syncExistingTrackedPlayersWithRosters(
  trackedPlayers: TrackedPlayer[],
  femalePlayers: Player[],
  malePlayers: Player[]
): {
  nextTrackedPlayers: TrackedPlayer[];
  updatedTrackedPlayers: TrackedPlayer[];
  linkedCount: number;
  unmatchedCount: number;
} {
  const updatedTrackedPlayers: TrackedPlayer[] = [];
  let linkedCount = 0;
  let unmatchedCount = 0;

  const nextTrackedPlayers = trackedPlayers.map(tp => {
    const match = findMatchingRosterPlayerForTracked(tp, femalePlayers, malePlayers);
    if (!match) {
      unmatchedCount++;
      return tp;
    }

    linkedCount++;
    const { player: rp, rosterType } = match;
    const agreement = rp.trainingAgreement;

    let nextMinPct = tp.minMinutesClausePct;
    let nextCheckpoint = tp.minutesCheckpoint;

    if (agreement) {
      if (agreement.minutesClauseEnabled && agreement.minutesThresholdPct) {
        if (agreement.syncMinutesWithTracker !== false) {
          nextMinPct = agreement.minutesThresholdPct;
          nextCheckpoint = agreement.minutesCheckpoint;
        }
      } else {
        nextMinPct = undefined;
        nextCheckpoint = undefined;
      }
    }

    const nextClub = rp.clubName || tp.clubName;
    const nextLeague = rp.league || tp.league;
    const nextAge = rp.age || tp.age;
    const nextPosition = rp.position || tp.position;
    const nextPhoto = rp.photoUrl || tp.photoUrl;

    const hasChanges =
      tp.linkedPlayerId !== rp.id ||
      tp.linkedRosterType !== rosterType ||
      tp.clubName !== nextClub ||
      (tp.league || '') !== (nextLeague || '') ||
      tp.age !== nextAge ||
      tp.position !== nextPosition ||
      (tp.photoUrl || '') !== (nextPhoto || '') ||
      tp.minMinutesClausePct !== nextMinPct ||
      (tp.minutesCheckpoint || '') !== (nextCheckpoint || '');

    if (!hasChanges) {
      return tp;
    }

    const updated: TrackedPlayer = {
      ...tp,
      linkedPlayerId: rp.id,
      linkedRosterType: rosterType,
      clubName: nextClub,
      league: nextLeague,
      age: nextAge,
      position: nextPosition,
      photoUrl: nextPhoto,
      minMinutesClausePct: nextMinPct,
      minutesCheckpoint: nextCheckpoint
    };

    updatedTrackedPlayers.push(updated);
    return updated;
  });

  return {
    nextTrackedPlayers,
    updatedTrackedPlayers,
    linkedCount,
    unmatchedCount
  };
}
