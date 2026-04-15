import { useEffect } from 'react';
import { useGateway } from './gateway';
import { ConnectScreen } from './components/orchestra/ConnectScreen';
import { CapacityBar } from './components/orchestra/CapacityBar';
import { SessionSidebar } from './components/orchestra/SessionSidebar';
import { ChatPanel } from './components/orchestra/ChatPanel';
import { RightPanel } from './components/orchestra/RightPanel';

function App() {
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
    return <ConnectScreen />;
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-primary)' }}>
      <CapacityBar />
      <div className="flex flex-1 min-h-0">
        <SessionSidebar />
        <ChatPanel />
        <RightPanel />
      </div>
    </div>
  );
}

export default App;
