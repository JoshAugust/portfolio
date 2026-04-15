import { useCapacity, useCron, useSessions } from '../../gateway';

// ─── Gauge color by utilization ratio ───────────────────────────────────────

function gaugeColor(ratio: number): string {
  if (ratio >= 1.0) return '#ef4444';  // red — full
  if (ratio >= 0.75) return '#FF5C00'; // corgi orange — high
  if (ratio >= 0.5) return '#eab308';  // yellow — mid
  return '#22c55e';                     // green — low
}

// ─── Individual gauge ────────────────────────────────────────────────────────

interface GaugeProps {
  label: string;
  current: number;
  max: number;
}

function Gauge({ label, current, max }: GaugeProps) {
  const ratio = max > 0 ? current / max : 0;
  const fillColor = gaugeColor(ratio);
  const pct = Math.min(ratio * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div
        className="rounded-full overflow-hidden"
        style={{ width: 56, height: 4, background: 'var(--border-subtle)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
      <span
        className="text-[10px] font-mono tabular-nums"
        style={{ color: 'var(--text-secondary)', minWidth: 28 }}
      >
        {current}/{max}
      </span>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div style={{ width: 1, height: 14, background: 'var(--border-subtle)', flexShrink: 0 }} />
  );
}

// ─── CapacityBar ─────────────────────────────────────────────────────────────

export function CapacityBar() {
  const { mainRuns, subAgents, sessions } = useCapacity();
  const { status: cronStatus } = useCron();

  const isCronActive = cronStatus?.enabled === true;

  return (
    <div
      className="flex items-center gap-3 px-4 shrink-0"
      style={{
        height: 32,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Active runs gauge */}
      <Gauge label="Active Runs" current={mainRuns.current} max={mainRuns.max} />

      <Divider />

      {/* Sub-agents gauge */}
      <Gauge label="Sub-Agents" current={subAgents.current} max={subAgents.max} />

      <Divider />

      {/* Session count */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Sessions
        </span>
        <span
          className="text-[10px] font-mono tabular-nums font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {sessions?.total ?? 0}
        </span>
      </div>

      <Divider />

      {/* Cron badge */}
      <div
        className="flex items-center gap-1 px-1.5 rounded"
        style={{
          height: 18,
          background: isCronActive
            ? 'rgba(34, 197, 94, 0.10)'
            : 'rgba(104, 104, 128, 0.08)',
          border: `1px solid ${isCronActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(104,104,128,0.15)'}`,
        }}
      >
        <span
          className="rounded-full"
          style={{
            width: 5,
            height: 5,
            background: isCronActive ? '#22c55e' : 'var(--text-muted)',
            flexShrink: 0,
          }}
        />
        <span
          className="text-[9px] font-medium uppercase tracking-wider"
          style={{ color: isCronActive ? '#22c55e' : 'var(--text-muted)' }}
        >
          Cron {isCronActive ? 'on' : 'off'}
        </span>
      </div>
    </div>
  );
}
