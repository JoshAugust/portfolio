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

  // Active runs tracking (from agent events)
  activeRunKeys: Set<string>;

  // Snapshot from hello-ok
  gatewaySnapshot: Record<string, unknown> | null;

  // Left panel tab
  activePanelTab: 'chats' | 'crons' | 'daemons' | 'subagents';

  // Chat (per session)
  chatMessages: Map<string, ChatMessage[]>;
  chatStreaming: boolean;
  chatStreamText: string;

  // Cron
  cronJobs: CronJob[];
  cronStatus: CronStatus | null;
  cronRuns: CronRunEntry[];
  cronRunHistory: Map<string, CronRunEntry[]>;

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
  deleteSession: (key: string) => Promise<void>;
  createNewChat: () => void;
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
  refreshCronRunHistory: (jobId: string) => Promise<void>;
  setActivePanelTab: (tab: 'chats' | 'crons' | 'daemons' | 'subagents') => void;
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

      // Extract text from various possible formats
      const rawPayload = frame.payload as Record<string, unknown>;
      const eventText = p.text ?? (
        Array.isArray(rawPayload.content)
          ? (rawPayload.content as Array<Record<string, unknown>>)
              .filter((s) => s.type === 'text')
              .map((s) => (s.text as string) ?? '')
              .join('')
          : undefined
      );

      if (p.streaming && !p.finished) {
        // Streaming in progress — accumulate text
        set({
          chatStreaming: true,
          chatStreamText: eventText ?? get().chatStreamText,
        });
      } else if (p.finished || (!p.streaming && p.role)) {
        // Stream finished OR direct (non-streaming) message delivery
        const finalText = eventText ?? get().chatStreamText;
        if (!finalText && !p.segments) return; // skip empty events

        const msgs = new Map(get().chatMessages);
        const sessionMsgs = [...(msgs.get(sessionKey) ?? [])];

        // Preserve raw content array if present (for tool call rendering)
        const content = Array.isArray(rawPayload.content) ? rawPayload.content : undefined;

        const msg: ChatMessage = {
          id: p.messageId ?? `msg-${Date.now()}`,
          role: (p.role as ChatMessage['role']) ?? 'assistant',
          text: finalText ?? '',
          segments: p.segments,
          timestamp: new Date().toISOString(),
          sessionKey,
          model: p.model,
          tokenUsage: p.tokenUsage,
        };
        // Attach raw content for ChatMessage rendering
        if (content) {
          (msg as Record<string, unknown>).content = content;
        }
        sessionMsgs.push(msg);
        msgs.set(sessionKey, sessionMsgs);
        set({
          chatMessages: msgs,
          chatStreaming: false,
          chatStreamText: '',
        });
      }
    });

    // Agent events — track active runs
    client.on('agent', (frame: EventFrame) => {
      const p = frame.payload as unknown as AgentEventPayload;
      const sessionKey = p.sessionKey ?? get().activeSessionKey;
      if (p.status === 'started') {
        const keys = new Set(get().activeRunKeys);
        keys.add(sessionKey);
        set({ activeRunKeys: keys, chatStreaming: true, chatStreamText: '' });
      } else if (p.status === 'finished' || p.status === 'error') {
        const keys = new Set(get().activeRunKeys);
        keys.delete(sessionKey);
        set({ activeRunKeys: keys, chatStreaming: false });
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

    // Capture hello-ok snapshot and seed active runs
    client.on('hello-ok', (frame: EventFrame) => {
      const snapshot = (frame.payload as any)?.snapshot;
      if (snapshot) {
        const updates: Partial<GatewayState> = { gatewaySnapshot: snapshot };

        // Set activeSessionKey from sessionDefaults if not already set
        const mainSessionKey = snapshot?.sessionDefaults?.mainSessionKey;
        if (mainSessionKey && !get().activeSessionKey) {
          updates.activeSessionKey = mainSessionKey as string;
        }

        // Seed active runs from recent sessions (age < 60s = potentially running)
        try {
          const recent = snapshot?.health?.agents?.[0]?.sessions?.recent;
          if (Array.isArray(recent)) {
            const activeKeys = new Set<string>();
            for (const s of recent) {
              if (typeof s.age === 'number' && s.age < 60000 && s.key) {
                activeKeys.add(s.key);
              }
            }
            if (activeKeys.size > 0) {
              updates.activeRunKeys = activeKeys;
            }
          }
        } catch {
          // Graceful — snapshot parsing is best-effort
        }

        set(updates);
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
    activeRunKeys: new Set<string>(),
    gatewaySnapshot: null,
    activePanelTab: 'chats',
    chatMessages: new Map(),
    chatStreaming: false,
    chatStreamText: '',
    cronJobs: [],
    cronStatus: null,
    cronRuns: [],
    cronRunHistory: new Map<string, CronRunEntry[]>(),
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

    // ── Helpers ────────────────────────────────────────────────────────

    setActivePanelTab: (tab: 'chats' | 'crons' | 'daemons' | 'subagents') => {
      set({ activePanelTab: tab });
    },

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
        idempotencyKey: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });

      // Refresh sessions so new sessions (e.g., webchat) appear in the sidebar
      setTimeout(() => get().refreshSessions(), 500);
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
      if (!client || get().connectionStatus !== 'connected') return;

      try {
        const result = await client.chatHistory({ sessionKey, limit: 100 });
        const rawMessages = ((result as Record<string, unknown>)?.messages ?? []) as Record<string, unknown>[];

        // Map gateway messages to our ChatMessage format
        // Gateway format: { role, content: [{type, text}], timestamp, model, ... }
        // Our format: { id, role, text, segments, timestamp, sessionKey, model, ... }
        const messages: ChatMessage[] = rawMessages
          .filter((raw) => {
            // Only show user and assistant messages, skip toolResult etc.
            const role = raw.role as string;
            return role === 'user' || role === 'assistant';
          })
          .map((raw, idx) => {
            const content = raw.content as Array<Record<string, unknown>> | undefined;
            // Extract text from content array
            const text = Array.isArray(content)
              ? content
                  .filter((s) => s.type === 'text')
                  .map((s) => (s.text as string) ?? '')
                  .join('\n')
              : (raw.text as string) ?? '';

            const role = raw.role as ChatMessage['role'];
            return {
              id: `hist-${sessionKey}-${idx}`,
              role,
              text,
              content: content, // preserve raw content for ChatMessage rendering
              timestamp: raw.timestamp ? new Date(raw.timestamp as number).toISOString() : undefined,
              sessionKey,
              model: raw.model as string | undefined,
            } as ChatMessage;
          });

        const msgs = new Map(get().chatMessages);
        msgs.set(sessionKey, messages);
        set({ chatMessages: msgs });
      } catch {
        // Graceful — history load failure shouldn't crash
      }
    },

    renameSession: async (key: string, label: string) => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      await client.sessionsPatch({ sessionKey: key, label });
      // Refresh sessions to pick up the change
      await get().refreshSessions();
    },

    resetSession: async (key: string) => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      await client.sessionsReset({ sessionKey: key });
      // Clear local messages
      const msgs = new Map(get().chatMessages);
      msgs.delete(key);
      set({ chatMessages: msgs });
    },

    deleteSession: async (key: string) => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      try {
        await client.sessionsDelete({ sessionKey: key });
      } catch {
        // Graceful — some gateways may not support sessions.delete
      }
      // Remove from local state regardless
      const msgs = new Map(get().chatMessages);
      msgs.delete(key);
      const sessions = get().sessions.filter((s) => s.key !== key);
      const updates: Partial<GatewayState> = { chatMessages: msgs, sessions };
      // If we deleted the active session, switch to the first remaining or clear
      if (get().activeSessionKey === key) {
        updates.activeSessionKey = sessions[0]?.key ?? '';
        // Load history for the new active session
        if (updates.activeSessionKey) {
          setTimeout(() => get().loadHistory(updates.activeSessionKey as string), 0);
        }
      }
      set(updates);
    },

    createNewChat: () => {
      // Generate a new webchat session key
      const uuid = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const newKey = `webchat:${uuid}`;
      // Set as active — session will be created on the backend when first message is sent
      const msgs = new Map(get().chatMessages);
      msgs.set(newKey, []);
      set({ activeSessionKey: newKey, chatMessages: msgs });
    },

    abortChat: async () => {
      const { client, activeSessionKey } = get();
      if (!client || get().connectionStatus !== 'connected') return;
      try {
        await client.chatAbort({ sessionKey: activeSessionKey || undefined });
      } catch {
        // Graceful — abort failure shouldn't crash
      }
      set({ chatStreaming: false, chatStreamText: '' });
    },

    refreshSessions: async () => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      try {
        const result = await client.sessionsList();
        const sessions = ((result as Record<string, unknown>)?.sessions ?? []) as Session[];
        set({ sessions });
        // If no active session and sessions exist, pick the main session or first
        if (!get().activeSessionKey && sessions.length > 0) {
          const mainKey = (get().gatewaySnapshot as any)?.sessionDefaults?.mainSessionKey;
          const picked = mainKey && sessions.find(s => s.key === mainKey)
            ? mainKey
            : sessions[0].key;
          set({ activeSessionKey: picked });
        }
      } catch {
        // Graceful — sessions list failure shouldn't crash
      }
    },

    refreshCron: async () => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
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
      if (!client || get().connectionStatus !== 'connected') return;
      const result = await client.cronRuns(params);
      set({
        cronRuns: ((result as Record<string, unknown>)?.runs ?? []) as CronRunEntry[],
      });
    },

    refreshAgentFiles: async () => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      const result = await client.agentFilesList();
      set({
        agentFiles: ((result as Record<string, unknown>)?.files ?? []) as AgentFile[],
      });
    },

    refreshTools: async () => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      const result = await client.toolsCatalog();
      set({
        toolsCatalog: ((result as Record<string, unknown>)?.tools ?? []) as Tool[],
      });
    },

    refreshSkills: async () => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      const result = await client.skillsStatus();
      set({
        skills: ((result as Record<string, unknown>)?.skills ?? []) as Skill[],
      });
    },

    refreshPresence: async () => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      const result = await client.systemPresence();
      set({
        presence: ((result as Record<string, unknown>)?.clients ?? []) as PresenceEntry[],
      });
    },

    refreshChannels: async () => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      const result = await client.channelsStatus();
      set({
        channels: ((result as Record<string, unknown>)?.channels ?? []) as ChannelStatus[],
      });
    },

    refreshNodes: async () => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      const result = await client.nodeList();
      set({
        nodes: ((result as Record<string, unknown>)?.nodes ?? []) as NodeInfo[],
      });
    },

    refreshModels: async () => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      const result = await client.modelsList();
      set({
        models: ((result as Record<string, unknown>)?.models ?? []) as ModelInfo[],
      });
    },

    getFileContent: async (path: string) => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return undefined;
      const result = await client.agentFilesGet({ path });
      return (result as Record<string, unknown>)?.content as string | undefined;
    },

    refreshUsage: async () => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
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
      if (!client || get().connectionStatus !== 'connected') return;
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
      if (!client || get().connectionStatus !== 'connected') return;
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
      if (!client || get().connectionStatus !== 'connected') return;
      await client.setAgentFile({ path, content });
    },

    refreshOverview: async () => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      try {
        const result = await client.overviewSnapshot();
        set({ overview: (result as Record<string, unknown>) ?? null });
      } catch {
        // Graceful
      }
    },

    refreshLogs: async (limit = 30) => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
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
      if (!client || get().connectionStatus !== 'connected') return;
      await client.addCronJob({ job });
      await get().refreshCron();
    },

    updateCronJob: async (jobId: string, patch: Record<string, unknown>) => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      await client.updateCronJob({ jobId, patch });
      await get().refreshCron();
    },

    removeCronJob: async (jobId: string) => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      await client.removeCronJob({ jobId });
      await get().refreshCron();
    },

    runCronJob: async (jobId: string) => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      await client.runCronJob({ jobId });
    },

    refreshCronRunHistory: async (jobId: string) => {
      const client = get().client;
      if (!client || get().connectionStatus !== 'connected') return;
      try {
        const result = await client.cronRuns({ id: jobId, limit: 10 });
        const runs = ((result as Record<string, unknown>)?.runs ?? []) as CronRunEntry[];
        const history = new Map(get().cronRunHistory);
        history.set(jobId, runs);
        set({ cronRunHistory: history });
      } catch {
        // Graceful
      }
    },
  };
});
