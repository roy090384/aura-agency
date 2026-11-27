export type PlayerPosition = 
  | 'Goalkeeper (GK)'
  | 'Centre-Back (CB)'
  | 'Left-Back (LB)'
  | 'Right-Back (RB)'
  | 'Defensive Midfield (CDM)'
  | 'Central Midfield (CM)'
  | 'Attacking Midfield (CAM)'
  | 'Left Winger (LW)'
  | 'Right Winger (RW)'
  | 'Striker (ST)';

export type PlayerStatus = 
  | 'Active'
  | 'Injured'
  | 'On Loan'
  | 'Free Agent'
  | 'Pending Renewal'
  | 'Negotiating'
  | 'Transferred';

export type ContractUrgency = 'EXPIRED' | 'CRITICAL_1_MONTH' | 'APPROACHING_3_MONTHS' | 'HEALTHY';

export type YouthCategory = 'Senior' | 'U19' | 'U17' | 'U16' | 'U15' | 'U14';

export type TrackerCategory = 'U15' | 'U16' | 'U17' | 'U19' | 'Womans';
export type PlayerGender = 'Female' | 'Male';

export type NavigationTab = 'dashboard' | 'roster' | 'male-roster' | 'youth-matches' | 'in-talk' | 'alerts' | 'tracker' | 'compensation' | 'agent-settings';

export interface AgentProfile {
  id: string;
  name: string;
  role?: string;
  phone: string;
  email: string;
  updatedAt?: string;
}

export type Currency = 'EUR' | 'USD' | 'ILS';
export type SalaryPeriod = 'Weekly' | 'Monthly' | 'Annual';

export type Language = 'en' | 'he';

export type MinutesClausePct = 30 | 40 | 50 | 55 | 60 | 70 | 80;
export type LeaveCheckpoint = 'Winter 27' | 'Summer 27' | 'Winter 28';
export type ContractOptionSide = 'None' | 'Club Option' | 'Player Option' | 'Mutual Option';

export interface ReleaseClubClause {
  id: string;
  clubName: string;
  amount: string;
  notes?: string;
}

export interface SeasonalSalaryEntry {
  id: string;
  season: string;
  amount: string;
  period: SalaryPeriod;
  notes?: string;
}

export type GoalsOrAssistsScope = 'Goals' | 'Assists' | 'Goals & Assists';

export interface TrainingAgreementBenefits {
  shoes?: boolean;
  shoesDetails?: string;
  nationalTeamBonus?: boolean;
  nationalTeamBonusAmount?: string;
  appearancesBonus?: boolean;
  appearancesBonusAmount?: string;
  appearancesThreshold?: string;
  goalsOrAssistsBonus?: boolean;
  goalsOrAssistsType?: GoalsOrAssistsScope;
  goalsOrAssistsThreshold?: string;
  goalsOrAssistsBonusAmount?: string;
  pointsBonus?: boolean;
  pointsThreshold?: string;
  pointsBonusAmount?: string;
}

export interface TrainingAgreementData {
  contractMode: 'contracted' | 'ifa_regulations';
  clubContractEndDate?: string;
  hasOneSideOption?: boolean;
  optionSide?: ContractOptionSide;
  optionNote?: string;
  salaryAmount?: string;
  salaryPeriod?: SalaryPeriod;
  hasSeasonalSalaries?: boolean;
  seasonalSalaries?: SeasonalSalaryEntry[];
  minutesClauseEnabled?: boolean;
  minutesThresholdPct?: MinutesClausePct;
  minutesCheckpoint?: LeaveCheckpoint;
  syncMinutesWithTracker?: boolean;
  benefits?: TrainingAgreementBenefits;
  releaseToBiggerClubsEnabled?: boolean;
  releaseClubs?: ReleaseClubClause[];
  ifaRegulationNote?: string;
  customNotes?: string;
  updatedAt?: string;
}

export interface TrackedPlayer {
  id: string;
  name: string;
  photoUrl?: string;
  gender: PlayerGender;
  category: TrackerCategory;
  age: number;
  clubName: string;
  league?: string;
  position: PlayerPosition | string;
  jerseyNumber?: number;
  // Match & Play Time tracking
  matchesEligible: number; // Games the team played / player was eligible for
  matchesPlayed: number;   // Games player actually made an appearance in
  minutesPlayed: number;   // Total actual minutes played
  // Output Stats
  goals: number;
  assists: number;
  goalInvolvementTarget?: number; // Target for Goal Involvements (Goals + Assists)
  // Live Training Agreement Minutes Clause sync
  linkedPlayerId?: string;
  linkedRosterType?: 'female' | 'male';
  minMinutesClausePct?: number;
  minutesCheckpoint?: string;
  notes?: string;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  photoUrl: string;
  age: number;
  birthDate: string; // YYYY-MM-DD
  nationality: string;
  countryCode: string; // ISO 2-letter
  clubName: string;
  league: string;
  position: PlayerPosition;
  secondaryPosition?: string;
  jerseyNumber: number;
  dominantFoot: 'Right' | 'Left' | 'Both';
  youthCategory?: YouthCategory;
  contractStartDate: string; // YYYY-MM-DD
  contractExpiryDate: string; // YYYY-MM-DD
  joinedCurrentClubDate?: string; // YYYY-MM-DD or YYYY-MM
  status: PlayerStatus;
  marketValue: string; // e.g. "€450,000"
  agencyFeePct: number; // e.g. 10%
  representationType: 'Exclusive' | 'Co-representation' | 'Commercial Only';
  contactEmail?: string;
  contactPhone?: string;
  parentName?: string;
  assignedAgent?: string;
  notes?: string;
  videoHighlightsUrl?: string;
  goals?: number;
  assists?: number;
  goalInvolvementTarget?: number;
  trainingAgreement?: TrainingAgreementData;
  createdAt: string;
}

export type ProspectScope = 'Local' | 'International';

export type TalkStage = 
  | 'Initial Contact'
  | 'Scouting & Video'
  | 'Meeting Scheduled'
  | 'Offer Proposed'
  | 'Contract Drafting'
  | 'Signed'
  | 'Declined';

export interface ConversationLog {
  id: string;
  date: string;
  channel: 'Phone' | 'In-Person' | 'Video Call' | 'WhatsApp' | 'Club Meeting';
  summary: string;
  nextAction: string;
  loggedBy: string;
}

export interface ScoutingReport {
  strengths: string[];
  areasToImprove: string[];
  tacticalFit: string;
  dominantFoot: 'Right' | 'Left' | 'Both';
  heightCm: number;
  internationalCaps: number;
  estimatedWageWeekly: string;
}

export interface TalkProspect {
  id: string;
  name: string;
  gender?: PlayerGender;
  photoUrl: string;
  age: number;
  birthDate: string;
  nationality: string;
  countryCode: string;
  currentClub: string;
  league: string;
  position: PlayerPosition;
  youthCategory?: YouthCategory;
  scope: ProspectScope;
  talkStage: TalkStage;
  priority: 'High' | 'Medium' | 'Low';
  assignedAgent: string;
  videoUrl: string;
  videoTitle: string;
  videoDescription?: string;
  targetSalaryAmount?: number;
  targetSalaryCurrency?: Currency;
  targetSalaryPeriod?: SalaryPeriod;
  scoutingReport: ScoutingReport;
  conversationHistory: ConversationLog[];
  generalNotes: string;
  createdAt: string;
}

export type TargetMarketOption =
  | 'Israel - Premier League'
  | 'Israel - National League'
  | 'Europe';

export type ForeignNegotiationStatus =
  | 'Initial Contact'
  | 'In Talks to Sign'
  | 'Video/Data Review'
  | 'Representation Mandate Sent'
  | 'Signed with Agency'
  | 'Offered to Clubs';

export type ClubOfferStatus = 'Sent' | 'Reviewing' | 'Interested' | 'Declined';

export interface ClubOfferEntry {
  id: string;
  clubName: string;
  status: ClubOfferStatus;
  date?: string;
  notes?: string;
}

export interface ForeignProspect {
  id: string;
  fullName: string;
  gender?: PlayerGender;
  nationalityPassport: string;
  passportCategory?: string;
  age: number;
  birthDate?: string;
  primaryPosition: PlayerPosition | string;
  secondaryPosition?: PlayerPosition | string;
  currentClub: string;
  currentLeague: string;
  targetMarkets: TargetMarketOption[];
  negotiationStatus: ForeignNegotiationStatus;
  clubsOfferedTo: ClubOfferEntry[];
  salaryExpectations?: string;
  profileLink?: string;
  agentNotes?: string;
  createdAt: string;
  updatedAt?: string;
  statusUpdatedAt?: string;
}

export interface MatchSourceLink {
  title: string;
  url: string;
}

export interface UpcomingMatchFixture {
  id: string;
  homeTeam?: string;
  awayTeam?: string;
  opponent: string;
  opponentLogoUrl?: string;
  isHome?: boolean;
  kickoffIso: string;
  competition?: string;
  venue?: string;
  sourceName?: string;
  sourceUrl?: string;
}

export interface NextMatchInfo {
  key: string; // `${rosterType}:${playerId}`
  playerId: string;
  rosterType: 'female' | 'male';
  status: 'found' | 'not_found' | 'error';
  homeTeam?: string;
  awayTeam?: string;
  opponent?: string;
  opponentLogoUrl?: string;
  isHome?: boolean;
  kickoffIso?: string;
  competition?: string;
  venue?: string;
  matchedTeamName?: string;
  teamScopeNote?: string;
  sourceName?: string;
  sourceUrl?: string;
  sources?: MatchSourceLink[];
  upcomingMatches7d?: UpcomingMatchFixture[];
  lookupLinks: { label: string; url: string }[];
  fetchedAt: string;
  errorMessage?: string;
}

export type TeamUserRole = 'regular' | 'manager' | 'viewer';

export interface WorkspacePermissions {
  isOwner: boolean;
  canViewPlayers: boolean;
  canCreatePlayers: boolean;
  canEditPlayers: boolean;
  canDeletePlayers: boolean;
  canAccessScouting: boolean;
  canEditTracker: boolean;
}

export interface TeamMemberRule {
  uid: string;
  displayName: string;
  email?: string;
  role: TeamUserRole;
  active: boolean;
  canViewPlayers: boolean;
  canCreatePlayers: boolean;
  canEditPlayers: boolean;
  canDeletePlayers: boolean;
  canAccessScouting: boolean;
  canEditTracker: boolean;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export const AGENCY_OWNER_EMAIL = 'roy090384@gmail.com';
export const DEFAULT_APPROVED_TEAM_UID = 'SfddR4t71dWVcERYY1LCWVcWcTF3';

export function buildTeamMemberPreset(
  uid: string,
  ownerUid: string,
  role: TeamUserRole,
  displayName = 'Regular User',
  email = ''
): TeamMemberRule {
  const now = new Date().toISOString();
  if (role === 'manager') {
    return {
      uid,
      displayName,
      email,
      role,
      active: true,
      canViewPlayers: true,
      canCreatePlayers: true,
      canEditPlayers: true,
      canDeletePlayers: false,
      canAccessScouting: true,
      canEditTracker: true,
      userId: ownerUid,
      createdAt: now,
      updatedAt: now,
    };
  }
  if (role === 'viewer') {
    return {
      uid,
      displayName,
      email,
      role,
      active: true,
      canViewPlayers: true,
      canCreatePlayers: false,
      canEditPlayers: false,
      canDeletePlayers: false,
      canAccessScouting: false,
      canEditTracker: false,
      userId: ownerUid,
      createdAt: now,
      updatedAt: now,
    };
  }
  // 'regular' — watch/view & create players
  return {
    uid,
    displayName,
    email,
    role: 'regular',
    active: true,
    canViewPlayers: true,
    canCreatePlayers: true,
    canEditPlayers: false,
    canDeletePlayers: false,
    canAccessScouting: false,
    canEditTracker: false,
    userId: ownerUid,
    createdAt: now,
    updatedAt: now,
  };
}

export type SupportedYouthMatchTier = 'U14' | 'U15' | 'U16' | 'U17';

export interface YouthMatchParticipant {
  playerId: string;
  playerName: string;
  photoUrl?: string;
  position?: string;
  clubName: string;
  youthCategory: SupportedYouthMatchTier;
  side: 'home' | 'away';
}

export interface YouthMatchTimelineItem {
  id: string;
  tier: SupportedYouthMatchTier;
  competitionType?: 'league' | 'cup';
  ageGroupHe: string;
  leagueName: string;
  leagueUrl: string;
  round?: number;
  roundBoxName?: string;
  dateTime: string;
  hasTime: boolean;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  venue?: string;
  agencySides: ('home' | 'away')[];
  players: YouthMatchParticipant[];
}

export interface YouthPlayerCoverage {
  playerId: string;
  playerName: string;
  clubName: string;
  tier: SupportedYouthMatchTier;
  matchedTeamNames: string[];
  upcomingMatchCount: number;
  reason?: 'no_club' | 'no_team_match' | 'no_fixtures_7d';
}

export interface YouthMatchesApiResponse {
  matches: YouthMatchTimelineItem[];
  coverage: YouthPlayerCoverage[];
  scannedLeaguesCount: number;
  relevantClubsCount: number;
  daysAhead: number;
  fetchedAt: string;
}

