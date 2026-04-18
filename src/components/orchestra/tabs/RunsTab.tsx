import { useEffect, useState, useMemo } from 'react';
import { Activity, Clock, AlertCircle, CheckCircle2, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useSessions, useCron, useGatewayStore } from '../../../gateway';

function statusDot(status?: string) {
  const colors: Record<string, string> = {
    running: 'var(--success)',
    success: 'var(--success)',
    finished: 'var(--success)',
    error: 'var(--danger)',
    failed: 'var(--danger)',
    pending: 'var(--warning)',
  };
  const color = colors[status ?? ''] ?? 'var(--text-muted)';
  return <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: color }} />;
}

function statusBadge(status?: string) {
  const config: Record<string, { bg: string; color: string; icon: typeof CheckCircle2 }> = {
    success: { bg: 'rgba(34,197,94,0.1)', color: 'var(--success)', icon: CheckCircle2 },
    finished: { bg: 'rgba(34,197,94,0.1)', color: 'var(--success)', icon: CheckCircle2 },
    error: { bg: 'rgba(239,68,68,0.1)', color: 'var(--danger)', icon: AlertCircle },
    failed: { bg: 'rgba(239,68,68,0.1)', color: 'var(--danger)', icon: AlertCircle },
    running: { bg: 'rgba(234,179,8,0.1)', color: 'var(--warning)', icon: Loader2 },
  };
  const c = config[status ?? ''] ?? { bg: 'var(--bg-tertiary)', color: 'var(--text-muted)', icon: Clock };
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]" style={{ background: c.bg, color: c.color }}>
      <Icon className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`} />
      {status ?? 'unknown'}
    </span>
  );
}

function isRecentlyCreated(s: { createdAt?: string; updatedAt?: string }): boolean {
  const ts = s.updatedAt ?? s.createdAt;
  if (!ts) return false;
  const diff = Date.now() - new Date(ts).getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
}

export function RunsTab() {
  const { sessions } = useSessions();
  const { runs, refreshCronRuns } = useCron();
  const activeRunKeys = useGatewayStore((s) => s.activeRunKeys);
  const [recentOpen, setRecentOpen] = useState(false);

  useEffect(() => {
    refreshCronRuns({ limit: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only show sessions that are actually running (not all sessions)
  const allMain = sessions.filter((s) => !s.key.includes('subagent'));
  const subAgents = sessions.filter((s) => s.key.includes('subagent'));
  
  // A session is "running" if it's in the activeRunKeys set (tracked from real agent events)
  // or was very recently updated (within 60s)
  const mainRuns = allMain.filter((s) => {
    if (activeRunKeys.has(s.key)) return true;
    const ts = s.updatedAt;
    if (ts) {
      const age = Date.now() - new Date(ts).getTime();
      return age < 60_000;
    }
    return false;
  });

  // Split sub-agents into Active and Recent
  const { activeSubAgents, recentSubAgents } = useMemo(() => {
    const active: typeof subAgents = [];
    const recent: typeof subAgents = [];

    for (const s of subAgents) {
      const isRunning = activeRunKeys.has(s.key) || isRecentlyCreated(s);
      if (isRunning) {
        active.push(s);
      } else {
        recent.push(s);
      }
    }

    // Sort recent by updatedAt descending, cap at 20
    recent.sort((a, b) => {
      const ta = String(a.updatedAt ?? a.createdAt ?? '');
      const tb = String(b.updatedAt ?? b.createdAt ?? '');
      return tb.localeCompare(ta);
    });

    return { activeSubAgents: active, recentSubAgents: recent.slice(0, 20) };
  }, [subAgents, activeRunKeys]);

  return (
    <div className="p-3 space-y-4">
      {/* Active Runs */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-3.5 h-3.5" style={{ color: 'var(--corgi-orange)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Active Runs ({mainRuns.length})
          </span>
        </div>
        {mainRuns.length === 0 ? (
          <div className="text-xs px-2 py-3 text-center" style={{ color: 'var(--text-muted)' }}>No active runs</div>
        ) : (
          <div className="space-y-1">
            {mainRuns.slice(0, 10).map((s) => (
              <div key={s.key} className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                {statusDot('running')}
                <span className="text-xs truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
                  {s.label ?? (s as any).subject ?? s.key.split(':').pop()}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="text-[10px] px-2 mt-1" style={{ color: 'var(--text-muted)' }}>
          {allMain.length} total sessions · {subAgents.length} sub-agents
        </div>
      </div>

      {/* Active Sub-agents */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Active Sub-agents ({activeSubAgents.length})
          </span>
        </div>
        {activeSubAgents.length === 0 ? (
          <div className="text-xs px-2 py-3 text-center" style={{ color: 'var(--text-muted)' }}>No active sub-agents</div>
        ) : (
          <div className="space-y-1">
            {activeSubAgents.map((s) => (
              <div key={s.key} className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                {statusDot('running')}
                <span className="text-xs truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
                  {s.label ?? s.key.split(':').pop()?.slice(0, 8)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Sub-agents (collapsed) */}
      {recentSubAgents.length > 0 && (
        <div>
          <button
            onClick={() => setRecentOpen(!recentOpen)}
            className="flex items-center gap-2 mb-2 cursor-pointer w-full"
          >
            {recentOpen ? (
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            )}
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Recent Sub-agents ({recentSubAgents.length})
            </span>
          </button>
          {recentOpen && (
            <div className="space-y-1">
              {recentSubAgents.map((s) => (
                <div key={s.key} className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                  {statusDot((s as any).status)}
                  <span className="text-xs truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
                    {s.label ?? s.key.split(':').pop()?.slice(0, 8)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Cron Runs */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Recent Cron Runs
          </span>
        </div>
        {runs.length === 0 ? (
          <div className="text-xs px-2 py-3 text-center" style={{ color: 'var(--text-muted)' }}>No recent runs</div>
        ) : (
          <div className="space-y-1">
            {runs.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {r.scope ?? r.jobId ?? r.id.slice(0, 8)}
                </span>
                {statusBadge(r.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
