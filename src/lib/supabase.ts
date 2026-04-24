// ─── Supabase REST helpers (no SDK — just fetch) ──────────────────────────────
const SUPABASE_URL = 'https://yneylmouahusugiwgjek.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZXlsbW91YWh1c3VnaXdnamVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzIyMTAsImV4cCI6MjA5MjYwODIxMH0.jdf4xeu8vZJfL82zqMh6moMVQ9fG3r2AhJfyZWXybMg';

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const TABLE = 'poker_submissions';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface SupabaseSubmission {
  id?: number;
  name: string;
  score: number;
  total: number;
  total_ms: number;
  avg_ms: number;
  accuracy: number;
  completed_at: string | null;
  started_at: string | null;
  status: 'in_progress' | 'completed';
  questions_answered: number;
  current_section: string | null;
  answers: { questionId: number; correct: boolean; timeMs: number }[];
  section2: { questionId: number; action: string; reasoning: string }[];
  created_at?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function restUrl(query = ''): string {
  return `${SUPABASE_URL}/rest/v1/${TABLE}${query}`;
}

/** Fetch all submissions (for admin view). */
export async function fetchAllSubmissions(): Promise<SupabaseSubmission[]> {
  const res = await fetch(restUrl('?select=*&order=created_at.desc'), { headers: HEADERS });
  if (!res.ok) throw new Error(`Supabase GET failed: ${res.status}`);
  return res.json();
}

/** Upsert a submission (insert or update by name + started_at). */
export async function upsertSubmission(sub: Omit<SupabaseSubmission, 'id' | 'created_at'>): Promise<void> {
  const res = await fetch(restUrl(''), {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(sub),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('[supabase] upsert failed:', res.status, body);
  }
}

/** Check if a name already has a completed submission. */
export async function hasCompletedSubmission(name: string): Promise<boolean> {
  const res = await fetch(
    restUrl(`?name=eq.${encodeURIComponent(name)}&status=eq.completed&select=id&limit=1`),
    { headers: HEADERS },
  );
  if (!res.ok) return false;
  const rows = await res.json();
  return rows.length > 0;
}

// ─── LocalStorage → Supabase migration ────────────────────────────────────────

const STORAGE_KEY = 'mbat-poker-submissions';
const MIGRATED_KEY = 'mbat-poker-migrated-to-supabase';

interface LocalSubmission {
  name: string;
  score: number;
  total: number;
  totalMs: number;
  avgMs: number;
  accuracy: number;
  completedAt: string;
  startedAt?: string;
  status?: 'in_progress' | 'completed';
  questionsAnswered?: number;
  currentSection?: string;
  answers: { questionId: number; correct: boolean; timeMs: number }[];
  section2?: { questionId: number; action: string; reasoning: string }[];
}

function localToSupabase(local: LocalSubmission): Omit<SupabaseSubmission, 'id' | 'created_at'> {
  return {
    name: local.name,
    score: local.score,
    total: local.total,
    total_ms: local.totalMs,
    avg_ms: local.avgMs,
    accuracy: local.accuracy,
    completed_at: local.completedAt || null,
    started_at: local.startedAt || null,
    status: local.status === 'in_progress' ? 'in_progress' : 'completed',
    questions_answered: local.questionsAnswered ?? local.answers.length,
    current_section: local.currentSection ?? null,
    answers: local.answers,
    section2: local.section2 ?? [],
  };
}

/**
 * One-time migration: pushes all localStorage submissions to Supabase.
 * Safe to call multiple times — skips if already migrated.
 */
export async function migrateLocalStorageToSupabase(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MIGRATED_KEY)) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATED_KEY, '1');
      return;
    }

    const locals: LocalSubmission[] = JSON.parse(raw);
    if (locals.length === 0) {
      localStorage.setItem(MIGRATED_KEY, '1');
      return;
    }

    // Push each to Supabase (upsert, so duplicates are fine)
    await Promise.all(locals.map((l) => upsertSubmission(localToSupabase(l))));

    localStorage.setItem(MIGRATED_KEY, '1');
    console.log(`[supabase] Migrated ${locals.length} local submission(s)`);
  } catch (err) {
    console.error('[supabase] Migration failed (will retry next visit):', err);
  }
}

// ─── Convenience: convert Supabase row → local format (for admin display) ────
export function supabaseToLocal(row: SupabaseSubmission): LocalSubmission {
  return {
    name: row.name,
    score: row.score,
    total: row.total,
    totalMs: row.total_ms,
    avgMs: row.avg_ms,
    accuracy: row.accuracy,
    completedAt: row.completed_at ?? '',
    startedAt: row.started_at ?? undefined,
    status: row.status,
    questionsAnswered: row.questions_answered,
    currentSection: row.current_section ?? undefined,
    answers: row.answers,
    section2: row.section2,
  };
}
