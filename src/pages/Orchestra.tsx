import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGateway } from '../gateway';
import { ConnectScreen } from '../components/orchestra/ConnectScreen';
import { CapacityBar } from '../components/orchestra/CapacityBar';
import { SessionSidebar } from '../components/orchestra/SessionSidebar';
import { ChatPanel } from '../components/orchestra/ChatPanel';
import { RightPanel } from '../components/orchestra/RightPanel';
import { ExecApprovalOverlay } from '../components/orchestra/ExecApprovalOverlay';

export default function OrchestraPage() {
  const { isConnected, connect } = useGateway();

  // Auto-connect from localStorage on mount
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
