import { create } from 'zustand';
import { GatewayClient } from './client';
import type {
  Session,
  ChatMessage,
  ChatEventPayload,
  AgentEventPayload,
  PresenceEventPayload,
  CronJob,
  CronStatus,
  CronRunEntry,
  AgentFile,
  Tool,
  Skill,
  PresenceEntry,
  ChannelStatus,
  NodeInfo,
  ModelInfo,
  EventFrame,
} from './types';

// ─── Store State ────────────────────────────────────────────────────────────

export interface GatewayState {
  // Connection
  wsUrl: string;
  token: string;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  error: string | null;
  client: GatewayClient | null;

  // Sessions
  sessions: Session[];
  activeSessionKey: string;

  // Chat (per session)
  chatMessages: Map<string, ChatMessage[]>;
  chatStreaming: boolean;
  chatStreamText: string;

  // Cron
  cronJobs: CronJob[];
  cronStatus: CronStatus | null;
  cronRuns: CronRunEntry[];

  // Agent info
  agentFiles: AgentFile[];
  toolsCatalog: Tool[];
  skills: Skill[];

  // Nodes & models
  nodes: NodeInfo[];
  models: ModelInfo[];

  // Presence & status
  presence: PresenceEntry[];
  channels: ChannelStatus[];

  // Usage
  sessionUsage: Record<string, unknown> | null;
  costBreakdown: Record<string, unknown> | null;

  // Exec approvals
  execApprovals: Record<string, unknown>[];

  // Overview
  overview: Record<string, unknown> | null;

  // Logs
  logs: string[];

  // Actions
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (text: string) => Promise<void>;
  switchSession: (key: string) => void;
  loadHistory: (sessionKey: string) => Promise<void>;
  renameSession: (key: string, label: string) => Promise<void>;
  resetSession: (key: string) => Promise<void>;
  abortChat: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshCron: () => Promise<void>;
  refreshCronRuns: (params?: { scope?: string; id?: string; limit?: number; offset?: number }) => Promise<void>;
  refreshAgentFiles: () => Promise<void>;
  refreshTools: () => Promise<void>;
  refreshSkills: () => Promise<void>;
  refreshPresence: () => Promise<void>;
  refreshChannels: () => Promise<void>;
  refreshNodes: () => Promise<void>;
  refreshModels: () => Promise<void>;
  getFileContent: (path: string) => Promise<string | undefined>;

  // New actions
  refreshUsage: () => Promise<void>;
  refreshExecApprovals: () => Promise<void>;
  resolveApproval: (id: string, decision: string) => Promise<void>;
  saveAgentFile: (path: string, content: string) => Promise<void>;
  refreshOverview: () => Promise<void>;
  refreshLogs: (limit?: number) => Promise<void>;
  addCronJob: (job: Record<string, unknown>) => Promise<void>;
  updateCronJob: (jobId: string, patch: Record<string, unknown>) => Promise<void>;
  removeCronJob: (jobId: string) => Promise<void>;
  runCronJob: (jobId: string) => Promise<void>;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useGatewayStore = create<GatewayState>((set, get) => {
  // Event wiring helper
  function wireEvents(client: GatewayClient): void {
    // Connection status
    client.on('_status', (frame) => {
      const status = (frame as unknown as { status: string }).status;
      if (status === 'connecting') {
        set({ connectionStatus: 'connecting', error: null });
      } else if (status === 'connected') {
        set({ connectionStatus: 'connected', error: null });
        // Auto-load sessions on connect
        get().refreshSessions();
        // Refresh overview for accurate capacity counts
        get().refreshOverview();
      } else if (status === 'disconnected') {
        set({ connectionStatus: 'disconnected' });
      }
    });

    // Chat events
    client.on('chat', (frame: EventFrame) => {
      const p = frame.payload as unknown as ChatEventPayload;
      const sessionKey = p.sessionKey ?? get().activeSessionKey;

      if (p.streaming && !p.finished) {
        // Streaming in progress
        set({
          chatStreaming: true,
          chatStreamText: p.text ?? get().chatStreamText,
        });
      } else if (p.finished) {
        // Stream finished — commit message
        const msgs = new Map(get().chatMessages);
        const sessionMsgs = [...(msgs.get(sessionKey) ?? [])];
        const msg: ChatMessage = {
          id: p.messageId ?? `msg-${Date.now()}`,
          role: (p.role as ChatMessage['role']) ?? 'assistant',
          text: p.text ?? get().chatStreamText,
          segments: p.segments,
          timestamp: new Date().toISOString(),
          sessionKey,
          model: p.model,
          tokenUsage: p.tokenUsage,
        };
        sessionMsgs.push(msg);
        msgs.set(sessionKey, sessionMsgs);
        set({
          chatMessages: msgs,
          chatStreaming: false,
          chatStreamText: '',
        });
      }
    });

    // Agent events
    client.on('agent', (frame: EventFrame) => {
      const p = frame.payload as unknown as AgentEventPayload;
      if (p.status === 'started') {
        set({ chatStreaming: true, chatStreamText: '' });
      } else if (p.status === 'finished' || p.status === 'error') {
        set({ chatStreaming: false });
      }
    });

    // Presence events
    client.on('presence', (frame: EventFrame) => {
      const p = frame.payload as unknown as PresenceEventPayload;
      const current = get().presence;
      if (p.action === 'connected') {
        const entry: PresenceEntry = {
          clientId: p.clientId,
          role: p.role,
          connectedAt: new Date().toISOString(),
        };
        set({ presence: [...current, entry] });
      } else if (p.action === 'disconnected') {
        set({ presence: current.filter((e) => e.clientId !== p.clientId) });
      }
    });

    // Cron events
    client.on('cron.run.finished', () => {
      get().refreshCron();
    });

    // Exec approval events
    client.on('exec.approval.requested', (frame: EventFrame) => {
      const p = frame.payload as Record<string, unknown>;
      set({ execApprovals: [...get().execApprovals, p] });
    });
  }

  return {
    // Initial state
    wsUrl: '',
    token: '',
    connectionStatus: 'disconnected',
    error: null,
    client: null,
    sessions: [],
    activeSessionKey: '',
    chatMessages: new Map(),
    chatStreaming: false,
    chatStreamText: '',
    cronJobs: [],
    cronStatus: null,
    cronRuns: [],
    agentFiles: [],
    toolsCatalog: [],
    skills: [],
    nodes: [],
    models: [],
    presence: [],
    channels: [],
    sessionUsage: null,
    costBreakdown: null,
    execApprovals: [],
    overview: null,
    logs: [],

    // ── Actions ─────────────────────────────────────────────────────────

    connect: async (url: string, token: string) => {
      const existing = get().client;
      if (existing) existing.disconnect();

      const client = new GatewayClient({
        wsUrl: url,
        token,
        reconnect: true,
      });

      set({ wsUrl: url, token, client, connectionStatus: 'connecting', error: null });
      wireEvents(client);

      try {
        await client.connect();
      } catch (err) {
        set({ error: (err as Error).message, connectionStatus: 'disconnected' });
        throw err;
      }
    },

    disconnect: () => {
      const client = get().client;
      if (client) client.disconnect();
      set({
        client: null,
        connectionStatus: 'disconnected',
        error: null,
      });
    },

    sendMessage: async (text: string) => {
      const { client, activeSessionKey } = get();
      if (!client) throw new Error('Not connected');

      // Add user message immediately
      const msgs = new Map(get().chatMessages);
      const sessionMsgs = [...(msgs.get(activeSessionKey) ?? [])];
      sessionMsgs.push({
        id: `user-${Date.now()}`,
        role: 'user',
        text,
        timestamp: new Date().toISOString(),
        sessionKey: activeSessionKey,
      });
      msgs.set(activeSessionKey, sessionMsgs);
      set({ chatMessages: msgs, chatStreaming: true, chatStreamText: '' });

      await client.chatSend({
        sessionKey: activeSessionKey,
        message: text,
      });
    },

    switchSession: (key: string) => {
      set({ activeSessionKey: key });
      // Load history if we don't have it
      const msgs = get().chatMessages;
      if (!msgs.has(key)) {
        get().loadHistory(key);
      }
    },

    loadHistory: async (sessionKey: string) => {
      const client = get().client;
      if (!client) return;

      const result = await client.chatHistory({ sessionKey, limit: 100 });
      const messages = ((result as Record<string, unknown>)?.messages ?? []) as ChatMessage[];
      const msgs = new Map(get().chatMessages);
      msgs.set(sessionKey, messages);
      set({ chatMessages: msgs });
    },

    renameSession: async (key: string, label: string) => {
      const client = get().client;
      if (!client) return;
      await client.sessionsPatch({ sessionKey: key, label });
      // Refresh sessions to pick up the change
      await get().refreshSessions();
    },

    resetSession: async (key: string) => {
      const client = get().client;
      if (!client) return;
      await client.sessionsReset({ sessionKey: key });
      // Clear local messages
      const msgs = new Map(get().chatMessages);
      msgs.delete(key);
      set({ chatMessages: msgs });
    },

    abortChat: async () => {
      const client = get().client;
      if (!client) return;
      await client.chatAbort();
      set({ chatStreaming: false, chatStreamText: '' });
    },

    refreshSessions: async () => {
      const client = get().client;
      if (!client) return;
      const result = await client.sessionsList();
      const sessions = ((result as Record<string, unknown>)?.sessions ?? []) as Session[];
      set({ sessions });
      // If no active session and sessions exist, pick the first
      if (!get().activeSessionKey && sessions.length > 0) {
        set({ activeSessionKey: sessions[0].key });
      }
    },

    refreshCron: async () => {
      const client = get().client;
      if (!client) return;
      const [jobsResult, statusResult] = await Promise.all([
        client.cronList(),
        client.cronStatus(),
      ]);
      set({
        cronJobs: ((jobsResult as Record<string, unknown>)?.jobs ?? []) as CronJob[],
        cronStatus: (statusResult as unknown as CronStatus) ?? null,
      });
    },

    refreshCronRuns: async (params = {}) => {
      const client = get().client;
      if (!client) return;
      const result = await client.cronRuns(params);
      set({
        cronRuns: ((result as Record<string, unknown>)?.runs ?? []) as CronRunEntry[],
      });
    },

    refreshAgentFiles: async () => {
      const client = get().client;
      if (!client) return;
      const result = await client.agentFilesList();
      set({
        agentFiles: ((result as Record<string, unknown>)?.files ?? []) as AgentFile[],
      });
    },

    refreshTools: async () => {
      const client = get().client;
      if (!client) return;
      const result = await client.toolsCatalog();
      set({
        toolsCatalog: ((result as Record<string, unknown>)?.tools ?? []) as Tool[],
      });
    },

    refreshSkills: async () => {
      const client = get().client;
      if (!client) return;
      const result = await client.skillsStatus();
      set({
        skills: ((result as Record<string, unknown>)?.skills ?? []) as Skill[],
      });
    },

    refreshPresence: async () => {
      const client = get().client;
      if (!client) return;
      const result = await client.systemPresence();
      set({
        presence: ((result as Record<string, unknown>)?.clients ?? []) as PresenceEntry[],
      });
    },

    refreshChannels: async () => {
      const client = get().client;
      if (!client) return;
      const result = await client.channelsStatus();
      set({
        channels: ((result as Record<string, unknown>)?.channels ?? []) as ChannelStatus[],
      });
    },

    refreshNodes: async () => {
      const client = get().client;
      if (!client) return;
      const result = await client.nodeList();
      set({
        nodes: ((result as Record<string, unknown>)?.nodes ?? []) as NodeInfo[],
      });
    },

    refreshModels: async () => {
      const client = get().client;
      if (!client) return;
      const result = await client.modelsList();
      set({
        models: ((result as Record<string, unknown>)?.models ?? []) as ModelInfo[],
      });
    },

    getFileContent: async (path: string) => {
      const client = get().client;
      if (!client) return undefined;
      const result = await client.agentFilesGet({ path });
      return (result as Record<string, unknown>)?.content as string | undefined;
    },

    refreshUsage: async () => {
      const client = get().client;
      if (!client) return;
      try {
        const [usageResult, costResult] = await Promise.all([
          client.sessionsUsage(),
          client.usageCost(),
        ]);
        set({
          sessionUsage: (usageResult as Record<string, unknown>) ?? null,
          costBreakdown: (costResult as Record<string, unknown>) ?? null,
        });
      } catch {
        // Graceful — leave current state
      }
    },

    refreshExecApprovals: async () => {
      const client = get().client;
      if (!client) return;
      try {
        const result = await client.getExecApprovals();
        set({
          execApprovals: ((result as Record<string, unknown>)?.approvals ?? []) as Record<string, unknown>[],
        });
      } catch {
        // Graceful
      }
    },

    resolveApproval: async (id: string, decision: string) => {
      const client = get().client;
      if (!client) return;
      try {
        await client.resolveExecApproval(id, decision as 'allow-once' | 'allow-always' | 'deny');
        // Remove from local state
        set({ execApprovals: get().execApprovals.filter((a) => a.id !== id) });
      } catch {
        // Graceful
      }
    },

    saveAgentFile: async (path: string, content: string) => {
      const client = get().client;
      if (!client) return;
      await client.setAgentFile({ path, content });
    },

    refreshOverview: async () => {
      const client = get().client;
      if (!client) return;
      try {
        const result = await client.overviewSnapshot();
        set({ overview: (result as Record<string, unknown>) ?? null });
      } catch {
        // Graceful
      }
    },

    refreshLogs: async (limit = 30) => {
      const client = get().client;
      if (!client) return;
      try {
        const result = await client.tailLogs({ limit });
        const lines = ((result as Record<string, unknown>)?.lines ?? []) as string[];
        set({ logs: lines });
      } catch {
        // Graceful
      }
    },

    addCronJob: async (job: Record<string, unknown>) => {
      const client = get().client;
      if (!client) return;
      await client.addCronJob({ job });
      await get().refreshCron();
    },

    updateCronJob: async (jobId: string, patch: Record<string, unknown>) => {
      const client = get().client;
      if (!client) return;
      await client.updateCronJob({ jobId, patch });
      await get().refreshCron();
    },

    removeCronJob: async (jobId: string) => {
      const client = get().client;
      if (!client) return;
      await client.removeCronJob({ jobId });
      await get().refreshCron();
    },

    runCronJob: async (jobId: string) => {
      const client = get().client;
      if (!client) return;
      await client.runCronJob({ jobId });
    },
  };
});
