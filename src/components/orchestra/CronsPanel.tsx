import { useEffect, useState } from 'react';
import { useCron, useCronRunHistory } from '../../gateway';
import type { CronJob, CronRunEntry } from '../../gateway';

function timeAgo(dateStr?: string): string {
  if (!dateStr) return 'never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function StatusDot({ status }: { status?: string }) {
  const color =
    status === 'success' || status === 'ok'
      ? '#22c55e'
      : status === 'error' || status === 'failed'
        ? '#ef4444'
        : 'var(--text-muted)';
  return (
    <span
      className="w-2 h-2 rounded-full inline-block shrink-0"
      style={{ background: color }}
    />
  );
}

function CronJobRow({
  job,
  expanded,
  onToggle,
  runs,
}: {
  job: CronJob;
  expanded: boolean;
  onToggle: () => void;
  runs: CronRunEntry[];
}) {
  return (
    <div>
      <div
        onClick={onToggle}
        className="flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-md cursor-pointer transition-colors hover:opacity-80"
        style={{
          background: expanded ? 'var(--bg-tertiary)' : 'transparent',
          borderLeft: expanded ? '2px solid var(--corgi-orange)' : '2px solid transparent',
        }}
      >
        <StatusDot status={runs[0]?.status} />
        <span className="text-sm shrink-0">⏰</span>
        <div className="flex-1 min-w-0">
          <div
            className="text-xs truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {job.label ?? job.id}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {job.schedule}
            {job.lastRun ? ` · ${timeAgo(job.lastRun)}` : ''}
          </div>
        </div>
        <span
          className="text-[9px] font-medium uppercase tracking-wider px-1.5 rounded"
          style={{
            color: job.enabled ? '#22c55e' : 'var(--text-muted)',
            background: job.enabled ? 'rgba(34, 197, 94, 0.10)' : 'rgba(104,104,128,0.08)',
            border: `1px solid ${job.enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(104,104,128,0.15)'}`,
          }}
        >
          {job.enabled ? 'on' : 'off'}
        </span>
      </div>

      {/* Expanded run history */}
      {expanded && (
        <div className="mx-3 mb-2 ml-8">
          {runs.length === 0 ? (
            <div className="text-[10px] py-1.5 px-2" style={{ color: 'var(--text-muted)' }}>
              No recent runs
            </div>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className="flex items-center gap-2 py-1 px-2 text-[10px] rounded"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-primary)',
                  marginTop: 2,
                }}
              >
                <StatusDot status={run.status} />
                <span className="truncate flex-1">
                  {run.status ?? 'unknown'}
                  {run.error ? ` — ${run.error}` : ''}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {timeAgo(run.finishedAt ?? run.startedAt)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function CronsPanel() {
  const { jobs, refreshCron } = useCron();
  const { cronRunHistory, refreshCronRunHistory } = useCronRunHistory();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Load cron jobs on mount
  useEffect(() => {
    refreshCron();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load run history when a job is expanded
  useEffect(() => {
    if (expandedJob) {
      refreshCronRunHistory(expandedJob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedJob]);

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {jobs.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          No cron jobs configured
        </div>
      ) : (
        jobs.map((job) => (
          <CronJobRow
            key={job.id}
            job={job}
            expanded={expandedJob === job.id}
            onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
            runs={cronRunHistory.get(job.id) ?? []}
          />
        ))
      )}
    </div>
  );
}
