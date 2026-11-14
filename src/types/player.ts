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

export type YouthCategory = 'Senior' | 'U19' | 'U17' | 'U15';

export type TrackerCategory = 'U15' | 'U16' | 'U17' | 'U19' | 'Womans';
export type PlayerGender = 'Female' | 'Male';

export type NavigationTab = 'dashboard' | 'roster' | 'in-talk' | 'alerts' | 'tracker' | 'compensation';

export type Currency = 'EUR' | 'USD' | 'ILS';
export type SalaryPeriod = 'Weekly' | 'Monthly' | 'Annual';

export type Language = 'en' | 'he';

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
  status: PlayerStatus;
  marketValue: string; // e.g. "€450,000"
  agencyFeePct: number; // e.g. 10%
  representationType: 'Exclusive' | 'Co-representation' | 'Commercial Only';
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  videoHighlightsUrl?: string;
  goals?: number;
  assists?: number;
  goalInvolvementTarget?: number;
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
