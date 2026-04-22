import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Target, ChevronRight, RotateCcw, Spade } from 'lucide-react';
import { pokerQuestions, practiceQuestions, type PokerQuestion, type PokerOption } from '../data/pokerQuestions';

// ─── Storage key ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'mbat-poker-submissions';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SubmissionRecord {
  name: string;
  score: number;
  total: number;
  totalMs: number;
  avgMs: number;
  accuracy: number;
  completedAt: string;
  answers: { questionId: number; correct: boolean; timeMs: number }[];
}

// ─── Card parser ───────────────────────────────────────────────────────────────
const RANK_MAP: Record<string, string> = {
  A: 'A', K: 'K', Q: 'Q', J: 'J', T: '0',
  '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9',
};
const SUIT_MAP: Record<string, string> = {
  '♠': 'S', '♥': 'H', '♦': 'D', '♣': 'C',
};

interface ParsedCard {
  rank: string;
  suit: string;
  imageUrl: string;
}

function parseCards(text: string): ParsedCard[] {
  const regex = /([AKQJT2-9])([♠♥♦♣])/g;
  const results: ParsedCard[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const rank = RANK_MAP[match[1]] ?? match[1];
    const suit = SUIT_MAP[match[2]] ?? match[2];
    results.push({
      rank: match[1],
      suit: match[2],
      imageUrl: `https://deckofcardsapi.com/static/img/${rank}${suit}.png`,
    });
  }
  return results;
}

// Extract board cards from scenario — only looks for "board shows:" / "board runs out:" patterns
function parseBoardCards(scenario: string): ParsedCard[] {
  const boardMatch = scenario.match(/board (?:shows|runs out):\s*([^.]+)/i);
  if (!boardMatch) return [];
  return parseCards(boardMatch[1]);
}

// Strip card tokens and return the remaining text (e.g. "(Fours full of Eights)")
function remainingText(text: string): string {
  return text.replace(/[AKQJT2-9][♠♥♦♣]/g, '').trim();
}

// ─── Player colour helpers ─────────────────────────────────────────────────────
function getPlayerColor(key: string): string {
  const k = key.toLowerCase().replace('_', '');
  if (k === 'playera' || k === 'you') return '#60a5fa';
  if (k === 'playerb' || k === 'opponent') return '#f472b6';
  return '#9898b0';
}

function getPlayerLabel(key: string): string {
  return key.replace(/_/g, ' ').toUpperCase();
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

// ─── Answer text coloriser (player names + suits) ──────────────────────────────
function coloriseAnswerText(text: string): React.ReactNode {
  const pattern = /(Player A|Player B|Opponent|You(?= wins| win))/g;
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) => {
        if (part === 'Player A') {
          return <strong key={i} style={{ color: '#60a5fa' }}>{part}</strong>;
        }
        if (part === 'Player B') {
          return <strong key={i} style={{ color: '#f472b6' }}>{part}</strong>;
        }
        if (part === 'You') {
          return <strong key={i} style={{ color: '#60a5fa' }}>{part}</strong>;
        }
        if (part === 'Opponent') {
          return <strong key={i} style={{ color: '#f472b6' }}>{part}</strong>;
        }
        return <span key={i}>{coloriseSuits(part)}</span>;
      })}
    </>
  );
}

// ─── Speed rating helper ───────────────────────────────────────────────────────
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

// ─── Card display (with images) ────────────────────────────────────────────────
function CardDisplay({ label, hand, playerKey }: { label: string; hand: string; playerKey?: string }) {
  const cards = parseCards(hand);
  const extra = remainingText(hand);
  const color = playerKey ? getPlayerColor(playerKey) : '#9898b0';

  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <span
        className="text-xs font-mono uppercase tracking-widest"
        style={{ color }}
      >
        {label}
      </span>
      <div
        className="px-3 py-2 rounded-lg inline-flex"
        style={{ background: '#1a472a', border: `1px solid ${color}40` }}
      >
        <div className="flex items-center flex-wrap gap-1">
          {cards.map((card, i) => (
            <img
              key={i}
              src={card.imageUrl}
              alt={`${card.rank}${card.suit}`}
              style={{
                height: '60px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                display: 'block',
              }}
              className="md:h-[60px] h-[50px]"
            />
          ))}
          {extra && (
            <span className="font-mono text-xs ml-1" style={{ color: '#9898b0' }}>{extra}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Board card row ────────────────────────────────────────────────────────────
function BoardDisplay({ cards }: { cards: ParsedCard[] }) {
  if (cards.length === 0) return null;
  return (
    <div className="flex flex-col gap-1 mb-3">
      <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#4ade80' }}>
        Board
      </span>
      <div
        className="px-3 py-2 rounded-lg inline-flex"
        style={{ background: '#0d2e1a', border: '1px solid #2d6a4f' }}
      >
        <div className="flex items-center flex-wrap gap-1">
          {cards.map((card, i) => (
            <img
              key={i}
              src={card.imageUrl}
              alt={`${card.rank}${card.suit}`}
              style={{
                height: '60px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                display: 'block',
              }}
              className="md:h-[60px] h-[50px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Answer button ─────────────────────────────────────────────────────────────
type AnswerState = 'idle' | 'correct' | 'wrong';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function AnswerButton({
  option,
  index,
  state,
  onClick,
  disabled,
}: {
  option: PokerOption;
  index: number;
  state: AnswerState;
  onClick: () => void;
  disabled: boolean;
}) {
  const baseStyle: React.CSSProperties = {
    background: state === 'correct'
      ? 'rgba(34,197,94,0.15)'
      : state === 'wrong'
      ? 'rgba(239,68,68,0.15)'
      : 'rgba(255,255,255,0.04)',
    border: state === 'correct'
      ? '1px solid #22c55e'
      : state === 'wrong'
      ? '1px solid #ef4444'
      : '1px solid rgba(255,255,255,0.1)',
    borderLeft: state === 'correct'
      ? '3px solid #22c55e'
      : state === 'wrong'
      ? '3px solid #ef4444'
      : '3px solid rgba(255,255,255,0.15)',
    color: state === 'correct'
      ? '#22c55e'
      : state === 'wrong'
      ? '#ef4444'
      : '#e8e8f0',
    transition: 'all 0.2s ease',
  };

  const letterColor = state === 'correct'
    ? '#22c55e'
    : state === 'wrong'
    ? '#ef4444'
    : '#686880';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-mono leading-relaxed cursor-pointer disabled:cursor-default hover:opacity-90 flex items-start gap-3 ${state === 'wrong' ? 'animate-shake' : ''}`}
      style={baseStyle}
    >
      <span
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold mt-0.5"
        style={{ background: 'rgba(255,255,255,0.06)', color: letterColor, fontFamily: 'monospace' }}
      >
        {OPTION_LETTERS[index] ?? String(index + 1)}
      </span>
      <span>{coloriseAnswerText(option.text)}</span>
    </button>
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

    // Check for duplicate name in localStorage
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
      <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full" style={{ background: '#1a472a', border: '1px solid #2d6a4f' }}>
        <Spade className="w-8 h-8" style={{ color: '#4ade80' }} />
      </div>

      <h1 className="font-display text-4xl md:text-5xl font-bold mb-3" style={{ color: '#e8e8f0' }}>
        MBAT Poker
      </h1>
      <p className="font-mono text-sm mb-10" style={{ color: '#9898b0' }}>
        10 hands. Every second counts.
      </p>

      <div
        className="w-full max-w-md mb-10 rounded-xl p-6 text-left"
        style={{ background: '#12121a', border: '1px solid #2a2a3a' }}
      >
        <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#686880' }}>Rules</p>
        <ul className="space-y-3">
          {[
            'Each hand is a multiple-choice question',
            'Timer starts immediately — speed affects your rating',
            'No email required, no signup, just play',
            'Your results + explanations appear at the end',
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

// ─── Question ─────────────────────────────────────────────────────────────────
interface QuestionRecord {
  questionId: number;
  selectedIndex: number;
  correct: boolean;
  timeMs: number;
}

function QuestionView({
  question,
  index,
  total,
  playerName,
  onAnswer,
  isPractice,
}: {
  question: PokerQuestion;
  index: number;
  total: number;
  playerName: string;
  onAnswer: (selectedIndex: number, correct: boolean, timeMs: number) => void;
  isPractice?: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerStates, setAnswerStates] = useState<AnswerState[]>(question.options.map(() => 'idle'));
  const [showExplanation, setShowExplanation] = useState(false);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    setSelectedIndex(null);
    setAnswerStates(question.options.map(() => 'idle'));
    setShowExplanation(false);
    answeredRef.current = false;

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question]);

  const handleSelect = useCallback((idx: number) => {
    if (answeredRef.current) return;
    answeredRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);
    const timeMs = Date.now() - startRef.current;
    const correct = question.options[idx].correct;

    setSelectedIndex(idx);

    const newStates: AnswerState[] = question.options.map((opt, i) => {
      if (i === idx) return correct ? 'correct' : 'wrong';
      if (opt.correct) return 'correct';
      return 'idle';
    });
    setAnswerStates(newStates);

    if (isPractice) {
      // Show explanation for 3s then advance
      setShowExplanation(true);
      setTimeout(() => {
        onAnswer(idx, correct, timeMs);
      }, 3000);
    } else {
      // Move to next after brief pause
      setTimeout(() => {
        onAnswer(idx, correct, timeMs);
      }, 1200);
    }
  }, [question, onAnswer, isPractice]);

  const progress = ((index) / total) * 100;
  const boardCards = parseBoardCards(question.scenario);
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
            <span className="font-mono text-xs uppercase tracking-widest" style={{ color: isPractice ? '#fbbf24' : '#686880' }}>
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
        {/* Progress bar */}
        <div className="w-full h-1 rounded-full" style={{ background: '#2a2a3a' }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: progressBarColor }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl mx-auto flex-1">
        <div
          className="rounded-2xl p-5 md:p-7 mb-5"
          style={{
            background: '#12121a',
            border: isPractice ? '1px solid rgba(251,191,36,0.25)' : '1px solid #2a2a3a',
          }}
        >
          {/* Type badge — no title */}
          <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#686880' }}>
            {question.type === 'which_hand_wins' ? '🃏 Which hand wins?' : '♟ What\'s the right play?'}
          </p>

          {/* Board cards (if any extracted from scenario) */}
          <BoardDisplay cards={boardCards} />

          {/* Scenario box */}
          <div
            className="rounded-xl px-4 py-3 mb-4 text-sm font-mono leading-relaxed"
            style={{ background: '#1a472a', border: '1px solid #2d6a4f', color: '#e8e8f0' }}
          >
            {coloriseSuits(question.scenario)}
          </div>

          {/* Player hands — side by side on sm+ */}
          {question.players && (
            <div className="flex flex-col sm:flex-row gap-3 mb-2">
              {Object.entries(question.players).map(([key, hand]) => (
                <CardDisplay
                  key={key}
                  label={getPlayerLabel(key)}
                  hand={hand}
                  playerKey={key}
                />
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options.map((opt, i) => (
            <AnswerButton
              key={i}
              option={opt}
              index={i}
              state={selectedIndex !== null ? answerStates[i] : 'idle'}
              onClick={() => handleSelect(i)}
              disabled={selectedIndex !== null}
            />
          ))}
        </div>

        {/* Practice explanation — shown after answering */}
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

// ─── Ready screen ─────────────────────────────────────────────────────────────
function ReadyScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full" style={{ background: '#1a472a', border: '1px solid #2d6a4f' }}>
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
  records,
  questions,
  playerName,
  onRestart,
}: {
  records: QuestionRecord[];
  questions: PokerQuestion[];
  playerName: string;
  onRestart: () => void;
}) {
  const score = records.filter((r) => r.correct).length;
  const totalMs = records.reduce((s, r) => s + r.timeMs, 0);
  const avgMs = totalMs / records.length;
  const accuracy = Math.round((score / records.length) * 100);
  const speed = getSpeedRating(avgMs);

  // Save to localStorage on mount
  useEffect(() => {
    const submission: SubmissionRecord = {
      name: playerName,
      score,
      total: records.length,
      totalMs,
      avgMs,
      accuracy,
      completedAt: new Date().toISOString(),
      answers: records.map((r) => ({
        questionId: r.questionId,
        correct: r.correct,
        timeMs: r.timeMs,
      })),
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: SubmissionRecord[] = raw ? JSON.parse(raw) : [];
      existing.push(submission);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {
      // ignore storage errors
    }
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
            {score}/{records.length}
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

        {/* Hand-by-hand breakdown */}
        <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#686880' }}>
          Hand-by-Hand Breakdown
        </p>

        <div className="space-y-3 mb-10">
          {records.map((record, i) => {
            const q = questions[i];
            const selectedOption = q.options[record.selectedIndex];
            return (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{
                  background: '#12121a',
                  border: `1px solid ${record.correct ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  animationDelay: `${i * 60}ms`,
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

                <p className="font-mono text-xs mb-2 ml-8" style={{ color: '#686880' }}>
                  Your answer: <span style={{ color: record.correct ? '#4ade80' : '#ef4444' }}>
                    {coloriseSuits(selectedOption.text)}
                  </span>
                </p>

                <p className="font-mono text-xs leading-relaxed ml-8" style={{ color: '#9898b0' }}>
                  {q.explanation}
                </p>
              </div>
            );
          })}
        </div>

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

// ─── Main Poker page ───────────────────────────────────────────────────────────
type GameState = 'landing' | 'practice' | 'ready' | 'question' | 'results';

export default function Poker() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [records, setRecords] = useState<QuestionRecord[]>([]);
  const [playerName, setPlayerName] = useState('');

  const handleStart = useCallback((name: string) => {
    setPlayerName(name);
    setRecords([]);
    setCurrentIndex(0);
    setPracticeIndex(0);
    setGameState('practice');
  }, []);

  const handlePracticeAnswer = useCallback(
    (_selectedIndex: number, _correct: boolean, _timeMs: number) => {
      // Practice answers are NOT recorded
      if (practiceIndex + 1 >= practiceQuestions.length) {
        setGameState('ready');
      } else {
        setPracticeIndex(practiceIndex + 1);
      }
    },
    [practiceIndex]
  );

  const handleReadyStart = useCallback(() => {
    setCurrentIndex(0);
    setGameState('question');
  }, []);

  const handleAnswer = useCallback(
    (selectedIndex: number, correct: boolean, timeMs: number) => {
      const newRecord: QuestionRecord = {
        questionId: pokerQuestions[currentIndex].id,
        selectedIndex,
        correct,
        timeMs,
      };
      const updatedRecords = [...records, newRecord];
      setRecords(updatedRecords);

      if (currentIndex + 1 >= pokerQuestions.length) {
        setGameState('results');
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    },
    [currentIndex, records]
  );

  const handleRestart = useCallback(() => {
    setGameState('landing');
    setPlayerName('');
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        color: '#e8e8f0',
        fontFamily: 'inherit',
      }}
    >
      {/* Nav back link */}
      {gameState === 'landing' && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center px-6 py-5 md:px-12">
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest transition-colors hover:opacity-80"
            style={{ color: '#686880' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>
      )}

      {gameState === 'landing' && <Landing onStart={handleStart} />}

      {gameState === 'practice' && (
        <QuestionView
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

      {gameState === 'question' && (
        <QuestionView
          key={currentIndex}
          question={pokerQuestions[currentIndex]}
          index={currentIndex}
          total={pokerQuestions.length}
          playerName={playerName}
          onAnswer={handleAnswer}
        />
      )}

      {gameState === 'results' && (
        <Results
          records={records}
          questions={pokerQuestions}
          playerName={playerName}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
