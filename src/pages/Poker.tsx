import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Target, ChevronRight, RotateCcw, Spade } from 'lucide-react';
import { pokerQuestions, type PokerQuestion, type PokerOption } from '../data/pokerQuestions';

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

// ─── Card display ──────────────────────────────────────────────────────────────
function CardDisplay({ label, hand }: { label: string; hand: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#9898b0' }}>{label}</span>
      <div
        className="px-3 py-2 rounded-lg text-sm font-mono"
        style={{ background: '#1a472a', border: '1px solid #2d6a4f', color: '#e8e8f0' }}
      >
        {coloriseSuits(hand)}
      </div>
    </div>
  );
}

// ─── Answer button ─────────────────────────────────────────────────────────────
type AnswerState = 'idle' | 'correct' | 'wrong';

function AnswerButton({
  option,
  state,
  onClick,
  disabled,
}: {
  option: PokerOption;
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
    color: state === 'correct'
      ? '#22c55e'
      : state === 'wrong'
      ? '#ef4444'
      : '#e8e8f0',
    transition: 'all 0.2s ease',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-mono leading-relaxed cursor-pointer disabled:cursor-default hover:opacity-90 ${state === 'wrong' ? 'animate-shake' : ''}`}
      style={baseStyle}
    >
      {coloriseSuits(option.text)}
    </button>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────
function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full" style={{ background: '#1a472a', border: '1px solid #2d6a4f' }}>
        <Spade className="w-8 h-8" style={{ color: '#4ade80' }} />
      </div>

      <h1 className="font-display text-4xl md:text-5xl font-bold mb-3" style={{ color: '#e8e8f0' }}>
        Hold'em IQ Test
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

      <button
        onClick={onStart}
        className="flex items-center gap-2 px-8 py-3 rounded-full font-mono text-sm uppercase tracking-widest font-medium transition-all hover:scale-105 active:scale-95"
        style={{ background: '#1a472a', border: '1px solid #2d6a4f', color: '#4ade80' }}
      >
        Deal Me In
        <ChevronRight className="w-4 h-4" />
      </button>
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
  onAnswer,
}: {
  question: PokerQuestion;
  index: number;
  total: number;
  onAnswer: (selectedIndex: number, correct: boolean, timeMs: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerStates, setAnswerStates] = useState<AnswerState[]>(question.options.map(() => 'idle'));
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    setSelectedIndex(null);
    setAnswerStates(question.options.map(() => 'idle'));
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

    // Move to next after brief pause
    setTimeout(() => {
      onAnswer(idx, correct, timeMs);
    }, 1200);
  }, [question, onAnswer]);

  const progress = ((index) / total) * 100;

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 md:py-10">
      {/* Top bar */}
      <div className="w-full max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#686880' }}>
            Hand {index + 1} / {total}
          </span>
          <TimerDisplay ms={elapsed} />
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 rounded-full" style={{ background: '#2a2a3a' }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: '#4ade80' }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl mx-auto flex-1">
        <div
          className="rounded-2xl p-6 md:p-8 mb-5"
          style={{ background: '#12121a', border: '1px solid #2a2a3a' }}
        >
          {/* Title */}
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#686880' }}>
            {question.type === 'which_hand_wins' ? '🃏 Which hand wins?' : '♟ What\'s the right play?'}
          </p>
          <h2 className="font-display text-xl md:text-2xl font-semibold mb-4" style={{ color: '#e8e8f0' }}>
            {question.title}
          </h2>

          {/* Scenario box */}
          <div
            className="rounded-xl p-4 mb-4 text-sm font-mono leading-relaxed"
            style={{ background: '#1a472a', border: '1px solid #2d6a4f', color: '#e8e8f0' }}
          >
            {coloriseSuits(question.scenario)}
          </div>

          {/* Player hands */}
          {question.players && (
            <div className="flex flex-wrap gap-3 mb-4">
              {Object.entries(question.players).map(([key, hand]) => (
                <CardDisplay key={key} label={key.replace('_', ' ')} hand={hand} />
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
              state={selectedIndex !== null ? answerStates[i] : 'idle'}
              onClick={() => handleSelect(i)}
              disabled={selectedIndex !== null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────
function Results({
  records,
  questions,
  onRestart,
}: {
  records: QuestionRecord[];
  questions: PokerQuestion[];
  onRestart: () => void;
}) {
  const score = records.filter((r) => r.correct).length;
  const totalMs = records.reduce((s, r) => s + r.timeMs, 0);
  const avgMs = totalMs / records.length;
  const accuracy = Math.round((score / records.length) * 100);
  const speed = getSpeedRating(avgMs);

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
          <p className="font-mono text-sm mb-2" style={{ color: speed.color }}>
            {speed.label}
          </p>
          <p className="font-mono text-xs" style={{ color: '#686880' }}>
            Hold'em IQ Test Complete
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
type GameState = 'landing' | 'question' | 'results';

export default function Poker() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<QuestionRecord[]>([]);

  const handleStart = useCallback(() => {
    setRecords([]);
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

      {gameState === 'question' && (
        <QuestionView
          key={currentIndex}
          question={pokerQuestions[currentIndex]}
          index={currentIndex}
          total={pokerQuestions.length}
          onAnswer={handleAnswer}
        />
      )}

      {gameState === 'results' && (
        <Results
          records={records}
          questions={pokerQuestions}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
