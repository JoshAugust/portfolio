import { useState, useCallback, useEffect } from 'react';
import { Settings2, ChevronDown, ChevronRight, AlertTriangle, Save, X, RefreshCw } from 'lucide-react';
import { useConfig } from '../../gateway';

// ─── Schema Reference ─────────────────────────────────────────────────────

function SchemaReference({ schema }: { schema: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);
  if (!schema) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full text-[10px] cursor-pointer hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Config Schema Reference
      </button>
      {open && (
        <pre
          className="mt-1 p-2 rounded text-[9px] overflow-x-auto overflow-y-auto font-mono"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            maxHeight: 160,
          }}
        >
          {JSON.stringify(schema, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─── Config Editor ────────────────────────────────────────────────────────

export function ConfigEditor() {
  const { config, schema, loading, error, refresh, save } = useConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    setSaveError(null);
    setSaveSuccess(false);
    setParseError(null);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (config && isOpen) {
      setEditText(JSON.stringify(config, null, 2));
    }
  }, [config, isOpen]);

  const handleTextChange = useCallback((val: string) => {
    setEditText(val);
    setParseError(null);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      JSON.parse(val);
    } catch (e) {
      setParseError((e as Error).message);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (parseError) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(editText);
    } catch (e) {
      setParseError((e as Error).message);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await save(parsed);
      setSaveSuccess(true);
      // Gateway restarts — connection will drop
      setTimeout(() => setIsOpen(false), 1500);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [editText, parseError, save]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setEditText('');
    setParseError(null);
    setSaveError(null);
    setSaveSuccess(false);
  }, []);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <Settings2 className="w-3.5 h-3.5" style={{ color: 'var(--corgi-orange)' }} />
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Config</span>
        {isOpen && (
          <button
            onClick={() => { refresh(); }}
            className="ml-auto p-0.5 rounded cursor-pointer hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            title="Reload config"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      {!isOpen ? (
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs cursor-pointer transition-colors hover:opacity-80"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
        >
          <Settings2 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          Edit Config
        </button>
      ) : (
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
        >
          {/* Warning banner */}
          <div
            className="flex items-start gap-2 px-2 py-2 rounded-md text-[10px]"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>⚠️ Saving will restart the gateway. Connection will drop briefly.</span>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>Loading config…</div>
          )}

          {/* Fetch error */}
          {error && !loading && (
            <div className="text-[10px] px-2 py-1 rounded" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)' }}>
              Failed to load: {error}
            </div>
          )}

          {/* Editor */}
          {!loading && (
            <>
              <textarea
                value={editText}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={12}
                className="w-full text-[10px] p-2 rounded font-mono resize-y"
                style={{
                  background: 'var(--bg-primary)',
                  color: parseError ? 'var(--danger)' : 'var(--text-secondary)',
                  border: `1px solid ${parseError ? 'var(--danger)' : 'var(--border-subtle)'}`,
                  minHeight: 120,
                  maxHeight: 320,
                  outline: 'none',
                }}
                placeholder="Loading config…"
                spellCheck={false}
              />

              {parseError && (
                <div className="text-[10px] px-2 py-1 rounded" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)' }}>
                  JSON error: {parseError}
                </div>
              )}

              {saveError && (
                <div className="text-[10px] px-2 py-1 rounded" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)' }}>
                  Save failed: {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="text-[10px] px-2 py-1 rounded" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)' }}>
                  ✓ Applied — gateway restarting…
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1.5">
                <button
                  onClick={handleSave}
                  disabled={saving || !!parseError || !editText}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium cursor-pointer hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                >
                  <Save className="w-3 h-3" />
                  {saving ? 'Saving…' : 'Save & Apply'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium cursor-pointer hover:opacity-80"
                  style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>

              {/* Schema reference */}
              <SchemaReference schema={schema} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
