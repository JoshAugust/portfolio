import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Target, ChevronRight, RotateCcw, Spade, Settings } from 'lucide-react';
import {
  section1Questions,
  section2Questions,
  practiceQuestions,
  type WhichHandWinsQuestion,
  type RightPlayQuestion,
  type CorrectAnswer,
} from '../data/pokerQuestions';
import {
  insertSubmission,
  setActiveRowId,
  syncUpdate,
  setLastSyncData,
  migrateLocalStorageToSupabase,
} from '../lib/supabase';

// ─── Storage key ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'mbat-poker-submissions';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Section1Record {
  questionId: number;
  answer: CorrectAnswer;
  correct: boolean;
  timeMs: number;
}

interface Section2Record {
  questionId: number;
  action: string;
  reasoning: string;
}

interface SubmissionRecord {
  name: string;
  score: number;
  total: number;
  totalMs: number;
  avgMs: number;
  accuracy: number;
  completedAt: string;
  startedAt?: string;
  status: 'in_progress' | 'completed';
  questionsAnswered: number;
  currentSection?: 'practice' | 'section1' | 'section2';
  answers: { questionId: number; correct: boolean; timeMs: number }[];
  section2: { questionId: number; action: string; reasoning: string }[];
}

// ─── Answer label map ──────────────────────────────────────────────────────────
const ANSWER_LABELS: Record<CorrectAnswer, string> = {
  player_a: 'Player A Wins',
  player_b: 'Player B Wins',
  split: 'Split Pot',
};

const ANSWER_COLORS: Record<CorrectAnswer, string> = {
  player_a: '#60a5fa',
  player_b: '#f472b6',
  split: '#facc15',
};

// ─── Action buttons config ────────────────────────────────────────────────────
const ACTION_BUTTONS = [
  { key: 'Fold', color: '#9898b0', hoverBg: 'rgba(152,152,176,0.15)' },
  { key: 'Call', color: '#60a5fa', hoverBg: 'rgba(96,165,250,0.15)' },
  { key: 'Raise Small', color: '#facc15', hoverBg: 'rgba(250,204,21,0.15)' },
  { key: 'Raise Big / All-In', color: '#f87171', hoverBg: 'rgba(248,113,113,0.15)' },
];

// ─── Card parser (no imageUrl — CSS-rendered cards) ───────────────────────────
interface ParsedCard {
  rank: string; // raw: A, K, Q, J, T, 2-9
  suit: string; // ♠ ♥ ♦ ♣
}

function parseCards(text: string): ParsedCard[] {
  const regex = /([AKQJT2-9])([♠♥♦♣])/g;
  const results: ParsedCard[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    results.push({ rank: match[1], suit: match[2] });
  }
  return results;
}

function parseBoardCards(scenario: string): ParsedCard[] {
  const boardMatch = scenario.match(/board (?:shows|runs out):\s*([^.]+)/i);
  if (!boardMatch) return [];
  return parseCards(boardMatch[1]);
}

// ─── Suit coloriser ────────────────────────────────────────────────────────────
function coloriseSuits(text: string): React.ReactNode[] {
  const parts = text.split(/(♥|♦|♠|♣)/g);
  return parts.map((part, i) => {
    if (part === '♥' || part === '♦') {
      return <span key={i} style={{ color: '#ef4444' }}>{part}</span>;
    }
    if (part === '♠' || part === '♣') {
      return <span key={i} style={{ color: '#e8e8f0' }}>{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

// ─── Speed rating ──────────────────────────────────────────────────────────────
function getSpeedRating(avgMs: number): { label: string; color: string } {
  if (avgMs < 5000) return { label: 'Shark', color: '#4ade80' };
  if (avgMs < 10000) return { label: 'Reg', color: '#a3e635' };
  if (avgMs < 18000) return { label: 'Thinking Player', color: '#facc15' };
  return { label: 'Tank King', color: '#fb923c' };
}

// ─── Timer display ─────────────────────────────────────────────────────────────
function TimerDisplay({ ms }: { ms: number }) {
  const secs = ms / 1000;
  const color = secs > 15 ? '#ef4444' : secs > 10 ? '#fb923c' : '#e8e8f0';
  return (
    <div className="flex items-center gap-1.5 font-mono text-sm" style={{ color }}>
      <Clock className="w-4 h-4" />
      <span>{secs.toFixed(1)}s</span>
    </div>
  );
}

// ─── PlayingCard — CSS-rendered card ──────────────────────────────────────────
function PlayingCard({ rank, suit }: { rank: string; suit: string }) {
  const displayRank = rank === 'T' ? '10' : rank;
  const isRed = suit === '♥' || suit === '♦';
  const color = isRed ? '#dc2626' : '#1a1a1a';

  return (
    <div
      className="w-[55px] h-[78px] sm:w-[70px] sm:h-[100px] flex flex-col items-center justify-center gap-0.5 flex-shrink-0"
      style={{
        background: '#ffffff',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <span
        className="text-[20px] sm:text-[24px] font-bold leading-none select-none"
        style={{ fontFamily: 'sans-serif', color }}
      >
        {displayRank}
      </span>
      <span
        className="text-[22px] sm:text-[28px] leading-none select-none"
        style={{ color }}
      >
        {suit}
      </span>
    </div>
  );
}

// ─── CardDisplay — player hand ─────────────────────────────────────────────────
function CardDisplay({ label, hand, playerKey }: { label: string; hand: string; playerKey?: string }) {
  const cards = parseCards(hand);
  const color =
    playerKey === 'player_a' ? '#60a5fa' :
    playerKey === 'player_b' ? '#f472b6' :
    '#9898b0';

  return (
    <div
      className="flex flex-col gap-2 flex-1 min-w-0 rounded-lg p-3"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <span className="text-xs font-mono uppercase tracking-widest" style={{ color }}>
        {label}
      </span>
      <div className="flex items-center flex-wrap gap-2">
        {cards.map((card, i) => (
          <PlayingCard key={i} rank={card.rank} suit={card.suit} />
        ))}
      </div>
    </div>
  );
}

// ─── BoardDisplay ──────────────────────────────────────────────────────────────
function BoardDisplay({ cards }: { cards: ParsedCard[] }) {
  if (cards.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 mb-5">
      <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#9898b0' }}>
        Board
      </span>
      <div className="flex items-center flex-wrap gap-2">
        {cards.map((card, i) => (
          <PlayingCard key={i} rank={card.rank} suit={card.suit} />
        ))}
      </div>
    </div>
  );
}

// ─── Which Hand Wins — Question View ──────────────────────────────────────────
const WHICH_HAND_BUTTONS: { key: CorrectAnswer; label: string; color: string }[] = [
  { key: 'player_a', label: 'Player A Wins', color: '#60a5fa' },
  { key: 'split', label: 'Split Pot', color: '#facc15' },
  { key: 'player_b', label: 'Player B Wins', color: '#f472b6' },
];

function WhichHandWinsView({
  question,
  index,
  total,
  playerName,
  onAnswer,
  isPractice,
}: {
  question: WhichHandWinsQuestion;
  index: number;
  total: number;
  playerName: string;
  onAnswer: (answer: CorrectAnswer, correct: boolean, timeMs: number) => void;
  isPractice?: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<CorrectAnswer | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    answeredRef.current = false;

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question]);

  const handleSelect = useCallback(
    (answer: CorrectAnswer) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      const timeMs = Date.now() - startRef.current;
      const correct = answer === question.correctAnswer;
      setSelectedAnswer(answer);

      if (isPractice) {
        setShowExplanation(true);
        setTimeout(() => onAnswer(answer, correct, timeMs), 3000);
      } else {
        setTimeout(() => onAnswer(answer, correct, timeMs), 1200);
      }
    },
    [question, onAnswer, isPractice]
  );

  const boardCards = parseBoardCards(question.scenario);
  const progress = (index / total) * 100;
  const progressBarColor = isPractice ? '#fbbf24' : '#4ade80';

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 md:py-10">
      {/* Practice banner */}
      {isPractice && (
        <div
          className="w-full max-w-2xl mx-auto mb-4 rounded-lg px-4 py-2 flex items-center justify-center gap-2"
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)' }}
        >
          <span className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: '#fbbf24' }}>
            ★ PRACTICE — This doesn't count
          </span>
        </div>
      )}

      {/* Top bar */}
      <div className="w-full max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: isPractice ? '#fbbf24' : '#686880' }}
            >
              {isPractice ? `Practice ${index + 1} / ${total}` : `Hand ${index + 1} / ${total}`}
            </span>
            {playerName && (
              <span className="font-mono text-xs" style={{ color: '#4ade80' }}>
                · {playerName}
              </span>
            )}
          </div>
          <TimerDisplay ms={elapsed} />
        </div>
        <div className="w-full h-1 rounded-full" style={{ background: '#2a2a3a' }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: progressBarColor }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="w-full max-w-2xl mx-auto flex-1">
        <div
          className="rounded-2xl p-5 md:p-7 mb-5"
          style={{
            background: '#12121a',
            border: isPractice ? '1px solid rgba(251,191,36,0.25)' : '1px solid #2a2a3a',
          }}
        >
          <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#686880' }}>
            🃏 Which hand wins?
          </p>

          <BoardDisplay cards={boardCards} />

          {/* Player hands */}
          <div className="flex flex-col sm:flex-row gap-3 mb-2">
            <CardDisplay label="Player A" hand={question.players.player_a} playerKey="player_a" />
            <CardDisplay label="Player B" hand={question.players.player_b} playerKey="player_b" />
          </div>
        </div>

        {/* 3-button answer row */}
        <div className="flex gap-2 sm:gap-3 mb-4">
          {WHICH_HAND_BUTTONS.map(({ key, label, color }) => {
            let btnState: 'idle' | 'correct' | 'wrong' = 'idle';
            if (selectedAnswer !== null) {
              if (key === question.correctAnswer) btnState = 'correct';
              else if (key === selectedAnswer) btnState = 'wrong';
            }

            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                disabled={selectedAnswer !== null}
                className="flex-1 py-3 px-1 sm:px-4 rounded-lg font-mono text-xs sm:text-sm font-medium uppercase tracking-widest transition-all hover:opacity-90 disabled:cursor-default text-center"
                style={{
                  border: `1px solid ${
                    btnState === 'correct' ? '#22c55e' :
                    btnState === 'wrong' ? '#ef4444' :
                    color
                  }`,
                  color:
                    btnState === 'correct' ? '#22c55e' :
                    btnState === 'wrong' ? '#ef4444' :
                    color,
                  background:
                    btnState === 'correct' ? 'rgba(34,197,94,0.15)' :
                    btnState === 'wrong' ? 'rgba(239,68,68,0.15)' :
                    'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s ease',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Practice explanation */}
        {isPractice && showExplanation && (
          <div
            className="mt-4 rounded-xl px-4 py-4"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)' }}
          >
            <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#fbbf24' }}>
              Explanation
            </p>
            <p className="font-mono text-sm leading-relaxed" style={{ color: '#e8e8f0' }}>
              {question.explanation}
            </p>
            <p className="font-mono text-xs mt-2" style={{ color: '#686880' }}>
              Moving on in a moment…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Right Play — Question View (Section 2) ───────────────────────────────────
function RightPlayView({
  question,
  index,
  total,
  playerName,
  onAnswer,
}: {
  question: RightPlayQuestion;
  index: number;
  total: number;
  playerName: string;
  onAnswer: (action: string, reasoning: string) => void;
}) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState('');

  const handleSubmit = useCallback(() => {
    if (!selectedAction || !reasoning.trim()) return;
    const action = selectedAction;
    const text = reasoning.trim();
    setSelectedAction(null);
    setReasoning('');
    onAnswer(action, text);
  }, [selectedAction, reasoning, onAnswer]);

  const progress = (index / total) * 100;

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 md:py-10">
      {/* Section 2 banner */}
      <div
        className="w-full max-w-2xl mx-auto mb-4 rounded-lg px-4 py-2 flex items-center justify-center gap-2"
        style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}
      >
        <span className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: '#a78bfa' }}>
          ♟ Section 2 — What's Your Play?
        </span>
      </div>

      {/* Top bar */}
      <div className="w-full max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#686880' }}>
              Strategy {index + 1} / {total}
            </span>
            {playerName && (
              <span className="font-mono text-xs" style={{ color: '#4ade80' }}>
                · {playerName}
              </span>
            )}
          </div>
        </div>
        <div className="w-full h-1 rounded-full" style={{ background: '#2a2a3a' }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: '#a78bfa' }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="w-full max-w-2xl mx-auto flex-1">
        <div
          className="rounded-2xl p-5 md:p-7 mb-5"
          style={{ background: '#12121a', border: '1px solid #2a2a3a' }}
        >
          <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#686880' }}>
            ♟ What's the right play?
          </p>

          <div
            className="rounded-xl px-4 py-3 mb-4 text-sm font-mono leading-relaxed"
            style={{ background: '#1a472a', border: '1px solid #2d6a4f', color: '#e8e8f0' }}
          >
            {coloriseSuits(question.scenario)}
          </div>

          <p className="font-mono text-xs" style={{ color: '#686880' }}>
            No right or wrong answer — pick what you'd do and explain your thinking.
          </p>
        </div>

        {/* 4 action buttons in 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {ACTION_BUTTONS.map(({ key, color }) => (
            <button
              key={key}
              onClick={() => setSelectedAction(key)}
              className="py-3 px-4 rounded-lg font-mono text-sm font-medium transition-all hover:opacity-90 text-center"
              style={{
                border: `1px solid ${selectedAction === key ? color : 'rgba(255,255,255,0.1)'}`,
                color: selectedAction === key ? color : '#9898b0',
                background: selectedAction === key
                  ? ACTION_BUTTONS.find((b) => b.key === key)!.hoverBg
                  : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
              }}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Reasoning textarea — shown after action selected */}
        {selectedAction && (
          <div className="flex flex-col gap-3">
            <label className="font-mono text-xs uppercase tracking-widest" style={{ color: '#686880' }}>
              Your Reasoning
            </label>
            <textarea
              rows={4}
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="What's your reasoning?"
              className="w-full px-4 py-3 rounded-lg font-mono text-sm outline-none resize-none"
              style={{
                background: '#12121a',
                border: '1px solid #2a2a3a',
                color: '#e8e8f0',
                caretColor: '#4ade80',
              }}
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={!reasoning.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-mono text-sm uppercase tracking-widest font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#1a472a', border: '1px solid #2d6a4f', color: '#4ade80' }}
            >
              Submit
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Transition ────────────────────────────────────────────────────────
function SectionTransition({ score, onContinue }: { score: number; onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div
        className="mb-6 flex items-center justify-center w-16 h-16 rounded-full"
        style={{ background: '#1a472a', border: '1px solid #2d6a4f' }}
      >
        <Trophy className="w-8 h-8" style={{ color: '#4ade80' }} />
      </div>

      <h1 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: '#e8e8f0' }}>
        Section 1 Complete
      </h1>
      <p className="font-mono text-2xl font-bold mb-2" style={{ color: '#4ade80' }}>
        {score}/10
      </p>
      <p className="font-mono text-sm mb-3" style={{ color: '#9898b0' }}>
        Which Hand Wins? — done.
      </p>
      <p className="font-mono text-sm mb-10 max-w-sm" style={{ color: '#686880' }}>
        Next: What's Your Play? — 3 strategy scenarios. No right or wrong answers.
      </p>

      <button
        onClick={onContinue}
        className="flex items-center justify-center gap-2 px-10 py-4 rounded-full font-mono text-sm uppercase tracking-widest font-medium transition-all hover:scale-105 active:scale-95"
        style={{ background: '#1a472a', border: '1px solid #2d6a4f', color: '#4ade80' }}
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────
function Landing({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name to play.');
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const submissions: SubmissionRecord[] = JSON.parse(raw);
        const exists = submissions.some(
          (s) => s.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) {
          setError('This name has already been used.');
          return;
        }
      }
    } catch {
      // corrupt storage — ignore
    }

    setError('');
    onStart(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div
        className="mb-6 flex items-center justify-center w-16 h-16 rounded-full"
        style={{ background: '#1a472a', border: '1px solid #2d6a4f' }}
      >
        <Spade className="w-8 h-8" style={{ color: '#4ade80' }} />
      </div>

      <h1 className="font-display text-4xl md:text-5xl font-bold mb-3" style={{ color: '#e8e8f0' }}>
        MBAT Poker
      </h1>
      <p className="font-mono text-sm mb-10" style={{ color: '#9898b0' }}>
        10 hands + 3 strategy questions.
      </p>

      <div
        className="w-full max-w-md mb-10 rounded-xl p-6 text-left"
        style={{ background: '#12121a', border: '1px solid #2a2a3a' }}
      >
        <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#686880' }}>Rules</p>
        <ul className="space-y-3">
          {[
            'Section 1 — 10 "which hand wins?" questions (scored)',
            'Section 2 — 3 strategy scenarios (no right or wrong)',
            'Timer starts immediately — speed affects your rating',
            'No email required, no signup, just play',
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-3 font-mono text-sm" style={{ color: '#9898b0' }}>
              <span style={{ color: '#4ade80', flexShrink: 0 }}>→</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* Name input */}
      <div className="w-full max-w-md flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs uppercase tracking-widest text-left" style={{ color: '#686880' }}>
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name…"
            maxLength={40}
            className="w-full px-4 py-3 rounded-lg font-mono text-sm outline-none"
            style={{
              background: '#12121a',
              border: error ? '1px solid #ef4444' : '1px solid #2a2a3a',
              color: '#e8e8f0',
              caretColor: '#4ade80',
            }}
          />
          {error && (
            <p className="font-mono text-xs" style={{ color: '#ef4444' }}>{error}</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center justify-center gap-2 px-8 py-3 rounded-full font-mono text-sm uppercase tracking-widest font-medium transition-all hover:scale-105 active:scale-95"
          style={{ background: '#1a472a', border: '1px solid #2d6a4f', color: '#4ade80' }}
        >
          Deal Me In
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Ready screen ─────────────────────────────────────────────────────────────
function ReadyScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div
        className="mb-6 flex items-center justify-center w-16 h-16 rounded-full"
        style={{ background: '#1a472a', border: '1px solid #2d6a4f' }}
      >
        <Spade className="w-8 h-8" style={{ color: '#4ade80' }} />
      </div>

      <h1 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: '#e8e8f0' }}>
        Ready for the real thing?
      </h1>
      <p className="font-mono text-sm mb-10" style={{ color: '#9898b0' }}>
        The next 10 hands count. Good luck.
      </p>

      <button
        onClick={onStart}
        className="flex items-center justify-center gap-2 px-10 py-4 rounded-full font-mono text-sm uppercase tracking-widest font-medium transition-all hover:scale-105 active:scale-95"
        style={{ background: '#1a472a', border: '1px solid #2d6a4f', color: '#4ade80' }}
      >
        Start Quiz
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────
function Results({
  section1Records,
  section2Records,
  playerName,
  startedAt,
  onRestart,
}: {
  section1Records: Section1Record[];
  section2Records: Section2Record[];
  playerName: string;
  startedAt: string;
  onRestart: () => void;
}) {
  const score = section1Records.filter((r) => r.correct).length;
  const totalMs = section1Records.reduce((s, r) => s + r.timeMs, 0);
  const avgMs = section1Records.length > 0 ? totalMs / section1Records.length : 0;
  const accuracy = section1Records.length > 0 ? Math.round((score / section1Records.length) * 100) : 0;
  const speed = getSpeedRating(avgMs);

  // Mark as completed in localStorage + Supabase on mount
  useEffect(() => {
    const completedAt = new Date().toISOString();
    const answersPayload = section1Records.map((r) => ({
      questionId: r.questionId,
      correct: r.correct,
      timeMs: r.timeMs,
    }));
    const section2Payload = section2Records.map((r) => ({
      questionId: r.questionId,
      action: r.action,
      reasoning: r.reasoning,
    }));

    updateLiveSubmission(playerName, (rec) => ({
      ...rec,
      score,
      total: section1Records.length,
      totalMs,
      avgMs,
      accuracy,
      completedAt,
      status: 'completed' as const,
      questionsAnswered: section1Records.length + section2Records.length,
      currentSection: undefined,
      answers: answersPayload,
      section2: section2Payload,
    }));

    // Sync completion to Supabase DIRECTLY
    syncToSupabase({
      name: playerName,
      score,
      total: section1Records.length,
      totalMs,
      avgMs,
      accuracy,
      startedAt,
      completedAt,
      status: 'completed',
      questionsAnswered: section1Records.length + section2Records.length,
      currentSection: null,
      answers: answersPayload,
      section2: section2Payload,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        {/* Score badge */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
            style={{ background: '#1a472a', border: '2px solid #4ade80' }}
          >
            <Trophy className="w-10 h-10" style={{ color: '#4ade80' }} />
          </div>
          <h1 className="font-display text-4xl font-bold mb-1" style={{ color: '#e8e8f0' }}>
            {score}/{section1Records.length}
          </h1>
          <p className="font-mono text-sm mb-1" style={{ color: speed.color }}>
            {speed.label}
          </p>
          {playerName && (
            <p className="font-mono text-sm mb-1" style={{ color: '#9898b0' }}>
              {playerName}
            </p>
          )}
          <p className="font-mono text-xs" style={{ color: '#686880' }}>
            MBAT Poker Complete
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Clock, label: 'Total Time', value: `${(totalMs / 1000).toFixed(1)}s` },
            { icon: Target, label: 'Avg / Hand', value: `${(avgMs / 1000).toFixed(1)}s` },
            { icon: Trophy, label: 'Accuracy', value: `${accuracy}%` },
          ].map(({ icon: Icon, label, value }) => (
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

        {/* Section 1 breakdown */}
        <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#686880' }}>
          Section 1 — Which Hand Wins?
        </p>

        <div className="space-y-3 mb-10">
          {section1Records.map((record, i) => {
            const q = section1Questions.find((q) => q.id === record.questionId);
            if (!q) return null;
            const answerLabel = ANSWER_LABELS[record.answer];
            const correctLabel = ANSWER_LABELS[q.correctAnswer];
            const answerColor = record.correct ? '#4ade80' : '#ef4444';

            return (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{
                  background: '#12121a',
                  border: `1px solid ${record.correct ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                      style={{
                        background: record.correct ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)',
                        color: record.correct ? '#4ade80' : '#ef4444',
                      }}
                    >
                      {record.correct ? '✓' : '✗'}
                    </span>
                    <span className="font-mono text-sm font-medium" style={{ color: '#e8e8f0' }}>
                      {q.title}
                    </span>
                  </div>
                  <span className="font-mono text-xs flex-shrink-0" style={{ color: '#686880' }}>
                    {(record.timeMs / 1000).toFixed(1)}s
                  </span>
                </div>

                <p className="font-mono text-xs mb-1 ml-8" style={{ color: '#686880' }}>
                  Your answer:{' '}
                  <span style={{ color: answerColor }}>{answerLabel}</span>
                </p>

                {!record.correct && (
                  <p className="font-mono text-xs mb-2 ml-8" style={{ color: '#686880' }}>
                    Correct:{' '}
                    <span style={{ color: ANSWER_COLORS[q.correctAnswer] }}>{correctLabel}</span>
                  </p>
                )}

                <p className="font-mono text-xs leading-relaxed ml-8" style={{ color: '#9898b0' }}>
                  {q.explanation}
                </p>
              </div>
            );
          })}
        </div>

        {/* Section 2 summary */}
        {section2Records.length > 0 && (
          <>
            <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#686880' }}>
              Section 2 — What's Your Play?
            </p>

            <div className="space-y-3 mb-10">
              {section2Records.map((record, i) => {
                const q = section2Questions.find((q) => q.id === record.questionId);
                if (!q) return null;
                const actionBtn = ACTION_BUTTONS.find((b) => b.key === record.action);
                const actionColor = actionBtn?.color ?? '#9898b0';

                return (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{ background: '#12121a', border: '1px solid rgba(167,139,250,0.3)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                        style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}
                      >
                        ♟
                      </span>
                      <span className="font-mono text-sm font-medium" style={{ color: '#e8e8f0' }}>
                        {q.title}
                      </span>
                    </div>
                    <p className="font-mono text-xs mb-1 ml-8" style={{ color: '#686880' }}>
                      Action: <span style={{ color: actionColor, fontWeight: 600 }}>{record.action}</span>
                    </p>
                    <p className="font-mono text-xs leading-relaxed ml-8" style={{ color: '#9898b0' }}>
                      "{record.reasoning}"
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-mono text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            style={{ background: '#1a472a', border: '1px solid #2d6a4f', color: '#4ade80' }}
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-mono text-sm uppercase tracking-widest transition-all hover:scale-105"
            style={{ background: 'transparent', border: '1px solid #2a2a3a', color: '#9898b0' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Live storage helper ───────────────────────────────────────────────────────
function updateLiveSubmission(name: string, updater: (record: SubmissionRecord) => SubmissionRecord) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: SubmissionRecord[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex(
      (s) => s.name.toLowerCase() === name.toLowerCase() && s.status === 'in_progress'
    );
    if (idx !== -1) {
      all[idx] = updater(all[idx]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  } catch {
    // ignore storage errors — Supabase sync happens independently
  }
}

/** Build a Supabase-shaped data object and push it via the serialized sync queue. */
function syncToSupabase(rec: {
  name: string; score: number; total: number; totalMs: number; avgMs: number;
  accuracy: number; completedAt?: string | null; startedAt?: string | null;
  status: string; questionsAnswered: number; currentSection?: string | null;
  answers: { questionId: number; correct: boolean; timeMs: number }[];
  section2: { questionId: number; action: string; reasoning: string }[];
}) {
  const data = {
    name: rec.name,
    score: rec.score,
    total: rec.total,
    total_ms: rec.totalMs,
    avg_ms: rec.avgMs,
    accuracy: rec.accuracy,
    completed_at: rec.completedAt || null,
    started_at: rec.startedAt || null,
    status: rec.status as 'in_progress' | 'completed',
    questions_answered: rec.questionsAnswered,
    current_section: rec.currentSection ?? null,
    answers: rec.answers,
    section2: rec.section2,
  };
  setLastSyncData(data); // store for visibility-change re-sync
  syncUpdate(data);
}

// ─── Main Poker page ───────────────────────────────────────────────────────────
type GameState = 'landing' | 'practice' | 'ready' | 'section1' | 'section_transition' | 'section2' | 'results';

export default function Poker() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [section1Index, setSection1Index] = useState(0);
  const [section2Index, setSection2Index] = useState(0);
  const [section1Records, setSection1Records] = useState<Section1Record[]>([]);
  const [section2Records, setSection2Records] = useState<Section2Record[]>([]);
  const [playerName, setPlayerName] = useState('');
  const startedAtRef = useRef('');

  // ── Refs that mirror state to avoid stale closures in callbacks ──
  const section1RecordsRef = useRef<Section1Record[]>([]);
  const section1IndexRef = useRef(0);
  const playerNameRef = useRef('');

  // Keep refs in sync with state (for use in callbacks / timeouts)
  useEffect(() => { section1RecordsRef.current = section1Records; }, [section1Records]);
  useEffect(() => { section1IndexRef.current = section1Index; }, [section1Index]);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);

  // On first load, migrate any existing localStorage data to Supabase
  useEffect(() => {
    migrateLocalStorageToSupabase();
  }, []);

  const handleStart = useCallback((name: string) => {
    setPlayerName(name);
    playerNameRef.current = name;
    setSection1Records([]);
    section1RecordsRef.current = [];
    setSection2Records([]);
    setPracticeIndex(0);
    setSection1Index(0);
    section1IndexRef.current = 0;
    setSection2Index(0);

    // Write initial record to localStorage immediately
    const startedAt = new Date().toISOString();
    startedAtRef.current = startedAt;
    const initialRecord: SubmissionRecord = {
      name,
      score: 0,
      total: section1Questions.length,
      totalMs: 0,
      avgMs: 0,
      accuracy: 0,
      startedAt,
      completedAt: '',
      status: 'in_progress',
      questionsAnswered: 0,
      currentSection: 'practice',
      answers: [],
      section2: [],
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: SubmissionRecord[] = raw ? JSON.parse(raw) : [];
      existing.push(initialRecord);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {
      // ignore storage errors
    }

    // INSERT into Supabase and store the row ID for all future updates
    setActiveRowId(null); // reset any stale ID
    insertSubmission({
      name,
      score: 0,
      total: section1Questions.length,
      total_ms: 0,
      avg_ms: 0,
      accuracy: 0,
      started_at: startedAt,
      completed_at: null,
      status: 'in_progress',
      questions_answered: 0,
      current_section: 'practice',
      answers: [],
      section2: [],
    }).then((id) => {
      if (id) {
        setActiveRowId(id);
        console.log('[poker] Supabase row ID:', id);
      } else {
        console.warn('[poker] Failed to get Supabase row ID — syncs will be lost');
      }
    });

    setGameState('practice');
  }, []);

  const handlePracticeAnswer = useCallback(
    (_answer: CorrectAnswer, _correct: boolean, _timeMs: number) => {
      if (practiceIndex + 1 >= practiceQuestions.length) {
        setGameState('ready');
      } else {
        setPracticeIndex((i) => i + 1);
      }
    },
    [practiceIndex]
  );

  const handleReadyStart = useCallback(() => {
    setSection1Index(0);
    section1IndexRef.current = 0;
    setSection1Records([]);
    section1RecordsRef.current = [];
    setGameState('section1');
  }, []);

  const handleSection1Answer = useCallback(
    (answer: CorrectAnswer, correct: boolean, timeMs: number) => {
      // Read from REFS (not state) to guarantee fresh data regardless of React batching/closures
      const idx = section1IndexRef.current;
      const prevRecords = section1RecordsRef.current;
      const name = playerNameRef.current;

      const q = section1Questions[idx];
      const newRecord: Section1Record = {
        questionId: q.id,
        answer,
        correct,
        timeMs,
      };
      const updated = [...prevRecords, newRecord];

      // Update both ref and state
      section1RecordsRef.current = updated;
      setSection1Records(updated);

      // Live update localStorage
      const answersPayload = updated.map((r) => ({ questionId: r.questionId, correct: r.correct, timeMs: r.timeMs }));
      const score = updated.filter((r) => r.correct).length;
      const totalMs = updated.reduce((s, r) => s + r.timeMs, 0);
      const avgMs = updated.length > 0 ? totalMs / updated.length : 0;
      const accuracy = updated.length > 0 ? Math.round((score / updated.length) * 100) : 0;

      updateLiveSubmission(name, (rec) => ({
        ...rec,
        answers: answersPayload,
        score,
        totalMs,
        avgMs,
        accuracy,
        questionsAnswered: updated.length,
        currentSection: 'section1' as const,
      }));

      // Sync to Supabase
      syncToSupabase({
        name,
        score,
        total: section1Questions.length,
        totalMs,
        avgMs,
        accuracy,
        startedAt: startedAtRef.current,
        completedAt: null,
        status: 'in_progress',
        questionsAnswered: updated.length,
        currentSection: 'section1',
        answers: answersPayload,
        section2: [],
      });

      // Update index ref and state
      if (idx + 1 >= section1Questions.length) {
        setGameState('section_transition');
      } else {
        section1IndexRef.current = idx + 1;
        setSection1Index(idx + 1);
      }
    },
    [] // No deps needed — everything reads from refs
  );

  const handleTransitionContinue = useCallback(() => {
    setSection2Index(0);
    setGameState('section2');
  }, []);

  const handleSection2Answer = useCallback(
    (action: string, reasoning: string) => {
      const q = section2Questions[section2Index];
      const newRecord: Section2Record = {
        questionId: q.id,
        action,
        reasoning,
      };
      const updated = [...section2Records, newRecord];
      setSection2Records(updated);

      // Live update localStorage
      const section2Payload = updated.map((r) => ({ questionId: r.questionId, action: r.action, reasoning: r.reasoning }));
      updateLiveSubmission(playerName, (rec) => ({
        ...rec,
        section2: section2Payload,
        questionsAnswered: section1Records.length + updated.length,
        currentSection: 'section2' as const,
      }));

      // Sync to Supabase DIRECTLY (independent of localStorage)
      const s1Score = section1Records.filter((r) => r.correct).length;
      const s1TotalMs = section1Records.reduce((s, r) => s + r.timeMs, 0);
      const s1AvgMs = section1Records.length > 0 ? s1TotalMs / section1Records.length : 0;
      const s1Accuracy = section1Records.length > 0 ? Math.round((s1Score / section1Records.length) * 100) : 0;
      syncToSupabase({
        name: playerName,
        score: s1Score,
        total: section1Questions.length,
        totalMs: s1TotalMs,
        avgMs: s1AvgMs,
        accuracy: s1Accuracy,
        startedAt: startedAtRef.current,
        completedAt: null,
        status: 'in_progress',
        questionsAnswered: section1Records.length + updated.length,
        currentSection: 'section2',
        answers: section1Records.map((r) => ({ questionId: r.questionId, correct: r.correct, timeMs: r.timeMs })),
        section2: section2Payload,
      });

      if (section2Index + 1 >= section2Questions.length) {
        setGameState('results');
      } else {
        setSection2Index((i) => i + 1);
      }
    },
    [section2Index, section2Records, playerName, section1Records]
  );

  const handleRestart = useCallback(() => {
    setGameState('landing');
    setPlayerName('');
  }, []);

  const section1Score = section1Records.filter((r) => r.correct).length;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        color: '#e8e8f0',
        fontFamily: 'inherit',
      }}
    >
      {/* Nav back link — only on landing */}
      {gameState === 'landing' && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12">
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest transition-colors hover:opacity-80"
            style={{ color: '#686880' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
          <Link
            to="/poker/admin"
            className="flex items-center gap-1 font-mono text-xs transition-colors hover:opacity-80"
            style={{ color: '#686880' }}
            title="Admin"
          >
            <Settings className="w-3 h-3" />
            <span>Admin</span>
          </Link>
        </div>
      )}

      {gameState === 'landing' && <Landing onStart={handleStart} />}

      {gameState === 'practice' && (
        <WhichHandWinsView
          key={`practice-${practiceIndex}`}
          question={practiceQuestions[practiceIndex]}
          index={practiceIndex}
          total={practiceQuestions.length}
          playerName={playerName}
          onAnswer={handlePracticeAnswer}
          isPractice
        />
      )}

      {gameState === 'ready' && <ReadyScreen onStart={handleReadyStart} />}

      {gameState === 'section1' && (
        <WhichHandWinsView
          key={`s1-${section1Index}`}
          question={section1Questions[section1Index]}
          index={section1Index}
          total={section1Questions.length}
          playerName={playerName}
          onAnswer={handleSection1Answer}
        />
      )}

      {gameState === 'section_transition' && (
        <SectionTransition score={section1Score} onContinue={handleTransitionContinue} />
      )}

      {gameState === 'section2' && (
        <RightPlayView
          key={`s2-${section2Index}`}
          question={section2Questions[section2Index]}
          index={section2Index}
          total={section2Questions.length}
          playerName={playerName}
          onAnswer={handleSection2Answer}
        />
      )}

      {gameState === 'results' && (
        <Results
          section1Records={section1Records}
          section2Records={section2Records}
          playerName={playerName}
          startedAt={startedAtRef.current}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
