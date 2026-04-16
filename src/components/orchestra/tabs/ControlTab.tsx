import { useEffect } from 'react';
import { Settings, Wifi, Users, Radio, ExternalLink, LogOut, Activity, ScrollText, RefreshCw } from 'lucide-react';
import { useGateway, usePresence, useChannels, useOverview, useLogs } from '../../../gateway';
import { ConfigEditor } from '../ConfigEditor';

function QuickLink({ icon: Icon, label }: { icon: typeof Settings; label: string }) {
  return (
    <button
      onClick={() => alert('Coming soon')}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs cursor-pointer transition-colors hover:opacity-80"
      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
      {label}
      <ExternalLink className="w-3 h-3 ml-auto" style={{ color: 'var(--text-muted)' }} />
    </button>
  );
}

export function ControlTab() {
  const { wsUrl, isConnected, disconnect } = useGateway();
  const { presence, refreshPresence } = usePresence();
  const { channels, refreshChannels } = useChannels();
  const { overview, refresh: refreshOverview } = useOverview();
  const { logs, refresh: refreshLogs } = useLogs();

  // Load data once on mount — empty deps to prevent infinite loop
  useEffect(() => {
    refreshPresence();
    refreshChannels();
    refreshOverview();
    refreshLogs(30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parse overview data
  const uptime = overview?.uptime as string | undefined;
  const sessionCount = overview?.sessionCount ?? overview?.sessions;
  const cronEnabled = overview?.cronEnabled ?? overview?.cron;

  return (
    <div className="p-3 space-y-4">
      {/* Overview */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-3.5 h-3.5" style={{ color: 'var(--corgi-orange)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Overview</span>
          <button onClick={refreshOverview} className="ml-auto p-0.5 rounded cursor-pointer hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <div className="p-3 rounded-lg space-y-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
          {overview ? (
            <>
              {uptime && (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Uptime</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{uptime}</span>
                </div>
              )}
              {sessionCount != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sessions</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{String(sessionCount)}</span>
                </div>
              )}
              {cronEnabled != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cron</span>
                  <span className="text-xs" style={{ color: cronEnabled ? 'var(--success)' : 'var(--text-muted)' }}>
                    {cronEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              )}
              {!uptime && sessionCount == null && cronEnabled == null && (
                <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                  {Object.keys(overview).length > 0 ? (
                    <pre className="text-left text-[10px] overflow-x-auto">{JSON.stringify(overview, null, 2)}</pre>
                  ) : 'No overview data'}
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-center py-1" style={{ color: 'var(--text-muted)' }}>Loading…</div>
          )}
        </div>
      </div>

      {/* Gateway Status */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-3.5 h-3.5" style={{ color: 'var(--corgi-orange)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Gateway</span>
        </div>
        <div className="p-3 rounded-lg space-y-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: isConnected ? 'var(--success)' : 'var(--danger)' }} />
              <span className="text-xs" style={{ color: isConnected ? 'var(--success)' : 'var(--danger)' }}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>URL</span>
            <span className="text-xs font-mono truncate ml-2" style={{ color: 'var(--text-secondary)' }}>{wsUrl || '—'}</span>
          </div>
        </div>
      </div>

      {/* Presence */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Presence ({presence.length})
          </span>
        </div>
        {presence.length === 0 ? (
          <div className="text-xs px-2 py-3 text-center" style={{ color: 'var(--text-muted)' }}>No connected clients</div>
        ) : (
          <div className="space-y-1">
            {presence.map((p) => (
              <div key={p.clientId} className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
                <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{p.role ?? 'client'}</span>
                <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>{p.clientId.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Channels */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Wifi className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Channels ({channels.length})
          </span>
        </div>
        {channels.length === 0 ? (
          <div className="text-xs px-2 py-3 text-center" style={{ color: 'var(--text-muted)' }}>No channels</div>
        ) : (
          <div className="space-y-1">
            {channels.map((ch) => (
              <div key={ch.name} className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: ch.connected ? 'var(--success)' : 'var(--danger)' }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ch.name}</span>
                {ch.type && <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>{ch.type}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logs */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ScrollText className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Logs</span>
          <button onClick={() => refreshLogs(30)} className="ml-auto p-0.5 rounded cursor-pointer hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <div
          className="p-2 rounded-lg overflow-y-auto font-mono"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            maxHeight: 200,
            fontSize: 10,
            lineHeight: '1.5',
          }}
        >
          {logs.length > 0 ? (
            logs.map((line, i) => (
              <div key={i} style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line}</div>
            ))
          ) : (
            <div className="text-center py-2" style={{ color: 'var(--text-muted)' }}>No logs available</div>
          )}
        </div>
      </div>

      {/* Config Editor */}
      <ConfigEditor />

      {/* Quick Links */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Quick Links</span>
        </div>
        <div className="space-y-1">
          <QuickLink icon={Settings} label="Gateway Settings" />
          <QuickLink icon={Users} label="Manage Agents" />
          <QuickLink icon={Wifi} label="Channel Config" />
        </div>
      </div>

      {/* Disconnect */}
      <button
        onClick={disconnect}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs cursor-pointer transition-opacity hover:opacity-80"
        style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}
      >
        <LogOut className="w-3.5 h-3.5" />
        Disconnect
      </button>
    </div>
  );
}
