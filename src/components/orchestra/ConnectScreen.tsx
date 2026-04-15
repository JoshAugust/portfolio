import { useState } from 'react';
import { Radio, ArrowRight, Loader2 } from 'lucide-react';
import { useGateway } from '../../gateway';

export function ConnectScreen() {
  const { connect, isConnecting, error } = useGateway();
  const [url, setUrl] = useState(() => localStorage.getItem('orchestra:wsUrl') ?? 'ws://127.0.0.1:19747');
  const [token, setToken] = useState(() => localStorage.getItem('orchestra:token') ?? '');

  const handleConnect = async () => {
    localStorage.setItem('orchestra:wsUrl', url);
    localStorage.setItem('orchestra:token', token);
    try {
      await connect(url, token);
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md p-8 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--corgi-orange)' }}>
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Orchestra</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Connect to your gateway</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Gateway URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="ws://127.0.0.1:19747"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Your gateway token"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isConnecting || !url || !token}
            className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--corgi-orange)', color: 'white' }}
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
