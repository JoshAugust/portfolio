import { useState, useEffect, useCallback } from 'react';
import { Cpu, HardDrive, Activity, Terminal, RefreshCw, Monitor } from 'lucide-react';

const AGGREGATOR = 'http://127.0.0.1:19800';

interface SystemStats {
  cpu: { count: number; model: string; usagePercent: number };
  memory: { totalGB: number; usedGB: number; freeGB: number; percent: number };
  disk: { totalGB: number; usedGB: number; availGB: number; percent: number };
  uptime: number;
  loadAvg: number[];
  timestamp: string;
}

interface ProcessInfo {
  pid: number;
  command: string;
  cpu: number;
  mem: number;
  started: string;
}

interface LogLine {
  agent?: string;
  line: string;
}

function useAggregator<T>(endpoint: string, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetch(`${AGGREGATOR}${endpoint}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e.message));
  }, [endpoint]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { data, error, refresh };
}

function ProgressBar({ percent, size = 'normal' }: { percent: number; size?: 'normal' | 'small' }) {
  const color =
    percent >= 90 ? 'var(--danger)' :
    percent >= 75 ? 'var(--corgi-orange)' :
    percent >= 50 ? 'var(--warning)' :
    'var(--success)';
  const h = size === 'small' ? 4 : 6;
  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: h / 2, height: h, flex: 1 }}>
      <div style={{ background: color, height: '100%', borderRadius: h / 2, width: `${Math.min(percent, 100)}%`, transition: 'width 0.3s' }} />
    </div>
  );
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Cpu; children: React.ReactNode }) {
  return (
    <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--corgi-orange)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export function SystemTab() {
  const { data: stats, error: statsError } = useAggregator<SystemStats>('/api/system', 10000);
  const { data: procs } = useAggregator<{ processes: ProcessInfo[]; count: number }>('/api/processes', 30000);
  const { data: logs, refresh: refreshLogs } = useAggregator<{ lines: LogLine[] }>('/api/logs', 15000);
  const [logAgent, setLogAgent] = useState('all');

  if (statsError) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
        <Monitor className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <div className="text-sm">Aggregator offline</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Start it: <code>node aggregator/index.mjs</code></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* System Resources */}
      <Section title="System" icon={Cpu}>
        {stats ? (
          <div className="space-y-2.5">
            {/* CPU */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>CPU ({stats.cpu.count} cores)</span>
                <span style={{ color: 'var(--text-primary)' }}>{stats.cpu.usagePercent}%</span>
              </div>
              <ProgressBar percent={stats.cpu.usagePercent} />
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stats.cpu.model}</div>
            </div>
            {/* Memory */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>Memory</span>
                <span style={{ color: 'var(--text-primary)' }}>{stats.memory.usedGB} / {stats.memory.totalGB} GB ({stats.memory.percent}%)</span>
              </div>
              <ProgressBar percent={stats.memory.percent} />
            </div>
            {/* Disk */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>Disk</span>
                <span style={{ color: 'var(--text-primary)' }}>{stats.disk.usedGB} / {stats.disk.totalGB} GB ({stats.disk.percent}%)</span>
              </div>
              <ProgressBar percent={stats.disk.percent} />
            </div>
            {/* Load + Uptime */}
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Load: {stats.loadAvg.join(' / ')}</span>
              <span>Up: {formatUptime(stats.uptime)}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</div>
        )}
      </Section>

      {/* Processes */}
      <Section title="Processes" icon={Activity}>
        {procs && procs.count > 0 ? (
          <div className="space-y-1">
            {procs.processes.slice(0, 15).map((p) => (
              <div key={p.pid} className="flex items-center gap-2 text-xs py-0.5">
                <span style={{ color: 'var(--text-muted)', width: 45, flexShrink: 0 }}>{p.pid}</span>
                <span
                  className="flex-1 truncate font-mono"
                  style={{ color: 'var(--text-secondary)', fontSize: 10 }}
                  title={p.command}
                >{p.command}</span>
                <span style={{ color: p.cpu > 50 ? 'var(--corgi-orange)' : p.cpu > 80 ? 'var(--danger)' : 'var(--text-muted)', width: 40, textAlign: 'right', flexShrink: 0 }}>
                  {p.cpu}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {procs?.count === 0 ? 'No processes found (ps may be restricted)' : 'Loading...'}
          </div>
        )}
      </Section>

      {/* Logs */}
      <Section title="Logs" icon={Terminal}>
        <div className="flex items-center gap-2 mb-2">
          <select
            value={logAgent}
            onChange={(e) => setLogAgent(e.target.value)}
            className="text-xs px-2 py-1 rounded"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            <option value="all">All agents</option>
            <option value="joshua_augustine">joshua_augustine</option>
          </select>
          <button
            onClick={refreshLogs}
            className="p-1 rounded hover:opacity-80 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <div
          className="overflow-y-auto font-mono"
          style={{
            background: 'var(--bg-primary)',
            borderRadius: 4,
            padding: 8,
            maxHeight: 200,
            fontSize: 10,
            lineHeight: 1.5,
          }}
        >
          {logs?.lines && logs.lines.length > 0 ? (
            logs.lines.slice(-50).map((l, i) => {
              const text = typeof l === 'string' ? l : (l.line || '');
              const isError = /error/i.test(text);
              const isWarn = /warn/i.test(text);
              return (
                <div
                  key={i}
                  style={{
                    color: isError ? 'var(--danger)' : isWarn ? 'var(--warning)' : 'var(--text-muted)',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    paddingBottom: 1,
                    marginBottom: 1,
                  }}
                >
                  {text}
                </div>
              );
            })
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>No logs available</span>
          )}
        </div>
      </Section>
    </div>
  );
}
