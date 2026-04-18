import { useEffect, Component, type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Radio, ArrowRight, Loader2, RefreshCw, AlertTriangle, WifiOff, Menu, PanelRightOpen, X } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

// ─── Error Boundary ─────────────────────────────────────────────────────────

interface EBProps { children: ReactNode; fallbackLabel?: string }
interface EBState { error: Error | null }

class ErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }
  handleRetry = () => {
    this.setState({ error: null });
  };
  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#0a0a0f', color: '#ef4444',
          fontFamily: 'monospace', padding: '2rem', textAlign: 'center',
        }}>
          <AlertTriangle style={{ width: 40, height: 40, marginBottom: '1rem', color: '#ef4444' }} />
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            {this.props.fallbackLabel ?? 'Orchestra Error'}
          </h2>
          <pre style={{ fontSize: '0.8rem', color: '#9898b0', maxWidth: '600px', whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>
            {this.state.error.message}
          </pre>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={this.handleRetry}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: '#FF5C00', color: 'white', border: 'none',
                cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'monospace',
              }}
            >
              <RefreshCw style={{ width: 14, height: 14 }} />
              Retry
            </button>
            <Link
              to="/"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: '#1a1a26', color: '#9898b0', border: '1px solid #2a2a3a',
                textDecoration: 'none', fontSize: '0.85rem', fontFamily: 'monospace',
              }}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              Back
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Panel Error Boundary (inline, for individual panels) ───────────────────

class PanelErrorBoundary extends Component<{ children: ReactNode; name: string }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[PanelErrorBoundary:${this.props.name}]`, error, info.componentStack);
  }
  handleRetry = () => { this.setState({ error: null }); };
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center" style={{ color: 'var(--text-muted)' }}>
          <AlertTriangle className="w-8 h-8" style={{ color: 'var(--danger, #ef4444)' }} />
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {this.props.name} crashed
          </div>
          <pre className="text-[10px] max-w-full overflow-auto" style={{ color: 'var(--text-muted)' }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
            style={{ background: 'var(--corgi-orange, #FF5C00)', color: 'white', border: 'none' }}
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Reconnection Banner ────────────────────────────────────────────────────

function ReconnectionBanner({ status }: { status: 'disconnected' | 'connecting' | 'connected' }) {
  if (status === 'connected') return null;
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 shrink-0"
      style={{
        height: 32,
        background: status === 'connecting' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
        borderBottom: `1px solid ${status === 'connecting' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`,
      }}
    >
      {status === 'connecting' ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#eab308' }} />
      ) : (
        <WifiOff className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
      )}
      <span className="text-xs font-medium" style={{ color: status === 'connecting' ? '#eab308' : '#ef4444' }}>
        {status === 'connecting' ? 'Reconnecting…' : 'Disconnected — reconnecting shortly'}
      </span>
    </div>
  );
}

// ─── Inline Connect Screen (no external deps) ──────────────────────────────

function InlineConnectScreen({ onConnect, error: connectError, isConnecting }: {
  onConnect: (url: string, token: string) => void;
  error: string | null;
  isConnecting: boolean;
}) {
  const [url, setUrl] = useState(() => {
    const saved = localStorage.getItem('orchestra:wsUrl');
    // Auto-fix cached URLs missing /ws path
    if (saved === 'wss://relay-production-62fa.up.railway.app') {
      localStorage.setItem('orchestra:wsUrl', 'wss://relay-production-62fa.up.railway.app/ws');
      return 'wss://relay-production-62fa.up.railway.app/ws';
    }
    return saved ?? 'wss://relay-production-62fa.up.railway.app/ws';
  });
  const [token, setToken] = useState(() => localStorage.getItem('orchestra:token') ?? '');

  const handleConnect = () => {
    localStorage.setItem('orchestra:wsUrl', url);
    localStorage.setItem('orchestra:token', token);
    onConnect(url, token);
  };

  return (
    <div className="orchestra-ui flex items-center justify-center h-screen" style={{ background: '#0a0a0f' }}>
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
        style={{ color: '#686880', background: '#1a1a26', border: '1px solid #2a2a3a' }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Portfolio
      </Link>

      <div className="w-full max-w-md p-8 rounded-2xl" style={{ background: '#12121a', border: '1px solid #2a2a3a' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FF5C00' }}>
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#e8e8f0' }}>Orchestra</h1>
            <p className="text-sm" style={{ color: '#686880' }}>Connect to your gateway</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#686880' }}>
              Gateway URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="wss://relay.example.com"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: '#1a1a26', border: '1px solid #2a2a3a', color: '#e8e8f0' }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#686880' }}>
              Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Your gateway token"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: '#1a1a26', border: '1px solid #2a2a3a', color: '#e8e8f0' }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
          </div>

          {connectError && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              {connectError}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isConnecting || !url || !token}
            className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#FF5C00', color: 'white' }}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                Connect
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Connected Orchestra UI ─────────────────────────────────────────────────

function ConnectedOrchestraUI({ modules }: {
  modules: {
    CapacityBar: React.ComponentType;
    SessionSidebar: React.ComponentType;
    ChatPanel: React.ComponentType;
    RightPanel: React.ComponentType;
    ExecApprovalOverlay: React.ComponentType;
  };
}) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const { CapacityBar, SessionSidebar, ChatPanel, RightPanel, ExecApprovalOverlay } = modules;

  // Track connection status for reconnection banner
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('connected');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    import('../gateway').then(({ useGatewayStore }) => {
      unsubscribe = useGatewayStore.subscribe(
        (state) => {
          setConnectionStatus(state.connectionStatus);
        },
      );
      // Set initial
      setConnectionStatus(useGatewayStore.getState().connectionStatus);
    });
    return () => unsubscribe?.();
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      if (e.key === 'k') {
        e.preventDefault();
        // Focus the search input in SessionSidebar
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        if (searchInput) {
          searchInput.focus();
          if (isMobile) setSidebarOpen(true);
        }
      }

      if (e.key === 'n') {
        e.preventDefault();
        // Trigger new chat
        import('../gateway').then(({ useGatewayStore }) => {
          useGatewayStore.getState().createNewChat();
        });
        if (isMobile) setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMobile]);

  // ── Desktop layout ────────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div className="orchestra-ui flex flex-col h-screen" style={{ background: '#0a0a0f' }}>
        <ReconnectionBanner status={connectionStatus} />
        <PanelErrorBoundary name="Capacity Bar"><CapacityBar /></PanelErrorBoundary>
        <div className="flex flex-1 min-h-0">
          <PanelErrorBoundary name="Session Sidebar"><SessionSidebar /></PanelErrorBoundary>
          <PanelErrorBoundary name="Chat Panel"><ChatPanel /></PanelErrorBoundary>
          <PanelErrorBoundary name="Right Panel"><RightPanel /></PanelErrorBoundary>
        </div>
        <PanelErrorBoundary name="Exec Approvals"><ExecApprovalOverlay /></PanelErrorBoundary>
      </div>
    );
  }

  // ── Mobile layout ─────────────────────────────────────────────────────
  return (
    <div className="orchestra-ui flex flex-col h-screen relative" style={{ background: '#0a0a0f' }}>
      <ReconnectionBanner status={connectionStatus} />

      {/* Mobile top bar */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{ height: 44, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
      >
        <button
          onClick={() => { setSidebarOpen(true); setRightPanelOpen(false); }}
          className="p-2 rounded-lg cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4" style={{ color: '#FF5C00' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Orchestra</span>
        </div>
        <button
          onClick={() => { setRightPanelOpen(true); setSidebarOpen(false); }}
          className="p-2 rounded-lg cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          <PanelRightOpen className="w-5 h-5" />
        </button>
      </div>

      {/* Main chat area */}
      <div className="flex-1 min-h-0">
        <PanelErrorBoundary name="Chat Panel"><ChatPanel /></PanelErrorBoundary>
      </div>

      <PanelErrorBoundary name="Exec Approvals"><ExecApprovalOverlay /></PanelErrorBoundary>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex flex-col" style={{ width: '80vw', maxWidth: 320 }}>
            <div className="flex items-center justify-end p-2" style={{ background: 'var(--bg-secondary)' }}>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <PanelErrorBoundary name="Session Sidebar"><SessionSidebar /></PanelErrorBoundary>
            </div>
          </div>
        </>
      )}

      {/* Mobile right panel overlay */}
      {rightPanelOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setRightPanelOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex flex-col" style={{ width: '85vw', maxWidth: 380 }}>
            <div className="flex items-center justify-start p-2" style={{ background: 'var(--bg-secondary)' }}>
              <button onClick={() => setRightPanelOpen(false)} className="p-1.5 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <PanelErrorBoundary name="Right Panel"><RightPanel /></PanelErrorBoundary>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Orchestra Page ─────────────────────────────────────────────────────────

function OrchestraInner() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Lazy-load the full Orchestra UI only after connecting
  const [loadedModules, setLoadedModules] = useState<{
    CapacityBar: React.ComponentType;
    SessionSidebar: React.ComponentType;
    ChatPanel: React.ComponentType;
    RightPanel: React.ComponentType;
    ExecApprovalOverlay: React.ComponentType;
  } | null>(null);

  const handleConnect = async (url: string, token: string) => {
    setStatus('connecting');
    setError(null);
    try {
      // Dynamically import the gateway and connect
      const { useGatewayStore } = await import('../gateway');
      const store = useGatewayStore.getState();
      await store.connect(url, token);
      
      // Dynamically import the full UI components
      const [
        { CapacityBar },
        { SessionSidebar },
        { ChatPanel },
        { RightPanel },
        { ExecApprovalOverlay },
      ] = await Promise.all([
        import('../components/orchestra/CapacityBar'),
        import('../components/orchestra/SessionSidebar'),
        import('../components/orchestra/ChatPanel'),
        import('../components/orchestra/RightPanel'),
        import('../components/orchestra/ExecApprovalOverlay'),
      ]);

      setLoadedModules({ CapacityBar, SessionSidebar, ChatPanel, RightPanel, ExecApprovalOverlay });
      setStatus('connected');
    } catch (err) {
      setError((err as Error).message);
      setStatus('disconnected');
    }
  };

  // Try auto-connect on mount
  useEffect(() => {
    const url = localStorage.getItem('orchestra:wsUrl');
    const token = localStorage.getItem('orchestra:token');
    if (url && token) {
      handleConnect(url, token);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'connected' && loadedModules) {
    return <ConnectedOrchestraUI modules={loadedModules} />;
  }

  return (
    <InlineConnectScreen
      onConnect={handleConnect}
      error={error}
      isConnecting={status === 'connecting'}
    />
  );
}

export default function OrchestraPage() {
  return (
    <ErrorBoundary>
      <OrchestraInner />
    </ErrorBoundary>
  );
}
