import type {
  RequestFrame,
  ResponseFrame,
  EventFrame,
  Frame,
  GatewayConfig,
  ChatSendParams,
  ChatHistoryParams,
  ChatAbortParams,
  SessionsPatchParams,
  SessionsResetParams,
  CronRunsParams,
  AgentFilesGetParams,
} from './types';

// ─── Pending Request Tracker ────────────────────────────────────────────────

interface PendingRequest {
  resolve: (payload: Record<string, unknown> | undefined) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

type EventHandler = (event: EventFrame) => void;

// ─── Gateway Client ─────────────────────────────────────────────────────────

export class GatewayClient {
  private ws: WebSocket | null = null;
  private config: GatewayConfig;
  private requestId = 0;
  private pending = new Map<string, PendingRequest>();
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private globalHandlers = new Set<EventHandler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay: number;
  private _disposed = false;
  private _connectionResolve: (() => void) | null = null;
  private _connectionReject: ((err: Error) => void) | null = null;

  readonly REQUEST_TIMEOUT_MS = 30_000;

  constructor(config: GatewayConfig) {
    this.config = {
      role: 'operator',
      scopes: ['operator.read', 'operator.write'],
      reconnect: true,
      reconnectDelayMs: 1000,
      maxReconnectDelayMs: 30_000,
      ...config,
    };
    this.reconnectDelay = this.config.reconnectDelayMs ?? 1000;
  }

  // ── Connection ──────────────────────────────────────────────────────────

  connect(): Promise<void> {
    if (this._disposed) throw new Error('Client disposed');
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      this._connectionResolve = resolve;
      this._connectionReject = reject;
      this._connect();
    });
  }

  private _connect(): void {
    this.emit('_status', { status: 'connecting' } as unknown as EventFrame);

    const ws = new WebSocket(this.config.wsUrl);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectDelay = this.config.reconnectDelayMs ?? 1000;
    };

    ws.onmessage = (ev: MessageEvent) => {
      this._handleMessage(ev.data as string);
    };

    ws.onclose = () => {
      this.emit('_status', { status: 'disconnected' } as unknown as EventFrame);
      this._cleanup();
      if (!this._disposed && this.config.reconnect) {
        this._scheduleReconnect();
      }
    };

    ws.onerror = () => {
      this._connectionReject?.(new Error('WebSocket connection failed'));
      this._connectionReject = null;
      this._connectionResolve = null;
    };
  }

  disconnect(): void {
    this._disposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this._cleanup();
    this.emit('_status', { status: 'disconnected' } as unknown as EventFrame);
  }

  private _cleanup(): void {
    for (const [, req] of this.pending) {
      clearTimeout(req.timer);
      req.reject(new Error('Connection closed'));
    }
    this.pending.clear();
  }

  private _scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this._connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.config.maxReconnectDelayMs ?? 30_000,
    );
  }

  // ── Message Handling ────────────────────────────────────────────────────

  private _handleMessage(raw: string): void {
    let frame: Frame;
    try {
      frame = JSON.parse(raw) as Frame;
    } catch {
      return;
    }

    if (frame.type === 'event') {
      this._handleEvent(frame);
    } else if (frame.type === 'res') {
      this._handleResponse(frame);
    }
  }

  private _handleEvent(frame: EventFrame): void {
    // Handle handshake challenge
    if (frame.event === 'connect.challenge') {
      this._sendHandshake(frame.payload?.nonce as string | undefined);
      return;
    }

    // Handle hello-ok = connected
    if (frame.event === 'hello-ok') {
      this.emit('_status', { status: 'connected' } as unknown as EventFrame);
      this._connectionResolve?.();
      this._connectionResolve = null;
      this._connectionReject = null;
    }

    this.emit(frame.event, frame);
  }

  private _handleResponse(frame: ResponseFrame): void {
    const pending = this.pending.get(frame.id);
    if (!pending) return;
    this.pending.delete(frame.id);
    clearTimeout(pending.timer);

    if (frame.ok) {
      pending.resolve(frame.payload);
    } else {
      const errMsg = frame.error?.message ?? 'RPC error';
      pending.reject(new Error(errMsg));
    }
  }

  private _sendHandshake(nonce?: string): void {
    const req: RequestFrame = {
      type: 'req',
      id: this._nextId(),
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'eragon-control-ui',
          version: '1.0.0',
          platform: navigator?.platform ?? 'web',
          mode: 'webchat',
        },
        role: this.config.role ?? 'operator',
        scopes: this.config.scopes ?? ['operator.read', 'operator.write', 'operator.admin', 'operator.approvals', 'operator.pairing'],
        caps: [],
        commands: [],
        permissions: {},
        auth: { token: this.config.token },
        locale: navigator?.language ?? 'en-US',
        userAgent: 'orchestra/1.0.0',
      },
    };
    this._send(req);
  }

  // ── RPC ─────────────────────────────────────────────────────────────────

  request(
    method: string,
    params: Record<string, unknown> = {},
    timeoutMs = this.REQUEST_TIMEOUT_MS,
  ): Promise<Record<string, unknown> | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected'));
        return;
      }

      const id = this._nextId();
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request ${method} timed out`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });

      const frame: RequestFrame = { type: 'req', id, method, params };
      this._send(frame);
    });
  }

  // ── Typed RPC Methods ─────────────────────────────────────────────────

  chatSend(params: ChatSendParams) {
    return this.request('chat.send', params as unknown as Record<string, unknown>);
  }

  chatHistory(params: ChatHistoryParams) {
    return this.request('chat.history', params as unknown as Record<string, unknown>);
  }

  chatAbort(params: ChatAbortParams = {}) {
    return this.request('chat.abort', params as unknown as Record<string, unknown>);
  }

  sessionsList() {
    return this.request('sessions.list');
  }

  sessionsReset(params: SessionsResetParams) {
    return this.request('sessions.reset', params as unknown as Record<string, unknown>);
  }

  sessionsPatch(params: SessionsPatchParams) {
    return this.request('sessions.patch', params as unknown as Record<string, unknown>);
  }

  cronList() {
    return this.request('cron.list');
  }

  cronStatus() {
    return this.request('cron.status');
  }

  cronRuns(params: CronRunsParams = {}) {
    return this.request('cron.runs', params as unknown as Record<string, unknown>);
  }

  agentFilesList() {
    return this.request('agents.files.list');
  }

  agentFilesGet(params: AgentFilesGetParams) {
    return this.request('agents.files.get', params as unknown as Record<string, unknown>);
  }

  agentsList() {
    return this.request('agents.list');
  }

  toolsCatalog() {
    return this.request('tools.catalog');
  }

  skillsStatus() {
    return this.request('skills.status');
  }

  skillsInstall(params: { name: string; version?: string }) {
    return this.request('skills.install', params as unknown as Record<string, unknown>);
  }

  skillsUpdate(params: { name: string }) {
    return this.request('skills.update', params as unknown as Record<string, unknown>);
  }

  configGet() {
    return this.request('config.get');
  }

  configSet(params: { path: string; value: unknown }) {
    return this.request('config.set', params as unknown as Record<string, unknown>);
  }

  configApply(params: { config: unknown }) {
    return this.request('config.apply', params as unknown as Record<string, unknown>);
  }

  configSchema() {
    return this.request('config.schema');
  }

  searchQuery(params: { query: string; limit?: number }) {
    return this.request('search.query', params as unknown as Record<string, unknown>);
  }

  searchIntegrations() {
    return this.request('search.integrations.list');
  }

  nodeList() {
    return this.request('node.list');
  }

  channelsStatus() {
    return this.request('channels.status');
  }

  modelsList() {
    return this.request('models.list');
  }

  systemPresence() {
    return this.request('system-presence');
  }

  // Usage & cost
  sessionsUsage(params: { sessionKey?: string } = {}) {
    return this.request('sessions.usage', params as Record<string, unknown>);
  }

  usageCost() {
    return this.request('usage.cost', {});
  }

  sessionsUsageTimeseries(params: { sessionKey?: string } = {}) {
    return this.request('sessions.usage.timeseries', params as Record<string, unknown>);
  }

  // Exec approvals
  getExecApprovals() {
    return this.request('exec.approvals.get', {});
  }

  resolveExecApproval(id: string, decision: 'allow-once' | 'allow-always' | 'deny') {
    return this.request('exec.approval.resolve', { id, decision });
  }

  // File editing
  setAgentFile(params: { path: string; content: string }) {
    return this.request('agents.files.set', params as unknown as Record<string, unknown>);
  }

  // Log tailing
  tailLogs(params: { limit?: number } = {}) {
    return this.request('logs.tail', params as Record<string, unknown>);
  }

  // Cron CRUD
  addCronJob(params: { job: Record<string, unknown> }) {
    return this.request('cron.add', params as unknown as Record<string, unknown>);
  }

  updateCronJob(params: { jobId: string; patch: Record<string, unknown> }) {
    return this.request('cron.update', params as unknown as Record<string, unknown>);
  }

  removeCronJob(params: { jobId: string }) {
    return this.request('cron.remove', params as unknown as Record<string, unknown>);
  }

  runCronJob(params: { jobId: string }) {
    return this.request('cron.run', params as unknown as Record<string, unknown>);
  }

  // Overview
  overviewSnapshot() {
    return this.request('overview.snapshot.status', {});
  }

  // Models providers
  modelsProviders() {
    return this.request('models.providers', {});
  }

  // Agent identity
  agentIdentity() {
    return this.request('agent.identity.get', {});
  }

  // ── Event Emitter ───────────────────────────────────────────────────────

  on(event: string, handler: EventHandler): () => void {
    let handlers = this.eventHandlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.eventHandlers.set(event, handlers);
    }
    handlers.add(handler);
    return () => {
      handlers!.delete(handler);
    };
  }

  onAny(handler: EventHandler): () => void {
    this.globalHandlers.add(handler);
    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  private emit(event: string, frame: EventFrame): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const h of handlers) h(frame);
    }
    for (const h of this.globalHandlers) h(frame);
  }

  // ── Internals ───────────────────────────────────────────────────────────

  private _nextId(): string {
    return `r${++this.requestId}`;
  }

  private _send(frame: RequestFrame): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    }
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
