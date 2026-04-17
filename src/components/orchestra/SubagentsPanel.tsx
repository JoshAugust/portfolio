import { useMemo } from 'react';
import { useSessions } from '../../gateway';
import type { Session } from '../../gateway';

function timeAgo(dateStr?: string | number): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function subagentName(s: Session): string {
  // 1. Label is set by the spawner (e.g., "build-orchestra-fixes")
  if (s.label) return s.label;

  // 2. displayName might have useful info
  const dn = (s as Record<string, unknown>).displayName;
  if (dn && typeof dn === 'string' && !dn.includes('subagent')) return dn;

  // 3. Parse from key: "agent:joshua_augustine:subagent:UUID"
  const uuid = s.key.split(':').pop()?.slice(0, 8) ?? '?';
  return `Agent ${uuid}`;
}

function isRecent(dateStr?: string | number): boolean {
  if (!dateStr) return false;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 600000; // 10 minutes
}

export function SubagentsPanel() {
  const { sessions, switchSession, activeSessionKey } = useSessions();

  const subagentSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.key.includes('subagent'))
        .sort((a, b) => {
          const ta = String(a.updatedAt ?? a.createdAt ?? '');
          const tb = String(b.updatedAt ?? b.createdAt ?? '');
          return tb.localeCompare(ta);
        }),
    [sessions],
  );

  if (subagentSessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-2xl mb-2">🧩</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No sub-agents detected
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
            Sub-agent sessions will appear here when spawned
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {subagentSessions.map((s) => {
        const isActive = s.key === activeSessionKey;
        const recent = isRecent(s.updatedAt ?? s.createdAt);
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
              style={{ background: recent ? '#22c55e' : 'var(--text-muted)' }}
            />
            <span className="text-sm shrink-0">🧩</span>
            <div className="flex-1 min-w-0">
              <div
                className="text-xs truncate"
                style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {subagentName(s)}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Last run: {timeAgo(s.updatedAt ?? s.createdAt) || 'unknown'}
                {s.messageCount ? ` · ${s.messageCount} msgs` : ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
