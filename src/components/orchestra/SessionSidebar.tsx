import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare, Plus, MoreVertical } from 'lucide-react';
import { useSessions, useCapacity } from '../../gateway';
import type { Session } from '../../gateway';
import { SearchBar } from './SearchBar';

// ─── Glow helper ─────────────────────────────────────────────────────────────

function glowStyle(current: number, max: number): React.CSSProperties {
  if (current === 0) return {};
  const ratio = current / max;
  let level: number;
  let duration: string;
  if (ratio >= 1.0)   { level = 4; duration = '0.8s'; }
  else if (ratio >= 0.75) { level = 3; duration = '1.2s'; }
  else if (ratio >= 0.5)  { level = 2; duration = '1.8s'; }
  else                    { level = 1; duration = '2.5s'; }
  return { animation: `orange-glow-${level} ${duration} ease-in-out infinite` };
}

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

function sessionName(s: Session): string {
  if (s.label) return s.label;
  if (s.lastMessage) return s.lastMessage.slice(0, 50);
  // Derive from key
  const parts = s.key.split(':');
  return parts[parts.length - 1]?.slice(0, 30) ?? s.key.slice(0, 30);
}

export function SessionSidebar() {
  const { sessions, activeSessionKey, switchSession, renameSession, resetSession } = useSessions();
  const { mainRuns } = useCapacity();
  const containerGlow = useMemo(
    () => glowStyle(mainRuns.current, mainRuns.max),
    [mainRuns.current, mainRuns.max],
  );
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; key: string } | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  const sorted = [...sessions].sort((a, b) => {
    const ta = String(a.updatedAt ?? a.createdAt ?? '');
    const tb = String(b.updatedAt ?? b.createdAt ?? '');
    return tb.localeCompare(ta);
  });

  const handleContextMenu = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, key });
  }, []);

  const handleDoubleClick = useCallback((s: Session) => {
    setEditingKey(s.key);
    setEditValue(sessionName(s));
  }, []);

  const commitRename = useCallback(() => {
    if (editingKey && editValue.trim()) {
      renameSession(editingKey, editValue.trim());
    }
    setEditingKey(null);
  }, [editingKey, editValue, renameSession]);

  useEffect(() => {
    if (editingKey && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingKey]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 250,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        ...containerGlow,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sessions</span>
        <button
          className="p-1.5 rounded-md transition-colors cursor-pointer hover:opacity-80"
          style={{ background: 'var(--corgi-orange)' }}
          title="New Chat"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* Search */}
      <SearchBar />

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-1">
        {sorted.map((s) => {
          const isActive = s.key === activeSessionKey;
          return (
            <div
              key={s.key}
              onClick={() => switchSession(s.key)}
              onContextMenu={(e) => handleContextMenu(e, s.key)}
              onDoubleClick={() => handleDoubleClick(s)}
              className="flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-md cursor-pointer transition-colors group"
              style={{
                background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--corgi-orange)' : '2px solid transparent',
              }}
            >
              <MessageSquare className="w-4 h-4 shrink-0" style={{ color: isActive ? 'var(--corgi-orange)' : 'var(--text-muted)' }} />
              <div className="flex-1 min-w-0">
                {editingKey === s.key ? (
                  <input
                    ref={editRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingKey(null);
                    }}
                    className="w-full text-xs px-1 py-0.5 rounded outline-none"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--corgi-orange)' }}
                  />
                ) : (
                  <div className="text-xs truncate" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {sessionName(s)}
                  </div>
                )}
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {timeAgo(s.updatedAt ?? s.createdAt)}
                  {s.messageCount ? ` · ${s.messageCount} msgs` : ''}
                </div>
              </div>
              <MoreVertical
                className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
                onClick={(e) => handleContextMenu(e, s.key)}
              />
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            No sessions yet
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded-lg py-1 shadow-xl"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            minWidth: 140,
          }}
        >
          {[
            { label: 'Rename', action: () => { const s = sessions.find(s => s.key === contextMenu.key); if (s) handleDoubleClick(s); } },
            { label: 'Reset', action: () => resetSession(contextMenu.key) },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full text-left px-3 py-1.5 text-xs cursor-pointer transition-colors hover:opacity-80"
              style={{ color: item.label === 'Reset' ? 'var(--danger)' : 'var(--text-secondary)' }}
              onClick={item.action}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
