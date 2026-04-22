import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Target, Download, Trash2, Lock, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { section1Questions, section2Questions } from '../data/pokerQuestions';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SubmissionRecord {
  name: string;
  score: number;
  total: number;
  totalMs: number;
  avgMs: number;
  accuracy: number;
  completedAt: string;
  startedAt?: string;
  status?: 'in_progress' | 'completed'; // undefined = legacy completed
  questionsAnswered?: number;
  currentSection?: 'practice' | 'section1' | 'section2';
  answers: { questionId: number; correct: boolean; timeMs: number }[];
  // Section 2 responses (optional for backward compat with old submissions)
  section2?: { questionId: number; action: string; reasoning: string }[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'mbat-poker-submissions';
const SESSION_KEY = 'mbat-poker-admin-auth';
const ADMIN_PASSWORD = 'cjbsmbat';

// ─── Speed rating ──────────────────────────────────────────────────────────────
function getSpeedRating(avgMs: number): { label: string; color: string } {
  if (avgMs < 5000) return { label: 'Shark', color: '#4ade80' };
  if (avgMs < 10000) return { label: 'Reg', color: '#a3e635' };
  if (avgMs < 18000) return { label: 'Thinking Player', color: '#facc15' };
  return { label: 'Tank King', color: '#fb923c' };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── Sort submissions ──────────────────────────────────────────────────────────
function sortSubmissions(submissions: SubmissionRecord[]): SubmissionRecord[] {
  return [...submissions].sort((a, b) => {
    const aLive = a.status === 'in_progress' ? 1 : 0;
    const bLive = b.status === 'in_progress' ? 1 : 0;
    // In-progress sessions float to top
    if (aLive !== bLive) return bLive - aLive;
    // Then sort completed by score, then speed
    if (b.score !== a.score) return b.score - a.score;
    return a.totalMs - b.totalMs;
  });
}

// ─── Password gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onAuth();
    } else {
      setError('Incorrect password.');
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: '#12121a', border: '1px solid #2a2a3a' }}
      >
        <div className="flex items-center justify-center mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: '#1a472a', border: '1px solid #2d6a4f' }}
          >
            <Lock className="w-5 h-5" style={{ color: '#4ade80' }} />
          </div>
        </div>

        <h1 className="font-mono text-lg font-bold text-center mb-1" style={{ color: '#e8e8f0' }}>
          Admin Access
        </h1>
        <p className="font-mono text-xs text-center mb-8" style={{ color: '#686880' }}>
          MBAT Poker · Results Dashboard
        </p>

        <div className="flex flex-col gap-3">
          <input
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg font-mono text-sm outline-none"
            style={{
              background: '#0a0a0f',
              border: error ? '1px solid #ef4444' : '1px solid #2a2a3a',
              color: '#e8e8f0',
              caretColor: '#4ade80',
            }}
            autoFocus
          />
          {error && (
            <p className="font-mono text-xs" style={{ color: '#ef4444' }}>{error}</p>
          )}
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-3 rounded-lg font-mono text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: '#1a472a', border: '1px solid #2d6a4f', color: '#4ade80' }}
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Question title lookup ─────────────────────────────────────────────────────
const s1TitleMap = Object.fromEntries(section1Questions.map((q) => [q.id, q.title]));
const s2TitleMap = Object.fromEntries(section2Questions.map((q) => [q.id, q.title]));

// ─── Expandable submission detail ──────────────────────────────────────────────
function SubmissionDetail({ submission }: { submission: SubmissionRecord }) {
  return (
    <div className="px-4 py-4 flex flex-col gap-4" style={{ background: '#0d0d16' }}>
      {/* Section 1 answers */}
      <div>
        <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: '#686880' }}>
          Section 1 — Which Hand Wins
        </p>
        <div className="grid gap-2">
          {submission.answers.map((a, idx) => (
            <div
              key={a.questionId}
              className="flex items-center gap-3 px-3 py-2 rounded-lg"
              style={{ background: '#12121a', border: '1px solid #1a1a2a' }}
            >
              <span className="flex-shrink-0">
                {a.correct ? (
                  <CheckCircle className="w-4 h-4" style={{ color: '#4ade80' }} />
                ) : (
                  <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                )}
              </span>
              <span className="font-mono text-xs" style={{ color: '#686880' }}>
                Q{idx + 1}
              </span>
              <span className="font-mono text-xs flex-1" style={{ color: '#9898b0' }}>
                {s1TitleMap[a.questionId] || `Question ${a.questionId}`}
              </span>
              <span className="font-mono text-xs" style={{ color: '#686880' }}>
                {formatMs(a.timeMs)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 answers */}
      {submission.section2 && submission.section2.length > 0 && (
        <div>
          <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: '#686880' }}>
            Section 2 — What&apos;s Your Play?
          </p>
          <div className="grid gap-3">
            {submission.section2.map((s2, idx) => (
              <div
                key={s2.questionId}
                className="px-4 py-3 rounded-lg"
                style={{ background: '#12121a', border: '1px solid #1a1a2a' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-xs" style={{ color: '#686880' }}>
                    Q{idx + 1}
                  </span>
                  <span className="font-mono text-xs" style={{ color: '#9898b0' }}>
                    {s2TitleMap[s2.questionId] || `Question ${s2.questionId}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-0.5 rounded font-mono text-xs font-medium"
                    style={{
                      background:
                        s2.action === 'Fold' ? 'rgba(107,114,128,0.2)' :
                        s2.action === 'Call' ? 'rgba(96,165,250,0.2)' :
                        s2.action === 'Raise Small' ? 'rgba(250,204,21,0.2)' :
                        'rgba(239,68,68,0.2)',
                      color:
                        s2.action === 'Fold' ? '#9ca3af' :
                        s2.action === 'Call' ? '#60a5fa' :
                        s2.action === 'Raise Small' ? '#facc15' :
                        '#ef4444',
                      border: '1px solid',
                      borderColor:
                        s2.action === 'Fold' ? 'rgba(107,114,128,0.3)' :
                        s2.action === 'Call' ? 'rgba(96,165,250,0.3)' :
                        s2.action === 'Raise Small' ? 'rgba(250,204,21,0.3)' :
                        'rgba(239,68,68,0.3)',
                    }}
                  >
                    {s2.action}
                  </span>
                </div>
                {s2.reasoning && (
                  <p className="font-mono text-xs leading-relaxed" style={{ color: '#9898b0' }}>
                    &ldquo;{s2.reasoning}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin dashboard ───────────────────────────────────────────────────────────
function AdminDashboard() {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const loadSubmissions = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSubmissions(sortSubmissions(JSON.parse(raw)));
      } else {
        setSubmissions([]);
      }
    } catch {
      setSubmissions([]);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
    // Auto-refresh every 5 seconds to catch live updates
    const interval = setInterval(loadSubmissions, 5000);
    return () => clearInterval(interval);
  }, [loadSubmissions]);

  const handleClearAll = useCallback(() => {
    const confirmed = window.confirm(
      `Are you sure you want to delete all ${submissions.length} submission(s)? This cannot be undone.`
    );
    if (confirmed) {
      localStorage.removeItem(STORAGE_KEY);
      setSubmissions([]);
    }
  }, [submissions.length]);

  const handleExportCSV = useCallback(() => {
    if (submissions.length === 0) return;

    const headers = ['Rank', 'Name', 'Score', 'Accuracy (%)', 'Total Time (s)', 'Avg/Hand (s)', 'Speed Rating', 'Date'];
    const rows = submissions.map((s, i) => {
      const speed = getSpeedRating(s.avgMs);
      return [
        i + 1,
        `"${s.name.replace(/"/g, '""')}"`,
        `${s.score}/${s.total}`,
        s.accuracy,
        (s.totalMs / 1000).toFixed(1),
        (s.avgMs / 1000).toFixed(1),
        speed.label,
        `"${formatDate(s.completedAt)}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mbat-poker-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [submissions]);

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: '#0a0a0f', color: '#e8e8f0' }}>
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                to="/poker"
                className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest transition-colors hover:opacity-80"
                style={{ color: '#686880' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Link>
            </div>
            <h1 className="font-mono text-2xl font-bold" style={{ color: '#e8e8f0' }}>
              MBAT Poker
            </h1>
            <p className="font-mono text-xs mt-1" style={{ color: '#686880' }}>
              Results Dashboard · {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={submissions.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#12121a', border: '1px solid #2a2a3a', color: '#9898b0' }}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={handleClearAll}
              disabled={submissions.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          </div>
        </div>

        {/* Summary stats */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {(() => {
              const completed = submissions.filter((s) => s.status !== 'in_progress');
              const live = submissions.filter((s) => s.status === 'in_progress');
              const avgScore = completed.length > 0 ? completed.reduce((s, r) => s + r.score, 0) / completed.length : 0;
              const avgTime = completed.length > 0 ? completed.reduce((s, r) => s + r.avgMs, 0) / completed.length : 0;
              const topScore = completed.length > 0 ? Math.max(...completed.map((s) => s.score)) : 0;
              void live; // used for count below
              return [
                { icon: Trophy, label: 'Avg Score', value: `${avgScore.toFixed(1)}/10` },
                { icon: Clock, label: 'Avg Speed', value: formatMs(avgTime) },
                { icon: Target, label: 'Top Score', value: `${topScore}/10` },
              ];
            })().map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 rounded-xl py-4"
                style={{ background: '#12121a', border: '1px solid #2a2a3a' }}
              >
                <Icon className="w-4 h-4 mb-1" style={{ color: '#686880' }} />
                <span className="font-mono text-xs" style={{ color: '#686880' }}>{label}</span>
                <span className="font-mono text-base font-medium" style={{ color: '#e8e8f0' }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {submissions.length === 0 ? (
          <div
            className="rounded-xl p-12 flex flex-col items-center gap-3"
            style={{ background: '#12121a', border: '1px solid #2a2a3a' }}
          >
            <p className="font-mono text-sm" style={{ color: '#686880' }}>No submissions yet.</p>
            <p className="font-mono text-xs" style={{ color: '#686880' }}>
              Results will appear here after players complete the quiz.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid #2a2a3a' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#12121a', borderBottom: '1px solid #2a2a3a' }}>
                    {['', '#', 'Name', 'Status', 'Score', 'Accuracy', 'Total Time', 'Avg/Hand', 'Speed Rating', 'Date'].map((h) => (
                      <th
                        key={h || 'expand'}
                        className="px-4 py-3 text-left text-xs uppercase tracking-widest"
                        style={{ color: '#686880', whiteSpace: 'nowrap' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => {
                    const speed = getSpeedRating(s.avgMs);
                    const isTop = i === 0;
                    const isExpanded = expandedIdx === i;
                    return (
                      <>
                        <tr
                          key={`${s.name}-${s.completedAt}`}
                          onClick={() => setExpandedIdx(isExpanded ? null : i)}
                          className="cursor-pointer transition-colors"
                          style={{
                            background: isExpanded ? '#12121a' : i % 2 === 0 ? '#0a0a0f' : '#0d0d14',
                            borderBottom: isExpanded ? 'none' : '1px solid #1a1a2a',
                          }}
                        >
                          <td className="px-4 py-3 w-8">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" style={{ color: '#686880' }} />
                            ) : (
                              <ChevronDown className="w-4 h-4" style={{ color: '#686880' }} />
                            )}
                          </td>
                          <td className="px-4 py-3" style={{ color: isTop ? '#4ade80' : '#686880' }}>
                            {isTop ? '🏆' : i + 1}
                          </td>
                          <td className="px-4 py-3 font-medium" style={{ color: '#e8e8f0', whiteSpace: 'nowrap' }}>
                            {s.name}
                          </td>
                          <td className="px-4 py-3">
                            {s.status === 'in_progress' ? (
                              <span
                                className="px-2 py-0.5 rounded font-mono text-xs font-medium"
                                style={{
                                  background: 'rgba(250,204,21,0.15)',
                                  color: '#facc15',
                                  border: '1px solid rgba(250,204,21,0.3)',
                                }}
                              >
                                LIVE · {s.currentSection === 'practice' ? 'Practice' : s.currentSection === 'section2' ? `S2 Q${s.section2?.length ?? 0}/3` : `Q${s.questionsAnswered ?? 0}/10`}
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded font-mono text-xs font-medium"
                                style={{
                                  background: 'rgba(74,222,128,0.15)',
                                  color: '#4ade80',
                                  border: '1px solid rgba(74,222,128,0.3)',
                                }}
                              >
                                Done
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              style={{
                                color: s.status === 'in_progress' ? '#686880' : s.score >= 8 ? '#4ade80' : s.score >= 5 ? '#facc15' : '#ef4444',
                                fontWeight: 600,
                              }}
                            >
                              {s.status === 'in_progress' ? `${s.score}/?` : `${s.score}/${s.total}`}
                            </span>
                          </td>
                          <td className="px-4 py-3" style={{ color: '#9898b0' }}>
                            {s.accuracy}%
                          </td>
                          <td className="px-4 py-3" style={{ color: '#9898b0' }}>
                            {formatMs(s.totalMs)}
                          </td>
                          <td className="px-4 py-3" style={{ color: '#9898b0' }}>
                            {formatMs(s.avgMs)}
                          </td>
                          <td className="px-4 py-3">
                            <span style={{ color: speed.color }}>{speed.label}</span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: '#686880', whiteSpace: 'nowrap' }}>
                            {s.status === 'in_progress'
                              ? `Started ${formatDate(s.startedAt || '')}`
                              : formatDate(s.completedAt)}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${s.name}-${s.completedAt}-detail`}>
                            <td colSpan={10} style={{ padding: 0, borderBottom: '1px solid #2a2a3a' }}>
                              <SubmissionDetail submission={s} />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function PokerAdmin() {
  const [authed, setAuthed] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  });

  const handleAuth = useCallback(() => {
    setAuthed(true);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0', fontFamily: 'inherit' }}>
      {authed ? <AdminDashboard /> : <PasswordGate onAuth={handleAuth} />}
    </div>
  );
}
