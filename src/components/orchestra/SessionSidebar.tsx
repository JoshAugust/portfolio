import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare, Plus, MoreVertical } from 'lucide-react';
import { useSessions, useCapacity, usePanelTab } from '../../gateway';
import type { Session } from '../../gateway';
import { useGatewayStore } from '../../gateway';
import { SearchBar } from './SearchBar';
import { CronsPanel } from './CronsPanel';
import { DaemonsPanel } from './DaemonsPanel';
import { SubagentsPanel } from './SubagentsPanel';

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

// ─── Channel icon ────────────────────────────────────────────────────────────

function channelIcon(s: Session): string {
  const key = s.key;
  const channel = (s as any).channel;
  if (key.includes('subagent')) return '🤖';
  if (key.includes('cron')) return '⏰';
  if (channel === 'telegram') return '📱';
  if (channel === 'webchat') return '💬';
  if (channel === 'discord') return '🎮';
  return '💬';
}

// ─── Smart session name ──────────────────────────────────────────────────────

function sessionName(s: Session): string {
  // 1. User-set label takes priority
  if (s.label) return s.label;

  // 2. Group subject (e.g., "To Do", "GOLD", "Case Prep")
  if ((s as any).subject) return (s as any).subject;

  // 3. Parse origin.label for human names
  const originLabel = (s as any).origin?.label;
  if (originLabel) {
    // "Josh A (@lowcostjosh) id:1443217514" → "Josh A"
    const nameMatch = originLabel.match(/^([^(]+)/);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      if (name && name !== s.key && !/^\d+$/.test(name)) {
        const channel = (s as any).channel;
        const kind = (s as any).kind;
        if (kind === 'direct' && channel) return `${name} (${channel})`;
        if (kind === 'group' && channel) return `${name} (${channel} group)`;
        return name;
      }
    }
  }

  // 4. Parse key for context
  const key = s.key;
  if (key.includes('subagent')) {
    const uuid = key.split(':').pop()?.slice(0, 8);
    return `Sub-agent ${uuid}`;
  }
  if (key.includes('cron')) return 'Cron Job';
  if (key.includes('group')) {
    const subject = (s as any).subject;
    return subject || 'Group Chat';
  }
  if (key.includes('direct')) {
    const channel = (s as any).channel ?? 'DM';
    return `Direct (${channel})`;
  }

  // 5. Fallback: clean up the key
  const parts = key.split(':');
  return parts[parts.length - 1]?.slice(0, 20) ?? key.slice(0, 20);
}

// ─── Status dot ──────────────────────────────────────────────────────────────

function SessionStatusDot({ sessionKey }: { sessionKey: string }) {
  const activeKey = useGatewayStore((s) => s.activeSessionKey);
  const streaming = useGatewayStore((s) => s.chatStreaming);

  let color = 'var(--text-muted)'; // gray — idle
  if (sessionKey === activeKey && streaming) {
    color = '#eab308'; // orange/yellow — streaming
  }
  // Could track active runs per session with agent events in the future.
  // For now: gray idle, yellow streaming on active session.

  return (
    <span
      className="w-2 h-2 rounded-full inline-block shrink-0"
      style={{ background: color }}
    />
  );
}

// ─── Sidebar tabs ────────────────────────────────────────────────────────────

const SIDEBAR_TABS = [
  { id: 'chats' as const, icon: '💬', label: 'Chats' },
  { id: 'crons' as const, icon: '⏰', label: 'Crons' },
  { id: 'daemons' as const, icon: '🤖', label: 'Bots' },
  { id: 'subagents' as const, icon: '🧩', label: 'Agents' },
];

export function SessionSidebar() {
  const { sessions, activeSessionKey, switchSession, renameSession, resetSession, deleteSession, createNewChat } = useSessions();
  const { mainRuns } = useCapacity();
  const { activePanelTab, setActivePanelTab } = usePanelTab();
  const containerGlow = useMemo(
    () => glowStyle(mainRuns.current, mainRuns.max),
    [mainRuns.current, mainRuns.max],
  );
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; key: string } | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  // Filter out cron and daemon sessions from Chats tab — they have their own tabs
  const chatSessions = sessions.filter((s) => {
    const key = s.key;
    if (key.includes(':cron:')) return false;
    if (key.includes(':heartbeat')) return false;
    if (key.includes(':isolated') && !key.includes('subagent')) return false;
    if (key.includes('subagent')) return false;
    return true;
  });

  const sorted = [...chatSessions].sort((a, b) => {
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
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {activePanelTab === 'chats' ? 'Sessions' : activePanelTab === 'crons' ? 'Cron Jobs' : activePanelTab === 'subagents' ? 'Sub-agents' : 'Daemons'}
        </span>
        {activePanelTab === 'chats' && (
          <button
            className="p-1.5 rounded-md transition-colors cursor-pointer hover:opacity-80"
            style={{ background: 'var(--corgi-orange)' }}
            title="New Chat"
            onClick={createNewChat}
          >
            <Plus className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {SIDEBAR_TABS.map((tab) => {
          const isActive = tab.id === activePanelTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePanelTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 cursor-pointer transition-colors relative"
              style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
              }}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                  style={{ background: 'var(--corgi-orange)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Search (only on chats tab) */}
      {activePanelTab === 'chats' && <SearchBar />}

      {/* Crons tab */}
      {activePanelTab === 'crons' && <CronsPanel />}

      {/* Daemons tab */}
      {activePanelTab === 'daemons' && <DaemonsPanel />}

      {/* Sub-agents tab */}
      {activePanelTab === 'subagents' && <SubagentsPanel />}

      {/* Session list (chats tab) */}
      {activePanelTab === 'chats' && <div className="flex-1 overflow-y-auto py-1">
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
              <SessionStatusDot sessionKey={s.key} />
              <span className="text-sm shrink-0" title={(s as any).channel ?? ''}>
                {channelIcon(s)}
              </span>
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
                onClick={(e) => { e.stopPropagation(); handleContextMenu(e, s.key); }}
              />
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            No sessions yet
          </div>
        )}
      </div>}

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
            { label: 'Rename', action: () => { const s = sessions.find(s => s.key === contextMenu.key); if (s) handleDoubleClick(s); }, danger: false },
            { label: 'Reset', action: () => resetSession(contextMenu.key), danger: true },
            { label: 'Delete', action: () => deleteSession(contextMenu.key), danger: true },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full text-left px-3 py-1.5 text-xs cursor-pointer transition-colors hover:opacity-80"
              style={{ color: item.danger ? 'var(--danger)' : 'var(--text-secondary)' }}
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
