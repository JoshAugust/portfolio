import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Zap, TrendingUp, Mail, Users, BarChart3 } from 'lucide-react';
import { useProspectorStore } from '@/stores/prospectorStore';
import type { PipelineItem, PipelineStage } from '@/types/prospector';

// ─── Stage Configuration ──────────────────────────────────────────────────────

interface StageConfig {
  id: PipelineStage;
  label: string;
  emoji: string;
  hex: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  badgeBg: string;
  badgeText: string;
  glow: string;
  connectorColor: string;
}

const STAGE_CONFIGS: StageConfig[] = [
  {
    id: 'discovered',
    label: 'Discovered',
    emoji: '🔍',
    hex: '#3b82f6',
    headerBg: 'bg-blue-500/10',
    headerBorder: 'border-blue-500/40',
    headerText: 'text-blue-400',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    glow: '0 0 20px rgba(59,130,246,0.35)',
    connectorColor: '#3b82f6',
  },
  {
    id: 'scoring',
    label: 'Scoring',
    emoji: '📊',
    hex: '#f59e0b',
    headerBg: 'bg-amber-500/10',
    headerBorder: 'border-amber-500/40',
    headerText: 'text-amber-400',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    glow: '0 0 20px rgba(245,158,11,0.35)',
    connectorColor: '#f59e0b',
  },
  {
    id: 'enriching',
    label: 'Enriching',
    emoji: '🔬',
    hex: '#a855f7',
    headerBg: 'bg-purple-500/10',
    headerBorder: 'border-purple-500/40',
    headerText: 'text-purple-400',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    glow: '0 0 20px rgba(168,85,247,0.35)',
    connectorColor: '#a855f7',
  },
  {
    id: 'outreach',
    label: 'Outreach',
    emoji: '✉️',
    hex: '#06b6d4',
    headerBg: 'bg-cyan-500/10',
    headerBorder: 'border-cyan-500/40',
    headerText: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    glow: '0 0 20px rgba(6,182,212,0.35)',
    connectorColor: '#06b6d4',
  },
  {
    id: 'ready',
    label: 'Ready',
    emoji: '✅',
    hex: '#22c55e',
    headerBg: 'bg-green-500/10',
    headerBorder: 'border-green-500/40',
    headerText: 'text-green-400',
    badgeBg: 'bg-green-500/20',
    badgeText: 'text-green-300',
    glow: '0 0 20px rgba(34,197,94,0.35)',
    connectorColor: '#22c55e',
  },
];

// Company avatar color map (from Company.color field)
const COMPANY_COLORS: Record<string, string> = {
  'violet-500': '#8b5cf6',
  'blue-500': '#3b82f6',
  'blue-400': '#60a5fa',
  'rose-500': '#f43f5e',
  'amber-500': '#f59e0b',
  'cyan-500': '#06b6d4',
  'emerald-500': '#10b981',
  'emerald-400': '#34d399',
  'indigo-500': '#6366f1',
  'orange-500': '#f97316',
  'teal-500': '#14b8a6',
  'lime-500': '#84cc16',
  'red-500': '#ef4444',
  'fuchsia-500': '#d946ef',
  'sky-500': '#0ea5e9',
  'purple-500': '#a855f7',
  'yellow-500': '#eab308',
  'zinc-500': '#71717a',
  'stone-500': '#78716c',
  'violet-400': '#a78bfa',
};

// ─── Animated Counter ─────────────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration = 500): number {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(start + diff * eased);
      setValue(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

// ─── Flow Connector ───────────────────────────────────────────────────────────

interface FlowConnectorProps {
  fromColor: string;
  toColor: string;
  isActive: boolean;
}

function FlowConnector({ fromColor, toColor, isActive }: FlowConnectorProps) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-start pt-[52px] flex-shrink-0 w-6 xl:w-8">
      <div className="relative w-full h-0.5 overflow-hidden rounded-full">
        {/* Base line */}
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `linear-gradient(90deg, ${fromColor}, ${toColor})` }}
        />
        {/* Animated flow shimmer */}
        {isActive && (
          <motion.div
            className="absolute inset-y-0 w-1/2"
            style={{
              background: `linear-gradient(90deg, transparent, ${toColor}cc, transparent)`,
            }}
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
      {/* Flowing dots */}
      {isActive && (
        <div className="relative w-full h-0" style={{ marginTop: '-1px' }}>
          {[0, 0.5, 1].map((offset) => (
            <motion.div
              key={offset}
              className="absolute w-1 h-1 rounded-full"
              style={{
                top: '-2px',
                backgroundColor: toColor,
                boxShadow: `0 0 4px ${toColor}`,
              }}
              animate={{ x: ['-4px', '120%'] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'linear',
                delay: offset * 0.47,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Score Badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-green-400 bg-green-500/15 border-green-500/30' :
    score >= 50 ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' :
                  'text-red-400 bg-red-500/15 border-red-500/30';

  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color} tabular-nums`}>
      {score}
    </span>
  );
}

// ─── Company Card ─────────────────────────────────────────────────────────────

interface CompanyCardProps {
  item: PipelineItem;
  stageConfig: StageConfig;
  showScore: boolean;
}

function CompanyCard({ item, stageConfig, showScore }: CompanyCardProps) {
  const avatarColor = COMPANY_COLORS[item.company.color] ?? '#6366f1';
  const initials = item.company.name.charAt(0).toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      whileHover={{ scale: 1.02, y: -1 }}
      className="group relative rounded-lg border border-white/8 bg-white/[0.04] backdrop-blur-sm p-2.5 cursor-default overflow-hidden"
      style={{
        transition: 'box-shadow 0.2s ease',
      }}
      onHoverStart={(e) => {
        (e.target as HTMLElement).closest('.company-card-wrapper')?.setAttribute(
          'style',
          `box-shadow: 0 0 12px ${stageConfig.hex}40`
        );
      }}
    >
      {/* Subtle top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-40"
        style={{ background: `linear-gradient(90deg, transparent, ${stageConfig.hex}, transparent)` }}
      />

      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
          style={{ backgroundColor: avatarColor, boxShadow: `0 0 8px ${avatarColor}50` }}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white/90 truncate leading-tight">
              {item.company.name}
            </span>
            {showScore && <ScoreBadge score={item.company.icpScore} />}
          </div>
          <span className={`text-[10px] ${stageConfig.badgeText} truncate block leading-tight mt-0.5`}>
            {item.company.industry.split(' / ')[0]}
          </span>
        </div>
      </div>

      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
        style={{ boxShadow: `inset 0 0 16px ${stageConfig.hex}15` }}
      />
    </motion.div>
  );
}

// ─── Stage Column ─────────────────────────────────────────────────────────────

interface StageColumnProps {
  config: StageConfig;
  items: PipelineItem[];
  isActive: boolean;
}

function StageColumn({ config, items, isActive }: StageColumnProps) {
  const showScore = config.id !== 'discovered';

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-2">
      {/* Stage header */}
      <motion.div
        className={`relative rounded-xl border ${config.headerBorder} ${config.headerBg} px-3 py-2.5 flex items-center justify-between backdrop-blur-sm overflow-hidden`}
        animate={isActive && items.length > 0 ? {
          boxShadow: [
            `0 0 0px ${config.hex}00`,
            config.glow,
            `0 0 0px ${config.hex}00`,
          ],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Animated background pulse when active */}
        {isActive && items.length > 0 && (
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(ellipse at center, ${config.hex}30, transparent 70%)` }}
            animate={{ opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <div className="flex items-center gap-2 relative z-10">
          <span className="text-base leading-none">{config.emoji}</span>
          <span className={`text-xs font-semibold ${config.headerText}`}>{config.label}</span>
        </div>

        {/* Count badge */}
        <motion.div
          key={items.length}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={`relative z-10 min-w-[22px] text-center text-xs font-bold ${config.badgeBg} ${config.badgeText} rounded-full px-1.5 py-0.5 tabular-nums`}
        >
          {items.length}
        </motion.div>
      </motion.div>

      {/* Card list */}
      <div className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm p-2 min-h-[200px] lg:min-h-[300px] overflow-y-auto">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full min-h-[80px]"
            >
              <span className="text-xs text-white/20 italic">Waiting…</span>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {items.map((item) => (
                <CompanyCard
                  key={item.company.id}
                  item={item}
                  stageConfig={config}
                  showScore={showScore}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}

function StatItem({ icon, label, value, color, suffix }: StatItemProps) {
  const animated = useAnimatedCounter(value);
  const textColor = color ?? 'text-white';

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.07]">
      <span className="text-white/40 flex-shrink-0">{icon}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${textColor}`}>
          {animated}{suffix}
        </span>
      </div>
    </div>
  );
}

function AvgScoreItem({ value }: { value: number }) {
  const animated = useAnimatedCounter(value);
  const color =
    animated >= 70 ? 'text-green-400' :
    animated >= 50 ? 'text-amber-400' :
                     'text-red-400';

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.07]">
      <span className="text-white/40 flex-shrink-0"><BarChart3 size={14} /></span>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Avg ICP</span>
        <span className={`text-sm font-bold tabular-nums ${color}`}>{animated}</span>
      </div>
    </div>
  );
}

// ─── Pipeline Active Indicator ────────────────────────────────────────────────

function PipelineStatusBadge({ isRunning }: { isRunning: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-2.5 h-2.5">
        {isRunning ? (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-green-500"
              animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
            <div className="relative w-2.5 h-2.5 rounded-full bg-green-400" />
          </>
        ) : (
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
        )}
      </div>
      <span className={`text-xs font-semibold ${isRunning ? 'text-green-400' : 'text-zinc-500'}`}>
        {isRunning ? 'Pipeline Active' : 'Pipeline Idle'}
      </span>
    </div>
  );
}

// ─── Speed Selector ───────────────────────────────────────────────────────────

const SPEED_OPTIONS = [1, 2, 5] as const;
type SpeedOption = typeof SPEED_OPTIONS[number];

interface SpeedSelectorProps {
  speed: number;
  onChange: (s: SpeedOption) => void;
}

function SpeedSelector({ speed, onChange }: SpeedSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Zap size={12} className="text-white/40" />
      <span className="text-xs text-white/40 mr-0.5">Speed</span>
      {SPEED_OPTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`text-xs font-bold px-2 py-1 rounded-md transition-all duration-150 ${
            speed === s
              ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40'
              : 'text-white/35 border border-white/10 hover:border-white/25 hover:text-white/60'
          }`}
        >
          {s}×
        </button>
      ))}
    </div>
  );
}

// ─── Main PipelineView ────────────────────────────────────────────────────────

export default function PipelineView() {
  const {
    pipeline,
    results,
    stats,
    isRunning,
    speed,
    setSpeed,
    startPipeline,
    stopPipeline,
  } = useProspectorStore();

  // Group pipeline items by stage
  const getStageItems = useCallback(
    (stage: PipelineStage): PipelineItem[] => {
      if (stage === 'ready') return results;
      return pipeline.filter((p) => p.stage === stage);
    },
    [pipeline, results]
  );

  const handleToggle = () => {
    if (isRunning) stopPipeline();
    else startPipeline();
  };

  const handleSpeedChange = (s: SpeedOption) => {
    setSpeed(s);
  };

  // Score color for stats
  const avgScoreColor =
    stats.avgScore >= 70 ? 'text-green-400' :
    stats.avgScore >= 50 ? 'text-amber-400' :
    stats.avgScore > 0   ? 'text-red-400' : 'text-white/40';

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── Top bar: status + stats + controls ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: status + stats */}
        <div className="flex flex-wrap items-center gap-2">
          <PipelineStatusBadge isRunning={isRunning} />
          <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />
          <StatItem
            icon={<Users size={14} />}
            label="Scanned"
            value={stats.companiesScanned}
          />
          <StatItem
            icon={<TrendingUp size={14} />}
            label="Leads"
            value={stats.leadsFound}
          />
          <StatItem
            icon={<Mail size={14} />}
            label="Emails"
            value={stats.emailsDrafted}
          />
          <AvgScoreItem value={stats.avgScore} />
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <SpeedSelector speed={speed} onChange={handleSpeedChange} />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isRunning
                ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                : 'bg-violet-600 border border-violet-500/60 text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500'
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={14} />
                Pause
              </>
            ) : (
              <>
                <Play size={14} />
                Start Pipeline
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Pipeline columns ── */}
      <div className="flex flex-col lg:flex-row gap-2 lg:gap-0 lg:items-start">
        {STAGE_CONFIGS.map((config, i) => {
          const items = getStageItems(config.id);
          const isActive = isRunning;
          const nextConfig = STAGE_CONFIGS[i + 1];

          return (
            <div key={config.id} className="flex flex-row lg:flex-row flex-1 min-w-0 items-start gap-0">
              <StageColumn
                config={config}
                items={items}
                isActive={isActive}
              />
              {nextConfig && (
                <FlowConnector
                  fromColor={config.connectorColor}
                  toColor={nextConfig.connectorColor}
                  isActive={isActive}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Empty state ── */}
      <AnimatePresence>
        {!isRunning && pipeline.length === 0 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center justify-center py-8 gap-3 text-center"
          >
            <div className="text-3xl">🚀</div>
            <p className="text-sm text-white/40 max-w-xs">
              Hit <span className="text-violet-400 font-semibold">Start Pipeline</span> to watch companies flow through discovery, scoring, enrichment, and outreach in real time.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
