import { useEffect } from 'react';
import { Settings, Wifi, Users, Radio, ExternalLink, LogOut } from 'lucide-react';
import { useGateway, usePresence, useChannels } from '../../../gateway';

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

  useEffect(() => {
    refreshPresence();
    refreshChannels();
  }, [refreshPresence, refreshChannels]);

  return (
    <div className="p-3 space-y-4">
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
