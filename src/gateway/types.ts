// ─── Protocol Frame Types ───────────────────────────────────────────────────

export interface RequestFrame {
  type: 'req';
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export interface ResponseFrame {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: { code?: string; message?: string };
}

export interface EventFrame {
  type: 'event';
  event: string;
  payload: Record<string, unknown>;
}

export type Frame = RequestFrame | ResponseFrame | EventFrame;

// ─── Domain Types ───────────────────────────────────────────────────────────

export interface Session {
  key: string;
  label?: string;
  channel?: string;
  agentId?: string;
  createdAt?: string;
  updatedAt?: string;
  lastMessage?: string;
  messageCount?: number;
}

export interface ChatSegment {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'image' | 'file';
  text?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: unknown;
  thinking?: string;
  url?: string;
  filename?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  segments?: ChatSegment[];
  timestamp?: string;
  sessionKey?: string;
  streaming?: boolean;
  model?: string;
  tokenUsage?: { input?: number; output?: number };
}

export interface CronJob {
  id: string;
  name?: string;
  label?: string;
  schedule: unknown; // { kind: 'cron'|'every'|'at', expr?: string, everyMs?: number, tz?: string }
  enabled: boolean;
  task?: string;
  lastRun?: string;
  nextRun?: string;
  state?: { lastRunAtMs?: number; nextRunAtMs?: number; lastRunStatus?: string };
}

export interface CronStatus {
  enabled: boolean;
}

export interface CronRunEntry {
  id: string;
  jobId?: string;
  scope?: string;
  startedAt?: string;
  finishedAt?: string;
  status?: string;
  result?: string;
  error?: string;
}

export interface AgentFile {
  path: string;
  name: string;
  size?: number;
  modified?: string;
  type?: 'file' | 'directory';
}

export interface Tool {
  name: string;
  description?: string;
  category?: string;
  enabled?: boolean;
}

export interface Skill {
  name: string;
  description?: string;
  location?: string;
  enabled?: boolean;
}

export interface PresenceEntry {
  clientId: string;
  role?: string;
  connectedAt?: string;
  sessionKey?: string;
  userAgent?: string;
}

export interface ChannelStatus {
  name: string;
  type?: string;
  connected?: boolean;
  error?: string;
}

export interface NodeInfo {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  lastSeen?: string;
}

export interface ModelInfo {
  id: string;
  name?: string;
  provider?: string;
  maxTokens?: number;
}

// ─── RPC Method Params ──────────────────────────────────────────────────────

export interface ChatSendParams {
  sessionKey: string;
  message: string;
  idempotencyKey?: string;
  deliver?: string;
}

export interface ChatHistoryParams {
  sessionKey: string;
  limit?: number;
}

export interface ChatAbortParams {
  sessionKey?: string;
}

export interface SessionsResetParams {
  sessionKey: string;
}

export interface SessionsPatchParams {
  sessionKey: string;
  label?: string;
}

export interface CronRunsParams {
  scope?: string;
  id?: string;
  limit?: number;
  offset?: number;
}

export interface SessionsDeleteParams {
  sessionKey: string;
}

export interface AgentFilesGetParams {
  path: string;
}

// ─── Event Payloads ─────────────────────────────────────────────────────────

export interface ChatEventPayload {
  sessionKey?: string;
  messageId?: string;
  role?: string;
  text?: string;
  segments?: ChatSegment[];
  streaming?: boolean;
  finished?: boolean;
  model?: string;
  tokenUsage?: { input?: number; output?: number };
}

export interface AgentEventPayload {
  sessionKey?: string;
  status?: 'started' | 'finished' | 'error';
  agentId?: string;
  error?: string;
}

export interface ExecApprovalPayload {
  id: string;
  command?: string;
  sessionKey?: string;
}

export interface PresenceEventPayload {
  clientId: string;
  action: 'connected' | 'disconnected';
  role?: string;
}

// ─── Connection Config ──────────────────────────────────────────────────────

export interface GatewayConfig {
  wsUrl: string;
  token: string;
  role?: string;
  scopes?: string[];
  reconnect?: boolean;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
}
