import { useCallback, useMemo, useState } from 'react';
import { useGatewayStore } from './store';
import type { GatewayState } from './store';

// ─── Selectors (stable references) ─────────────────────────────────────────

const selectConnection = (s: GatewayState) => ({
  connectionStatus: s.connectionStatus,
  error: s.error,
  wsUrl: s.wsUrl,
});

const selectSessionsList = (s: GatewayState) => s.sessions;
const selectActiveKey = (s: GatewayState) => s.activeSessionKey;
const selectStreaming = (s: GatewayState) => s.chatStreaming;
const selectStreamText = (s: GatewayState) => s.chatStreamText;
const selectChatMessages = (s: GatewayState) => s.chatMessages;

const selectCronJobs = (s: GatewayState) => s.cronJobs;
const selectCronStatus = (s: GatewayState) => s.cronStatus;
const selectCronRuns = (s: GatewayState) => s.cronRuns;

const selectAgentFiles = (s: GatewayState) => s.agentFiles;
const selectToolsCatalog = (s: GatewayState) => s.toolsCatalog;
const selectSkills = (s: GatewayState) => s.skills;
const selectPresence = (s: GatewayState) => s.presence;
const selectChannels = (s: GatewayState) => s.channels;
const selectNodes = (s: GatewayState) => s.nodes;
const selectModels = (s: GatewayState) => s.models;

// ─── useGateway ─────────────────────────────────────────────────────────────

export function useGateway() {
  const { connectionStatus, error, wsUrl } = useGatewayStore(selectConnection);
  const connect = useGatewayStore((s) => s.connect);
  const disconnect = useGatewayStore((s) => s.disconnect);

  return {
    connectionStatus,
    error,
    wsUrl,
    connect,
    disconnect,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
  };
}

// ─── useSessions ────────────────────────────────────────────────────────────

export function useSessions() {
  const sessions = useGatewayStore(selectSessionsList);
  const activeSessionKey = useGatewayStore(selectActiveKey);
  const switchSession = useGatewayStore((s) => s.switchSession);
  const renameSession = useGatewayStore((s) => s.renameSession);
  const resetSession = useGatewayStore((s) => s.resetSession);
  const refreshSessions = useGatewayStore((s) => s.refreshSessions);

  const activeSession = useMemo(
    () => sessions.find((s) => s.key === activeSessionKey) ?? null,
    [sessions, activeSessionKey],
  );

  return {
    sessions,
    activeSessionKey,
    activeSession,
    switchSession,
    renameSession,
    resetSession,
    refreshSessions,
  };
}

// ─── useChat ────────────────────────────────────────────────────────────────

export function useChat(sessionKey?: string) {
  const activeKey = useGatewayStore(selectActiveKey);
  const key = sessionKey ?? activeKey;

  const allMessages = useGatewayStore(selectChatMessages);
  const streaming = useGatewayStore(selectStreaming);
  const streamText = useGatewayStore(selectStreamText);
  const sendMessage = useGatewayStore((s) => s.sendMessage);
  const abortChat = useGatewayStore((s) => s.abortChat);
  const loadHistory = useGatewayStore((s) => s.loadHistory);

  const messages = useMemo(() => allMessages.get(key) ?? [], [allMessages, key]);

  const send = useCallback(
    (text: string) => sendMessage(text),
    [sendMessage],
  );

  const loadMore = useCallback(
    () => loadHistory(key),
    [loadHistory, key],
  );

  return {
    messages,
    streaming,
    streamText,
    send,
    abort: abortChat,
    loadHistory: loadMore,
    sessionKey: key,
  };
}

// ─── useCron ────────────────────────────────────────────────────────────────

export function useCron() {
  const jobs = useGatewayStore(selectCronJobs);
  const status = useGatewayStore(selectCronStatus);
  const runs = useGatewayStore(selectCronRuns);
  const refreshCron = useGatewayStore((s) => s.refreshCron);
  const refreshCronRuns = useGatewayStore((s) => s.refreshCronRuns);

  return { jobs, status, runs, refreshCron, refreshCronRuns };
}

// ─── useAgentFiles ──────────────────────────────────────────────────────────

export function useAgentFiles() {
  const files = useGatewayStore(selectAgentFiles);
  const refreshAgentFiles = useGatewayStore((s) => s.refreshAgentFiles);
  const getFileContent = useGatewayStore((s) => s.getFileContent);

  return { files, refreshAgentFiles, getFileContent };
}

// ─── useTools ───────────────────────────────────────────────────────────────

export function useTools() {
  const tools = useGatewayStore(selectToolsCatalog);
  const refreshTools = useGatewayStore((s) => s.refreshTools);

  return { tools, refreshTools };
}

// ─── useSkills ──────────────────────────────────────────────────────────────

export function useSkills() {
  const skills = useGatewayStore(selectSkills);
  const refreshSkills = useGatewayStore((s) => s.refreshSkills);

  return { skills, refreshSkills };
}

// ─── usePresence ────────────────────────────────────────────────────────────

export function usePresence() {
  const presence = useGatewayStore(selectPresence);
  const refreshPresence = useGatewayStore((s) => s.refreshPresence);

  return { presence, refreshPresence };
}

// ─── useChannels ────────────────────────────────────────────────────────────

export function useChannels() {
  const channels = useGatewayStore(selectChannels);
  const refreshChannels = useGatewayStore((s) => s.refreshChannels);

  return { channels, refreshChannels };
}

// ─── useNodes ───────────────────────────────────────────────────────────────

export function useNodes() {
  const nodes = useGatewayStore(selectNodes);
  const refreshNodes = useGatewayStore((s) => s.refreshNodes);

  return { nodes, refreshNodes };
}

// ─── useModels ──────────────────────────────────────────────────────────────

export function useModels() {
  const models = useGatewayStore(selectModels);
  const refreshModels = useGatewayStore((s) => s.refreshModels);

  return { models, refreshModels };
}

// ─── useUsage ───────────────────────────────────────────────────────────────

const selectSessionUsage = (s: GatewayState) => s.sessionUsage;
const selectCostBreakdown = (s: GatewayState) => s.costBreakdown;

export function useUsage() {
  const usage = useGatewayStore(selectSessionUsage);
  const cost = useGatewayStore(selectCostBreakdown);
  const refresh = useGatewayStore((s) => s.refreshUsage);

  return { usage, cost, refresh };
}

// ─── useExecApprovals ───────────────────────────────────────────────────────

const selectExecApprovals = (s: GatewayState) => s.execApprovals;

export function useExecApprovals() {
  const approvals = useGatewayStore(selectExecApprovals);
  const resolve = useGatewayStore((s) => s.resolveApproval);
  const refresh = useGatewayStore((s) => s.refreshExecApprovals);

  return { approvals, resolve, refresh };
}

// ─── useOverview ────────────────────────────────────────────────────────────

const selectOverview = (s: GatewayState) => s.overview;

export function useOverview() {
  const overview = useGatewayStore(selectOverview);
  const refresh = useGatewayStore((s) => s.refreshOverview);

  return { overview, refresh };
}

// ─── useLogs ────────────────────────────────────────────────────────────────

const selectLogs = (s: GatewayState) => s.logs;

export function useLogs() {
  const logs = useGatewayStore(selectLogs);
  const refresh = useGatewayStore((s) => s.refreshLogs);

  return { logs, refresh };
}

// ─── useConfig ──────────────────────────────────────────────────────────────

export function useConfig() {
  const client = useGatewayStore((s) => s.client);

  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const [cfgResult, schemaResult] = await Promise.all([
        client.configGet().catch(() => null),
        client.configSchema().catch(() => null),
      ]);
      if (cfgResult) setConfig(cfgResult as Record<string, unknown>);
      if (schemaResult) setSchema(schemaResult as Record<string, unknown>);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const save = useCallback(async (newConfig: unknown) => {
    if (!client) throw new Error('Not connected');
    await client.configApply({ config: newConfig });
  }, [client]);

  return { config, schema, loading, error, refresh, save };
}

// ─── useSearch ──────────────────────────────────────────────────────────────

export function useSearch() {
  const client = useGatewayStore((s) => s.client);
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!client || !query.trim()) {
      setResults([]);
      return [];
    }
    setLoading(true);
    try {
      const result = await client.searchQuery({ query, limit: 20 });
      const items = ((result as Record<string, unknown>)?.results ?? []) as Record<string, unknown>[];
      setResults(items);
      return items;
    } catch {
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [client]);

  return { search, results, loading };
}

// ─── useCapacity ────────────────────────────────────────────────────────────

export function useCapacity() {
  const presence = useGatewayStore(selectPresence);
  const sessions = useGatewayStore(selectSessionsList);

  return useMemo(() => {
    // Estimate capacity from presence / session data
    const mainRuns = sessions.filter((s) => !s.key.includes('subagent')).length;
    const subAgents = sessions.filter((s) => s.key.includes('subagent')).length;
    const connectedClients = presence.length;

    return {
      mainRuns: { current: mainRuns, max: 4 },
      subAgents: { current: subAgents, max: 50 },
      connectedClients,
    };
  }, [presence, sessions]);
}
