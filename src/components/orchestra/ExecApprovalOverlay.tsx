import { useEffect } from 'react';
import { ShieldAlert, Check, CheckCheck, X } from 'lucide-react';
import { useExecApprovals } from '../../gateway';

export function ExecApprovalOverlay() {
  const { approvals, resolve, refresh } = useExecApprovals();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (approvals.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 400,
        maxHeight: '50vh',
        overflowY: 'auto',
      }}
    >
      {approvals.map((approval, i) => {
        const id = (approval.id ?? `approval-${i}`) as string;
        const command = (approval.command ?? approval.script ?? '(unknown command)') as string;
        const sessionKey = approval.sessionKey as string | undefined;

        return (
          <div
            key={id}
            className="rounded-lg shadow-lg"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--corgi-orange)',
              padding: 12,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4" style={{ color: 'var(--corgi-orange)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--corgi-orange)' }}>Exec Approval Required</span>
            </div>

            {/* Session info */}
            {sessionKey && (
              <div className="text-[10px] mb-1.5 truncate" style={{ color: 'var(--text-muted)' }}>
                Session: {sessionKey}
              </div>
            )}

            {/* Command */}
            <pre
              className="text-[11px] p-2 rounded-md overflow-x-auto max-h-24 overflow-y-auto mb-3"
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {command}
            </pre>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => resolve(id, 'allow-once')}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
              >
                <Check className="w-3 h-3" />
                Once
              </button>
              <button
                onClick={() => resolve(id, 'allow-always')}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}
              >
                <CheckCheck className="w-3 h-3" />
                Always
              </button>
              <button
                onClick={() => resolve(id, 'deny')}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <X className="w-3 h-3" />
                Deny
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
