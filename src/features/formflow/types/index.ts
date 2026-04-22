// ═══════════════════════════════════════════════════════════════════════════
// FIELD CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'country'
  | 'date'
  | 'textarea'
  | 'select';

export interface FieldConfig {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  autocomplete?: string;
  required: boolean;
  aiEnabled: boolean;
  justification?: string;
  options?: SelectOption[];
  validation: ValidationConfig;
}

export interface SelectOption {
  value: string;
  label: string;
  aliases?: string[];
}

export interface ValidationConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export interface FormConfig {
  id: string;
  title: string;
  subtitle: string;
  fields: FieldConfig[];
  submitLabel: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════

export type FieldStatus =
  | 'empty'
  | 'typing'
  | 'processing'
  | 'suggestion'
  | 'accepted'
  | 'validated'
  | 'error';

export interface FieldState {
  fieldId: string;
  status: FieldStatus;
  rawValue: string;
  resolvedValue: string | null;
  displayValue: string | null;
  suggestion: AISuggestion | null;
  errorMessage: string | null;
  touchedAt: number | null;
  resolvedAt: number | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI SUGGESTION
// ═══════════════════════════════════════════════════════════════════════════

export type SuggestionType = 'correction' | 'resolution' | 'extraction' | 'confirmation';

export interface AISuggestion {
  fieldId: string;
  type: SuggestionType;
  rawInput: string;
  resolvedValue: string;
  displayText: string;
  confidence: 'high' | 'medium' | 'low';
  emoji?: string;
  chips?: SuggestionChip[];
  requiresConfirmation: boolean;
  latencyMs: number;
}

export interface SuggestionChip {
  label: string;
  value: string;
  selected: boolean;
  aiSuggested: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRE-COMPUTED RESPONSES
// ═══════════════════════════════════════════════════════════════════════════

export interface PrecomputedResponse {
  inputPattern: string | RegExp;
  response: Omit<AISuggestion, 'rawInput'>;
}

export type PrecomputedDatabase = Record<string, PrecomputedResponse[]>;

// ═══════════════════════════════════════════════════════════════════════════
// COMPARISON STATS
// ═══════════════════════════════════════════════════════════════════════════

export interface FormRunStats {
  fieldsCompleted: number;
  fieldsTotal: number;
  errorsShown: number;
  retriesTotal: number;
  startedAt: number | null;
  completedAt: number | null;
}

export interface ComparisonStats {
  traditional: FormRunStats;
  ai: FormRunStats;
}

export type StatsAction =
  | { form: 'traditional' | 'ai'; type: 'START' }
  | { form: 'traditional' | 'ai'; type: 'FIELD_COMPLETED' }
  | { form: 'traditional' | 'ai'; type: 'ERROR_SHOWN' }
  | { form: 'traditional' | 'ai'; type: 'RETRY' }
  | { form: 'traditional' | 'ai'; type: 'SUBMITTED' };

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

export interface FormFlowContextValue {
  mode: 'demo' | 'live';
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  stats: ComparisonStats;
  dispatchStat: (action: StatsAction) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COUNTRY DATA
// ═══════════════════════════════════════════════════════════════════════════

export interface CountryEntry {
  code: string;       // ISO 3166-1 alpha-2
  name: string;       // canonical English name
  flag: string;       // emoji flag
  aliases: string[];  // synonyms: "England", "Britain", "UK", etc.
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION TRACKS
// ═══════════════════════════════════════════════════════════════════════════

export interface SessionTrack {
  id: string;
  name: string;
  keywords: string[];  // for matching user interests
}
