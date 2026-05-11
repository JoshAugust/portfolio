export enum ContactRole {
  PEER = 'Peer',
  MENTOR = 'Mentor',
  SPONSOR = 'Sponsor',
  PROSPECT = 'Prospect',
}

export interface WorkHistory {
  title: string;
  company: string;
  duration: string;
  location: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  type: ContactRole;
  influenceScore: number; // 0-100
  careerFit: number; // 0-100, Compatibility with user goals
  notes: string;
  lastContactDate: string; // ISO Date
  avatarSeed: number;
  avatarImage?: string; // Base64 string of AI generated image
  connectionStrength: number; // 0-100
  suggestedPath?: string[]; // e.g., ["You", "Alice (Mutual)", "Target"]
  connectionDegree?: '1st' | '2nd' | '3rd';
  workHistory?: WorkHistory[];
  mutualConnectionsCount?: number;
  linkedinUrl?: string;

  // Discovery Fields
  discoveryScore: number; // 0-100
  intelligence?: {
    summary: string;
    talkingPoints: string[];
    bioSnippet?: string;
    lastScouted: number;
    issues?: string[];  // Diagnostic log of research issues
  };
  needsResearch?: boolean; // Flag for low-quality initial research (discoveryScore < 30)
  manualResearchRequested?: boolean; // User clicked the re-research button
}

export type PriorityLevel = 'High' | 'Mid' | 'Low';

export interface WeightedNode {
  id: string;
  label: string;
  priority: PriorityLevel;
  parentId?: string; // For visual connections
}

export interface UserProfile {
  name: string;
  title: string;
  company: string;
  industry: string;
  linkedinUrl?: string;

  // AI-Driven Profile
  interests: WeightedNode[];   // Replaces 'topics'
  targetRoles: WeightedNode[]; // Replaces 'goal' text

  // Derived/Legacy (Computed for compatibility)
  goal: string;
  challenge?: string; // Optional/Deprecated
  topics?: string[];  // Deprecated, kept for backward compat if needed
}

export enum FeedItemType {
  SPONSOR_POTENTIAL = 'SPONSOR_POTENTIAL',
  WARM_PATH = 'WARM_PATH',
  EVENT_SCOUT = 'EVENT_SCOUT',
  GRATITUDE = 'GRATITUDE',
  LOOP_BACK = 'LOOP_BACK',
}

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  description: string;
  relatedContactId?: string;
  actionLabel: string;
  isCompleted: boolean;
  rationale?: string; // Why this matters
  tactics?: string; // What to say/do
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AngelState {
  id: 'strategy' | 'network' | 'events';
  name: string;
  status: 'idle' | 'thinking' | 'working' | 'success' | 'paused';
  currentTask: string;
}