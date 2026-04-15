import { useEffect, Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGateway } from '../gateway';
import { ConnectScreen } from '../components/orchestra/ConnectScreen';
import { CapacityBar } from '../components/orchestra/CapacityBar';
import { SessionSidebar } from '../components/orchestra/SessionSidebar';
import { ChatPanel } from '../components/orchestra/ChatPanel';
import { RightPanel } from '../components/orchestra/RightPanel';
import { ExecApprovalOverlay } from '../components/orchestra/ExecApprovalOverlay';

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

// ─── Orchestra Page ─────────────────────────────────────────────────────────

function OrchestraInner() {
  const { isConnected, connect } = useGateway();

  useEffect(() => {
    const url = localStorage.getItem('orchestra:wsUrl');
    const token = localStorage.getItem('orchestra:token');
    if (url && token) {
      connect(url, token).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isConnected) {
    return (
      <div className="relative">
        <Link
          to="/"
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Portfolio
        </Link>
        <ConnectScreen />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-primary)' }}>
      <CapacityBar />
      <div className="flex flex-1 min-h-0">
        <SessionSidebar />
        <ChatPanel />
        <RightPanel />
      </div>
      <ExecApprovalOverlay />
    </div>
  );
}

export default function OrchestraPage() {
  return (
    <ErrorBoundary>
      <OrchestraInner />
    </ErrorBoundary>
  );
}
