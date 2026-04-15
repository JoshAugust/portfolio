import { useEffect } from 'react';
import { Activity, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useSessions, useCron } from '../../../gateway';

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

export function RunsTab() {
  const { sessions } = useSessions();
  const { runs, refreshCronRuns } = useCron();

  useEffect(() => {
    refreshCronRuns({ limit: 10 });
  }, [refreshCronRuns]);

  const mainRuns = sessions.filter((s) => !s.key.includes('subagent'));
  const subAgents = sessions.filter((s) => s.key.includes('subagent'));

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
                  {s.label ?? s.key.split(':').pop()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sub-agents */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Sub-agents ({subAgents.length})
          </span>
        </div>
        {subAgents.length === 0 ? (
          <div className="text-xs px-2 py-3 text-center" style={{ color: 'var(--text-muted)' }}>No sub-agents</div>
        ) : (
          <div className="space-y-1">
            {subAgents.slice(0, 10).map((s) => (
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
