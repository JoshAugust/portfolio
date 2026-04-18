import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Building2, TrendingUp, Users, Zap } from 'lucide-react';
import ICPRadarChart, { RadarValues } from './RadarChart';
import IndustryChips from './IndustryChips';

// ─── Types ────────────────────────────────────────────────────────────────────

type FundingStage =
  | 'Pre-seed'
  | 'Seed'
  | 'Series A'
  | 'Series B'
  | 'Series C+'
  | 'Bootstrapped';

const FUNDING_STAGES: FundingStage[] = [
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
  'Bootstrapped',
];

const COMPANY_SIZE_LABELS = ['1–10', '10–50', '50–200', '200–1K', '1K+'];
const REVENUE_LABELS = ['$0', '<$1M', '$1–5M', '$5–20M', '$20–100M', '$100M+'];
const FOUNDED_LABELS = ['Last year', '1–3 yrs', '3–5 yrs', '5–10 yrs', '10+'];

const SIGNALS = [
  { id: 'recently-funded', label: 'Recently funded', emoji: '🔥' },
  { id: 'hiring-aggressively', label: 'Hiring aggressively', emoji: '📢' },
  { id: 'recent-product', label: 'Recently launched product', emoji: '🚀' },
  { id: 'revenue-growth', label: 'Revenue growing >50% YoY', emoji: '💰' },
  { id: 'new-team', label: 'Building new team', emoji: '🏗️' },
];

const EXAMPLE_COMPANIES = [
  {
    name: 'NeuralStack',
    initial: 'N',
    color: '#3B82F6',
    score: 94,
    description: 'AI infrastructure for enterprise ML pipelines',
  },
  {
    name: 'DevPulse',
    initial: 'D',
    color: '#8B5CF6',
    score: 87,
    description: 'Developer analytics and productivity insights',
  },
  {
    name: 'CodeShield',
    initial: 'C',
    color: '#22C55E',
    score: 82,
    description: 'Automated security scanning for dev teams',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function computeRadarValues(
  companySize: number,
  revenue: number,
  founded: number,
  fundingStages: string[],
  industries: string[],
  signals: string[]
): RadarValues {
  const sizeScore = clamp((companySize / 4) * 100, 10, 100);
  const revenueScore = clamp((revenue / 5) * 100, 10, 100);
  const recencyScore = clamp(((4 - founded) / 4) * 100, 10, 100);

  const techIndustries = ['ai-ml', 'devtools', 'cybersecurity', 'infrastructure', 'saas'];
  const techFitCount = industries.filter((i) => techIndustries.includes(i)).length;
  const techFitScore = clamp(20 + techFitCount * 16 + (industries.length > 0 ? 8 : 0), 0, 100);

  const growthScore = clamp(signals.length * 20, 0, 100);

  const stageScores: Record<string, number> = {
    'Pre-seed': 55,
    Seed: 65,
    'Series A': 85,
    'Series B': 90,
    'Series C+': 80,
    Bootstrapped: 70,
  };
  const avgStageScore =
    fundingStages.length > 0
      ? fundingStages.reduce((sum, s) => sum + (stageScores[s] ?? 60), 0) /
        fundingStages.length
      : 40;
  const marketFitScore = clamp(
    avgStageScore * 0.6 + (industries.length > 0 ? 30 : 0) + (signals.length > 0 ? 10 : 0),
    10,
    100
  );

  return {
    size: sizeScore,
    revenue: revenueScore,
    recency: recencyScore,
    techFit: techFitScore,
    growth: growthScore,
    marketFit: marketFitScore,
  };
}

function computeScore(values: RadarValues): number {
  const avg =
    (values.size + values.revenue + values.recency + values.techFit + values.growth + values.marketFit) / 6;
  return Math.round(avg);
}

function computeAddressable(
  companySize: number,
  revenue: number,
  fundingStages: string[],
  industries: string[]
): number {
  const base = 85000;
  const sizeFactor = 1 - companySize * 0.15;
  const revFactor = 1 - revenue * 0.1;
  const stageFactor = fundingStages.length > 0 ? 1 - fundingStages.length * 0.08 : 1;
  const industryFactor = industries.length > 0 ? 1 - industries.length * 0.04 : 1;
  return Math.max(
    120,
    Math.round(base * sizeFactor * revFactor * stageFactor * industryFactor)
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function useAnimatedValue(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    startRef.current = start;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (target - from) * eased);
      setDisplay(value);
      if (progress < 1) requestAnimationFrame(tick);
      else fromRef.current = target;
    }

    requestAnimationFrame(tick);
  }, [target, duration]);

  return display;
}

// ─── Slider ───────────────────────────────────────────────────────────────────

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  labels: string[];
  label: string;
}

function StepSlider({ value, onChange, min, max, labels, label }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono text-blue-400 font-medium">{labels[value]}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 appearance-none cursor-pointer rounded-full outline-none"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(value / max) * 100}%, rgba(255,255,255,0.1) ${(value / max) * 100}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between">
        {labels.map((l, i) => (
          <span
            key={i}
            className={`text-[9px] font-mono transition-colors duration-200 ${
              i === value ? 'text-blue-400' : 'text-zinc-600'
            }`}
          >
            {i === 0 || i === labels.length - 1 ? l : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Loading Dots ─────────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-blue-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ICPBuilder = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  // Sliders
  const [companySize, setCompanySize] = useState(1);
  const [revenue, setRevenue] = useState(2);
  const [founded, setFounded] = useState(2);

  // Multi-selects
  const [fundingStages, setFundingStages] = useState<string[]>(['Series A']);
  const [industries, setIndustries] = useState<string[]>([]);
  const [signals, setSignals] = useState<string[]>([]);

  // Computed values
  const radarValues = computeRadarValues(
    companySize,
    revenue,
    founded,
    fundingStages,
    industries,
    signals
  );
  const score = computeScore(radarValues);
  const addressable = computeAddressable(companySize, revenue, fundingStages, industries);

  const animatedScore = useAnimatedValue(isGenerated ? score : 0, 900);
  const animatedAddressable = useAnimatedValue(isGenerated ? addressable : 0, 1200);

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setIsGenerated(false);
    await new Promise((r) => setTimeout(r, 2100));
    setIsGenerating(false);
    setIsGenerated(true);
  };

  const toggleFundingStage = (stage: string) => {
    setFundingStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  };

  const toggleIndustry = (id: string) => {
    setIndustries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSignal = (id: string) => {
    setSignals((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="orchestra-ui w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">
          {/* Natural Language Input */}
          <div className="space-y-3">
            <div
              className="relative rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl overflow-hidden"
              style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset' }}
            >
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-black/30">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 ml-1">icp_builder.sh</span>
              </div>
              {/* Textarea */}
              <div className="relative p-4">
                <span className="absolute top-4 left-4 text-blue-400 font-mono text-sm select-none">
                  $&nbsp;
                </span>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your ideal customer... e.g. 'Series A SaaS companies with 10-50 employees building developer tools'"
                  rows={4}
                  className="w-full bg-transparent text-zinc-300 font-mono text-sm pl-5 outline-none resize-none placeholder-zinc-600 leading-relaxed"
                />
              </div>
            </div>

            {/* Generate button */}
            <motion.button
              onClick={handleGenerate}
              disabled={isGenerating}
              whileHover={{ scale: isGenerating ? 1 : 1.02 }}
              whileTap={{ scale: isGenerating ? 1 : 0.97 }}
              className={`w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-medium text-sm transition-all duration-300 ${
                isGenerating
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] hover:shadow-[0_0_32px_rgba(59,130,246,0.55)]'
              }`}
            >
              {isGenerating ? (
                <>
                  <LoadingDots />
                  <span className="font-mono text-xs">Analyzing profile...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Generate ICP</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Sliders + Filters — staggered in after generation */}
          <AnimatePresence>
            {isGenerated && (
              <motion.div
                key="filters"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Company Size */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm p-4"
                >
                  <StepSlider
                    label="Company Size"
                    value={companySize}
                    onChange={setCompanySize}
                    min={0}
                    max={4}
                    labels={COMPANY_SIZE_LABELS}
                  />
                </motion.div>

                {/* Revenue */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm p-4"
                >
                  <StepSlider
                    label="Revenue"
                    value={revenue}
                    onChange={setRevenue}
                    min={0}
                    max={5}
                    labels={REVENUE_LABELS}
                  />
                </motion.div>

                {/* Founded */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm p-4"
                >
                  <StepSlider
                    label="Founded"
                    value={founded}
                    onChange={setFounded}
                    min={0}
                    max={4}
                    labels={FOUNDED_LABELS}
                  />
                </motion.div>

                {/* Funding Stage chips */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm p-4 space-y-3"
                >
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Funding Stage
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {FUNDING_STAGES.map((stage) => {
                      const active = fundingStages.includes(stage);
                      return (
                        <motion.button
                          key={stage}
                          onClick={() => toggleFundingStage(stage)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.93 }}
                          className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium cursor-pointer transition-colors duration-200 ${
                            active
                              ? 'bg-blue-500/15 border border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.25)]'
                              : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {stage}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Industry chips */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm p-4 space-y-3"
                >
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Industry
                  </span>
                  <IndustryChips selected={industries} onToggle={toggleIndustry} />
                </motion.div>

                {/* Signals */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm p-4 space-y-3"
                >
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Buying Signals
                  </span>
                  <div className="space-y-2.5">
                    {SIGNALS.map((signal) => {
                      const active = signals.includes(signal.id);
                      return (
                        <motion.label
                          key={signal.id}
                          whileHover={{ x: 2 }}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div
                            onClick={() => toggleSignal(signal.id)}
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-200 flex-shrink-0 ${
                              active
                                ? 'bg-blue-500 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                : 'border-white/20 bg-white/5 group-hover:border-white/40'
                            }`}
                          >
                            {active && (
                              <motion.svg
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                              >
                                <path
                                  d="M2 5L4 7L8 3"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </motion.svg>
                            )}
                          </div>
                          <span
                            className={`text-sm font-mono transition-colors duration-200 ${
                              active ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-300'
                            }`}
                            onClick={() => toggleSignal(signal.id)}
                          >
                            {signal.emoji} {signal.label}
                          </span>
                        </motion.label>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pre-generation hint */}
          {!isGenerated && !isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-zinc-600 text-xs font-mono px-1"
            >
              <Zap size={12} />
              <span>Describe your ideal customer above, then click Generate ICP</span>
            </motion.div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-5">
          {/* Radar Chart card */}
          <div
            className="rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl p-5"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                ICP Radar
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-mono text-zinc-500">live</span>
              </div>
            </div>
            <ICPRadarChart values={radarValues} />
          </div>

          {/* ICP Summary Card */}
          <AnimatePresence>
            {isGenerated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset' }}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">
                      ICP Profile
                    </p>
                    <h3 className="text-white font-semibold text-base leading-tight">
                      Ideal Customer
                    </h3>
                  </div>
                  {/* Score ring */}
                  <div className="relative flex items-center justify-center w-14 h-14">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="4"
                      />
                      <motion.circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        animate={{
                          strokeDashoffset: 2 * Math.PI * 22 * (1 - animatedScore / 100),
                        }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                        style={{
                          filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.5))',
                        }}
                      />
                    </svg>
                    <span className="text-sm font-bold font-mono text-green-400 z-10">
                      {animatedScore}
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-black/30 border border-white/5 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building2 size={11} className="text-blue-400" />
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                        Addressable
                      </span>
                    </div>
                    <p className="text-white font-mono font-semibold text-sm">
                      ~{animatedAddressable.toLocaleString()}
                    </p>
                    <p className="text-zinc-600 text-[9px] font-mono mt-0.5">companies</p>
                  </div>
                  <div className="rounded-lg bg-black/30 border border-white/5 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp size={11} className="text-green-400" />
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                        Fit Score
                      </span>
                    </div>
                    <p className="text-green-400 font-mono font-semibold text-sm">
                      {animatedScore}/100
                    </p>
                    <p className="text-zinc-600 text-[9px] font-mono mt-0.5">match quality</p>
                  </div>
                </div>

                {/* Attribute badges */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                    Key Attributes
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {fundingStages.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 border border-blue-500/30 text-blue-300"
                      >
                        {s}
                      </span>
                    ))}
                    {industries.slice(0, 3).map((id) => {
                      const ind = { 'ai-ml': 'AI/ML', devtools: 'DevTools', fintech: 'Fintech', cybersecurity: 'Security', saas: 'SaaS', healthtech: 'HealthTech', infrastructure: 'Infra', ecommerce: 'E-commerce', blockchain: 'Blockchain', iot: 'IoT', martech: 'MarTech', hrtech: 'HRTech', legaltech: 'LegalTech', cleantech: 'CleanTech', edtech: 'EdTech' }[id] ?? id;
                      return (
                        <span
                          key={id}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 border border-purple-500/30 text-purple-300"
                        >
                          {ind}
                        </span>
                      );
                    })}
                    {signals.slice(0, 2).map((id) => {
                      const sig = SIGNALS.find((s) => s.id === id);
                      return sig ? (
                        <span
                          key={id}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300"
                        >
                          {sig.emoji} {sig.label.split(' ').slice(0, 2).join(' ')}
                        </span>
                      ) : null;
                    })}
                    {fundingStages.length === 0 && industries.length === 0 && signals.length === 0 && (
                      <span className="text-zinc-600 text-[10px] font-mono italic">
                        Refine filters to add attributes
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Example Matches */}
          <AnimatePresence>
            {isGenerated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-zinc-500" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Example Matches
                  </span>
                </div>
                {EXAMPLE_COMPANIES.map((company, i) => (
                  <motion.div
                    key={company.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 + 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm p-3 cursor-pointer group transition-colors duration-200 hover:border-white/15"
                  >
                    {/* Logo circle */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${company.color}33, ${company.color}11)`,
                        border: `1px solid ${company.color}40`,
                        boxShadow: `0 0 12px ${company.color}25`,
                      }}
                    >
                      {company.initial}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium font-mono leading-tight">
                        {company.name}
                      </p>
                      <p className="text-zinc-500 text-[10px] font-mono mt-0.5 truncate">
                        {company.description}
                      </p>
                    </div>
                    {/* Score badge */}
                    <div
                      className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-mono font-bold"
                      style={{
                        background: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        color: '#22C55E',
                        textShadow: '0 0 8px rgba(34,197,94,0.4)',
                      }}
                    >
                      {company.score}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state for right col before generation */}
          {!isGenerated && (
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="rounded-xl border border-dashed border-white/10 bg-zinc-900/20 p-8 flex flex-col items-center justify-center gap-3 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Sparkles size={20} className="text-blue-400/60" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm font-mono">ICP profile will appear here</p>
                <p className="text-zinc-600 text-xs font-mono mt-1">
                  Generate your ICP to see the analysis
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Slider thumb styles */}
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1d4ed8;
          box-shadow: 0 0 10px rgba(59,130,246,0.5);
          transition: box-shadow 0.2s;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          box-shadow: 0 0 16px rgba(59,130,246,0.7);
        }
        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1d4ed8;
          box-shadow: 0 0 10px rgba(59,130,246,0.5);
        }
        input[type='range']:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default ICPBuilder;
