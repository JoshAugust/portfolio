import { useEffect, Component, type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Radio, ArrowRight, Loader2 } from 'lucide-react';

// ─── Error Boundary ─────────────────────────────────────────────────────────

interface EBProps { children: ReactNode }
interface EBState { error: Error | null }

class ErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#0a0a0f', color: '#ef4444',
          fontFamily: 'monospace', padding: '2rem', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Orchestra Error</h2>
          <pre style={{ fontSize: '0.8rem', color: '#9898b0', maxWidth: '600px', whiteSpace: 'pre-wrap' }}>
            {this.state.error.message}
          </pre>
          <Link to="/" style={{ marginTop: '1.5rem', color: '#FF5C00', textDecoration: 'underline' }}>
            ← Back to Portfolio
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
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

// ─── Orchestra Page ─────────────────────────────────────────────────────────

function OrchestraInner() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Lazy-load the full Orchestra UI only after connecting
  const [OrchestraUI, setOrchestraUI] = useState<React.ComponentType | null>(null);

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

      // Create the connected UI component
      const ConnectedUI = () => (
        <div className="orchestra-ui flex flex-col h-screen" style={{ background: '#0a0a0f' }}>
          <CapacityBar />
          <div className="flex flex-1 min-h-0">
            <SessionSidebar />
            <ChatPanel />
            <RightPanel />
          </div>
          <ExecApprovalOverlay />
        </div>
      );

      setOrchestraUI(() => ConnectedUI);
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

  if (status === 'connected' && OrchestraUI) {
    return <OrchestraUI />;
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
