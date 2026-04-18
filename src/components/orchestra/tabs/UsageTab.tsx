import { useEffect, useRef } from 'react';
import { DollarSign, Zap, BarChart3, RefreshCw } from 'lucide-react';
import { useUsage } from '../../../gateway';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function UsageBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ color: 'var(--text-secondary)' }}>{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'var(--corgi-orange)' }}
        />
      </div>
    </div>
  );
}

export function UsageTab() {
  const { usage, cost, refresh } = useUsage();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  // Parse cost data — handle various response shapes from usage.cost / usage.status
  const totalCost = cost?.totalCost ?? cost?.total ?? cost?.cost ?? null;
  const models = (cost?.models ?? cost?.breakdown ?? cost?.perModel ?? []) as Array<Record<string, unknown>>;

  // Parse usage data — handle both sessions.usage and usage.status response shapes
  const inputTokens = (usage?.inputTokens ?? usage?.input ?? usage?.tokensIn ?? 0) as number;
  const outputTokens = (usage?.outputTokens ?? usage?.output ?? usage?.tokensOut ?? 0) as number;
  const totalTokens = (usage?.totalTokens as number | undefined) ?? inputTokens + outputTokens;
  const requestCount = (usage?.requests ?? usage?.requestCount ?? usage?.calls ?? null) as number | null;

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5" style={{ color: 'var(--corgi-orange)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Usage & Cost</span>
        </div>
        <button
          onClick={refresh}
          className="p-1 rounded cursor-pointer transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Cost Summary */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Cost Summary</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Total Spend"
            value={totalCost != null ? `$${Number(totalCost).toFixed(4)}` : '—'}
          />
          <StatCard
            label="Total Tokens"
            value={totalTokens > 0 ? totalTokens.toLocaleString() : '—'}
            sub={requestCount != null ? `${requestCount} requests` : undefined}
          />
        </div>
      </div>

      {/* Session Usage */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Session Tokens</span>
        </div>
        <div className="space-y-2 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
          {totalTokens > 0 ? (
            <>
              <UsageBar label="Input" value={inputTokens} max={totalTokens} />
              <UsageBar label="Output" value={outputTokens} max={totalTokens} />
            </>
          ) : (
            <div className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>No token data available</div>
          )}
        </div>
      </div>

      {/* Per-Model Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Per-Model Breakdown</span>
        </div>
        {Array.isArray(models) && models.length > 0 ? (
          <div className="space-y-1">
            {models.map((m, i) => {
              const name = (m.model ?? m.name ?? `Model ${i + 1}`) as string;
              const mCost = (m.cost ?? m.totalCost ?? 0) as number;
              const mTokens = ((m.inputTokens ?? 0) as number) + ((m.outputTokens ?? 0) as number);
              return (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                  <span className="text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{name}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    {mTokens > 0 && (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{mTokens.toLocaleString()} tok</span>
                    )}
                    <span className="text-xs font-medium" style={{ color: 'var(--corgi-orange)' }}>${Number(mCost).toFixed(4)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-center py-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
            No per-model data available
          </div>
        )}
      </div>

      <div className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
        Auto-refreshes every 30s
      </div>
    </div>
  );
}
