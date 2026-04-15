import { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface FleetAgent {
  id?: string;
  name?: string;
  agentId?: string;
  status?: string;
  url?: string;
  lastSeen?: string;
}

export function FleetTab() {
  const [agents, setAgents] = useState<FleetAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFleet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:19800/api/fleet');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { agents?: FleetAgent[] };
      setAgents(data.agents ?? []);
    } catch (err) {
      setError((err as Error).message);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFleet(); }, [fetchFleet]);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5" style={{ color: 'var(--corgi-orange)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Fleet</span>
        </div>
        <button
          onClick={fetchFleet}
          className="p-1 rounded cursor-pointer transition-opacity hover:opacity-80"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--text-muted)' }}>
          <WifiOff className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
          <span>Aggregator offline — {error}</span>
        </div>
      )}

      {!error && agents.length === 0 && !loading && (
        <div className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
          No agents in fleet
        </div>
      )}

      <div className="space-y-2">
        {agents.map((a, i) => (
          <div
            key={a.id ?? a.agentId ?? i}
            className="p-3 rounded-lg"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {a.name ?? a.agentId ?? `Agent ${i + 1}`}
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: a.status === 'online' ? 'var(--success)' : a.status === 'error' ? 'var(--danger)' : 'var(--text-muted)' }}
                />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{a.status ?? 'unknown'}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <Wifi className="w-3 h-3" />
              <span>{a.url ?? '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
