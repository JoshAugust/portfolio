import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, MessageSquare } from 'lucide-react';
import { useSearch, useSessions } from '../../gateway';

// ─── Result item type ─────────────────────────────────────────────────────

interface SearchResult {
  sessionKey?: string;
  sessionLabel?: string;
  messagePreview?: string;
  timestamp?: string;
  [key: string]: unknown;
}

function timeLabel(ts?: string): string {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── SearchBar ─────────────────────────────────────────────────────────────

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { search, results, loading } = useSearch();
  const { switchSession } = useSessions();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    debounceRef.current = setTimeout(() => {
      search(val);
    }, 300);
  }, [search]);

  const handleClear = useCallback(() => {
    setQuery('');
    setIsOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    if (result.sessionKey) {
      switchSession(result.sessionKey);
    }
    setIsOpen(false);
    setQuery('');
  }, [switchSession]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const typedResults = results as SearchResult[];

  return (
    <div ref={containerRef} className="relative px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      {/* Input */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-md"
        style={{
          background: 'var(--bg-primary)',
          border: `1px solid ${isOpen ? 'var(--corgi-orange)' : 'var(--border-subtle)'}`,
        }}
      >
        <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (query.trim() && results.length > 0) setIsOpen(true); }}
          placeholder="Search sessions…"
          className="flex-1 text-xs bg-transparent outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        {query && (
          <button onClick={handleClear} className="shrink-0 cursor-pointer hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div
          className="absolute left-3 right-3 top-full mt-1 rounded-lg shadow-lg z-50 overflow-hidden"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {loading && (
            <div className="px-3 py-2 text-xs text-center" style={{ color: 'var(--text-muted)' }}>Searching…</div>
          )}

          {!loading && typedResults.length === 0 && query.trim() && (
            <div className="px-3 py-2 text-xs text-center" style={{ color: 'var(--text-muted)' }}>No results for "{query}"</div>
          )}

          {!loading && typedResults.map((r, i) => (
            <button
              key={i}
              onClick={() => handleResultClick(r)}
              className="w-full text-left px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ borderBottom: i < typedResults.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--corgi-orange)' }} />
                <span className="text-xs truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
                  {r.sessionLabel ?? r.sessionKey ?? 'Unknown session'}
                </span>
                {r.timestamp && (
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {timeLabel(r.timestamp)}
                  </span>
                )}
              </div>
              {r.messagePreview && (
                <div className="text-[10px] mt-0.5 truncate ml-5" style={{ color: 'var(--text-muted)' }}>
                  {r.messagePreview}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
