import { useMemo } from 'react';
import { useSessions } from '../../gateway';
import type { Session } from '../../gateway';

function timeAgo(dateStr?: string | number): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function isDaemonSession(s: Session): boolean {
  const key = s.key.toLowerCase();
  const label = (s.label ?? '').toLowerCase();
  return (
    key.includes('cron:') ||
    key.includes('heartbeat') ||
    key.includes('daemon') ||
    key.includes('monitor') ||
    key.includes('watcher') ||
    label.includes('daemon') ||
    label.includes('heartbeat') ||
    label.includes('cron')
  );
}

function daemonName(s: Session): string {
  if (s.label) return s.label;
  const key = s.key;
  if (key.includes('cron:')) {
    const parts = key.split(':');
    return `Cron: ${parts[parts.length - 1]?.slice(0, 20) ?? 'job'}`;
  }
  if (key.includes('heartbeat')) return 'Heartbeat';
  const parts = key.split(':');
  return parts[parts.length - 1]?.slice(0, 24) ?? key.slice(0, 24);
}

export function DaemonsPanel() {
  const { sessions, switchSession, activeSessionKey } = useSessions();

  const daemonSessions = useMemo(
    () =>
      sessions
        .filter(isDaemonSession)
        .sort((a, b) => {
          const ta = String(a.updatedAt ?? a.createdAt ?? '');
          const tb = String(b.updatedAt ?? b.createdAt ?? '');
          return tb.localeCompare(ta);
        }),
    [sessions],
  );

  if (daemonSessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-2xl mb-2">🤖</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No daemon processes detected
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
            Sessions with cron, heartbeat, or daemon patterns will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {daemonSessions.map((s) => {
        const isActive = s.key === activeSessionKey;
        return (
          <div
            key={s.key}
            onClick={() => switchSession(s.key)}
            className="flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-md cursor-pointer transition-colors hover:opacity-80"
            style={{
              background: isActive ? 'var(--bg-tertiary)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--corgi-orange)' : '2px solid transparent',
            }}
          >
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ background: '#22c55e' }}
            />
            <span className="text-sm shrink-0">🤖</span>
            <div className="flex-1 min-w-0">
              <div
                className="text-xs truncate"
                style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {daemonName(s)}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {timeAgo(s.updatedAt ?? s.createdAt)}
                {s.messageCount ? ` · ${s.messageCount} msgs` : ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
