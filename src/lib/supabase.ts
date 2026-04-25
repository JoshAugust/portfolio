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

// ─── Row-ID-based sync (much more reliable than composite-key upsert) ─────────

/**
 * Insert a new row and return its numeric ID.
 * This is called ONCE at quiz start. All subsequent updates use PATCH by ID.
 */
export async function insertSubmission(
  sub: Omit<SupabaseSubmission, 'id' | 'created_at'>,
): Promise<number | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(restUrl(), {
        method: 'POST',
        headers: { ...HEADERS, Prefer: 'return=representation' },
        body: JSON.stringify(sub),
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0].id) {
          console.log('[supabase] Inserted row', rows[0].id);
          return rows[0].id as number;
        }
      }
      const body = await res.text();
      console.error(`[supabase] insert attempt ${attempt + 1} failed:`, res.status, body);
    } catch (err) {
      console.error(`[supabase] insert attempt ${attempt + 1} network error:`, err);
    }
    // Exponential backoff: 500ms, 1500ms, 3500ms
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (2 ** attempt)));
  }
  return null;
}

/** PATCH an existing row by its numeric ID. Retries up to 3 times on failure. */
async function patchById(
  id: number,
  data: Partial<Omit<SupabaseSubmission, 'id' | 'created_at'>>,
): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(restUrl(`?id=eq.${id}`), {
        method: 'PATCH',
        headers: { ...HEADERS, Prefer: 'return=minimal' },
        body: JSON.stringify(data),
      });
      if (res.ok) return true;
      const body = await res.text();
      console.error(`[supabase] patch attempt ${attempt + 1} failed:`, res.status, body);
    } catch (err) {
      console.error(`[supabase] patch attempt ${attempt + 1} network error:`, err);
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (2 ** attempt)));
  }
  return false;
}

/**
 * Serialized sync queue — ensures only one request flies at a time.
 * New data arriving while a request is in-flight overwrites the pending payload,
 * so the latest state always wins.
 */
let _rowId: number | null = null;
let _inFlight = false;
let _pending: Partial<Omit<SupabaseSubmission, 'id' | 'created_at'>> | null = null;

/** Set the Supabase row ID for the current quiz session. */
export function setActiveRowId(id: number | null): void {
  _rowId = id;
}

/** Get the current row ID (useful for debugging). */
export function getActiveRowId(): number | null {
  return _rowId;
}

async function _drainQueue(): Promise<void> {
  while (_pending) {
    const next = _pending;
    _pending = null;
    if (_rowId) {
      await patchById(_rowId, next);
    }
  }
  _inFlight = false;
}

/**
 * Queue an update to the current quiz row.
 * If no row ID is set yet, updates are silently dropped (the initial insert
 * will contain the full state anyway).
 */
export function syncUpdate(data: Partial<Omit<SupabaseSubmission, 'id' | 'created_at'>>): void {
  _pending = data; // always keep the latest
  if (!_inFlight) {
    _inFlight = true;
    _drainQueue().catch((err) => {
      console.error('[supabase] drain queue error:', err);
      _inFlight = false;
    });
  }
}

// ─── Legacy upsert (kept for migration and backward compat) ───────────────────

async function rawUpsert(sub: Omit<SupabaseSubmission, 'id' | 'created_at'>): Promise<void> {
  const res = await fetch(restUrl('?on_conflict=name,started_at'), {
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

// ─── Visibility-change re-sync ─────────────────────────────────────────────────

let _lastSyncData: Partial<Omit<SupabaseSubmission, 'id' | 'created_at'>> | null = null;

/** Store the latest full state for re-sync on visibility change. */
export function setLastSyncData(data: Partial<Omit<SupabaseSubmission, 'id' | 'created_at'>>): void {
  _lastSyncData = data;
}

/** Re-sync on tab visibility change (handles mobile backgrounding). */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && _rowId && _lastSyncData) {
      console.log('[supabase] Tab became visible — re-syncing');
      syncUpdate(_lastSyncData);
    }
  });
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

    for (const l of locals) {
      await rawUpsert(localToSupabase(l));
    }

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
