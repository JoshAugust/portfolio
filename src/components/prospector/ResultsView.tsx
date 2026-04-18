import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair,
  Users,
  Star,
  TrendingUp,
  Mail,
  Copy,
  Send,
  ChevronDown,
  ChevronUp,
  Search,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { useProspectorStore } from '@/stores/prospectorStore';
import type { PipelineItem } from '@/types/prospector';

// ─── Color mapping ────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  'violet-500': '#8B5CF6',
  'blue-500': '#3B82F6',
  'rose-500': '#F43F5E',
  'amber-500': '#F59E0B',
  'cyan-500': '#06B6D4',
  'emerald-500': '#10B981',
  'indigo-500': '#6366F1',
  'orange-500': '#F97316',
  'teal-500': '#14B8A6',
  'lime-500': '#84CC16',
  'red-500': '#EF4444',
  'fuchsia-500': '#D946EF',
  'sky-500': '#0EA5E9',
  'purple-500': '#A855F7',
  'yellow-500': '#EAB308',
  'zinc-500': '#71717A',
  'stone-500': '#78716C',
  'blue-400': '#60A5FA',
  'emerald-400': '#34D399',
  'violet-400': '#A78BFA',
};

function resolveColor(color: string): string {
  return COLOR_MAP[color] ?? '#6366F1';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function redactEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  const stars = '*'.repeat(Math.max(local.length - 2, 3));
  return `${visible}${stars}@${domain}`;
}

function scoreColor(score: number): string {
  if (score >= 70) return '#22C55E';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

function gradeBadgeStyle(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'B': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'C': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:  return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      <svg width="40" height="40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

// ─── Animated number ─────────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {value}
    </motion.span>
  );
}

// ─── Summary stat card ───────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor?: string;
}

function StatCard({ label, value, icon, accentColor }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/50 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white" style={accentColor ? { color: accentColor } : {}}>
            <AnimatedNumber value={value} />
          </p>
        </div>
        <div className="text-white/30">{icon}</div>
      </div>
    </div>
  );
}

// ─── Outreach panel ───────────────────────────────────────────────────────────
interface OutreachPanelProps {
  subject: string;
  body: string;
  personalizationScore: number;
  contactName: string;
}

function OutreachPanel({ subject, body, personalizationScore, contactName }: OutreachPanelProps) {
  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`).then(() => {
      toast.success('Email copied to clipboard');
    });
  }

  function handleSend() {
    toast.success(`Draft sent to ${contactName}'s inbox`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="mt-4 pt-4 border-t border-white/10">
        {/* Personalization score */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/50">AI Personalization</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${personalizationScore}%` }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
              />
            </div>
            <span className="text-xs font-semibold text-violet-300">{personalizationScore}%</span>
          </div>
        </div>

        {/* Subject */}
        <div className="mb-2">
          <p className="text-xs text-white/40 mb-0.5">Subject</p>
          <p className="text-xs text-white/80 font-medium leading-relaxed">{subject}</p>
        </div>

        {/* Body */}
        <div className="mb-4">
          <p className="text-xs text-white/40 mb-0.5">Body</p>
          <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line line-clamp-6">{body}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
          >
            <Copy size={12} />
            Copy
          </button>
          <button
            onClick={handleSend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            <Send size={12} />
            Send Draft
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Lead card ────────────────────────────────────────────────────────────────
interface LeadCardProps {
  item: PipelineItem;
  index: number;
}

function LeadCard({ item, index }: LeadCardProps) {
  const [outreachOpen, setOutreachOpen] = useState(false);
  const { company, contact, outreach } = item;
  const avatarColor = resolveColor(company.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex flex-col gap-3"
    >
      {/* Header: avatar + name + grade + score */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: avatarColor + '33', border: `2px solid ${avatarColor}66` }}
          >
            <span style={{ color: avatarColor }}>{company.name[0]}</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{company.name}</h3>
            <p className="text-[11px] text-white/40 truncate">{company.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${gradeBadgeStyle(company.grade)}`}>
            {company.grade}
          </span>
          <ScoreRing score={company.icpScore} />
        </div>
      </div>

      {/* Industry tag */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-white/60">
          {company.industry}
        </span>
      </div>

      {/* Company meta */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] text-white/50">
          <Users size={10} className="flex-shrink-0" />
          <span>{company.employees} employees</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/50">
          <DollarSign size={10} className="flex-shrink-0" />
          <span>{company.revenue}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/50">
          <Calendar size={10} className="flex-shrink-0" />
          <span>Founded {company.founded}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/50">
          <MapPin size={10} className="flex-shrink-0" />
          <span className="truncate">{company.city}, {company.state}</span>
        </div>
      </div>

      {/* Tech stack chips */}
      {company.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {company.techStack.slice(0, 5).map((tech) => (
            <span key={tech} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-white/40">
              {tech}
            </span>
          ))}
          {company.techStack.length > 5 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-white/30">
              +{company.techStack.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Signal badges */}
      {company.signals.length > 0 && (
        <div className="flex flex-col gap-1">
          {company.signals.slice(0, 2).map((signal, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] mt-px">
                {signal.toLowerCase().includes('fund') || signal.toLowerCase().includes('raise') ? '🔥' :
                 signal.toLowerCase().includes('hir') ? '📢' :
                 signal.toLowerCase().includes('partner') ? '🤝' :
                 signal.toLowerCase().includes('launch') || signal.toLowerCase().includes('ship') ? '🚀' : '📊'}
              </span>
              <span className="text-[10px] text-white/40 leading-tight">{signal}</span>
            </div>
          ))}
        </div>
      )}

      {/* Contact info */}
      {contact && (
        <div className="rounded-lg bg-white/5 border border-white/8 p-2.5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={10} className="text-white/30 flex-shrink-0" />
            <span className="text-[11px] font-medium text-white/70">{contact.name}</span>
            <span className="text-[10px] text-white/30">·</span>
            <span className="text-[10px] text-white/40 truncate">{contact.title}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail size={9} className="text-white/30 flex-shrink-0" />
            <span className="text-[10px] text-white/40 font-mono">{redactEmail(contact.email)}</span>
          </div>
        </div>
      )}

      {/* View outreach button */}
      {outreach && contact && (
        <>
          <button
            onClick={() => setOutreachOpen((o) => !o)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-medium transition-colors"
          >
            <span>View Outreach Draft</span>
            {outreachOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <AnimatePresence>
            {outreachOpen && (
              <OutreachPanel
                subject={outreach.subject}
                body={outreach.body}
                personalizationScore={outreach.personalizationScore}
                contactName={contact.name}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24 gap-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Crosshair size={28} className="text-white/20" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-white/40">No prospects yet</p>
        <p className="text-sm text-white/25 mt-1">Define your ICP and run the pipeline</p>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ResultsView() {
  const results = useProspectorStore((s) => s.results);

  const [gradeFilter, setGradeFilter] = useState<'All' | 'A' | 'B' | 'C'>('All');
  const [sortBy, setSortBy]           = useState<'Score' | 'Name' | 'Founded'>('Score');
  const [search, setSearch]           = useState('');

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalLeads   = results.length;
  const gradeACount  = results.filter((r) => r.company.grade === 'A').length;
  const gradeBCount  = results.filter((r) => r.company.grade === 'B').length;
  const emailsReady  = results.filter((r) => r.outreach != null).length;

  // ── Filtered + sorted ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...results];

    if (gradeFilter !== 'All') {
      items = items.filter((r) => r.company.grade === gradeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((r) => r.company.name.toLowerCase().includes(q));
    }

    items.sort((a, b) => {
      if (sortBy === 'Score')   return b.company.icpScore - a.company.icpScore;
      if (sortBy === 'Name')    return a.company.name.localeCompare(b.company.name);
      if (sortBy === 'Founded') return b.company.founded - a.company.founded;
      return 0;
    });

    return items;
  }, [results, gradeFilter, search, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Summary bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Leads"
          value={totalLeads}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Grade A"
          value={gradeACount}
          icon={<Star size={18} />}
          accentColor="#22C55E"
        />
        <StatCard
          label="Grade B"
          value={gradeBCount}
          icon={<TrendingUp size={18} />}
          accentColor="#3B82F6"
        />
        <StatCard
          label="Emails Ready"
          value={emailsReady}
          icon={<Mail size={18} />}
          accentColor="#A78BFA"
        />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      {totalLeads > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Grade pills */}
          <div className="flex gap-1.5">
            {(['All', 'A', 'B', 'C'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  gradeFilter === g
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10'
                }`}
              >
                {g === 'All' ? 'All' : `Grade ${g}`}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search companies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 w-48"
            />
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            <option value="Score">Sort: Score</option>
            <option value="Name">Sort: Name</option>
            <option value="Founded">Sort: Founded</option>
          </select>
        </div>
      )}

      {/* ── Grid / empty state ───────────────────────────────────────────── */}
      {totalLeads === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-3"
        >
          <Search size={24} className="text-white/20" />
          <p className="text-sm text-white/30">No leads match your filters</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <LeadCard key={item.company.id} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
