import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MessageSquare,
  Minus,
  ArrowUp,
  Bot,
  User,
} from 'lucide-react';
import { useProspectorStore } from '@/stores/prospectorStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlashCommand {
  cmd: string;
  description: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { cmd: '/find',   description: 'Find matching companies' },
  { cmd: '/score',  description: 'Score pipeline leads' },
  { cmd: '/enrich', description: 'Enrich contact data' },
  { cmd: '/draft',  description: 'Draft outreach email' },
  { cmd: '/export', description: 'Export results to CSV' },
  { cmd: '/status', description: 'Show pipeline status' },
];

// ─── Fake agent responses ─────────────────────────────────────────────────────

function getFakeResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('/find') || lower.includes('find'))
    return 'Found 3 companies matching your ICP: Acme Corp (Score 94), Horizon Labs (Score 88), Vertex Systems (Score 81). Running enrichment now…';
  if (lower.includes('/score') || lower.includes('score'))
    return 'Scoring pipeline… 12 companies evaluated. Top grade: Acme Corp at 94/100. 3 A-grades, 5 B-grades, 4 below threshold.';
  if (lower.includes('/enrich') || lower.includes('enrich'))
    return 'Enriching contact data for 3 companies. Pulling LinkedIn profiles, email addresses, and firmographics. ETA ~45 seconds.';
  if (lower.includes('/draft') || lower.includes('draft'))
    return 'Drafting personalised outreach for Sarah Chen at Acme Corp. Referencing their recent Series B and DevOps hiring signal. Ready to review in Outreach tab.';
  if (lower.includes('/export') || lower.includes('export'))
    return 'Exporting 8 qualified leads to CSV. File will download momentarily. Columns: Company, Contact, Email, Score, Stage.';
  if (lower.includes('/status') || lower.includes('status'))
    return 'Pipeline status: 5 companies discovered, 3 scoring, 2 enriching, 1 ready for outreach. 0 errors. Pipeline running at 1× speed.';
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey'))
    return "Hey! Ready to prospect. Describe your ideal customer or use a slash command — try /find to kick things off.";
  if (lower.includes('help'))
    return 'Available commands: /find — discover companies, /score — score leads, /enrich — pull contacts, /draft — write outreach, /export — download CSV, /status — pipeline overview.';
  return "Got it. Working on that now… Use /status to check pipeline progress or /find to discover new leads.";
}

// ─── Timestamp formatter ──────────────────────────────────────────────────────

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      {/* Avatar */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}
      >
        <Bot className="w-3 h-3" style={{ color: '#3B82F6' }} />
      </div>
      <div
        className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-bl-sm"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#3B82F6' }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ role, content, timestamp }: { role: 'user' | 'agent'; content: string; timestamp: number }) {
  const isAgent = role === 'agent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 mb-3 ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={
          isAgent
            ? { background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }
            : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }
        }
      >
        {isAgent
          ? <Bot className="w-3 h-3" style={{ color: '#3B82F6' }} />
          : <User className="w-3 h-3" style={{ color: '#a0a0b8' }} />
        }
      </div>

      <div className={`flex flex-col gap-0.5 max-w-[80%] ${isAgent ? 'items-start' : 'items-end'}`}>
        <div
          className={`px-3 py-2 text-xs leading-relaxed ${isAgent ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl rounded-br-sm'}`}
          style={
            isAgent
              ? {
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.15)',
                  color: '#c8d8ff',
                }
              : {
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e8e8f0',
                }
          }
        >
          {content}
        </div>
        <span className="text-[10px] font-mono" style={{ color: '#4a4a60' }}>
          {formatTime(timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Slash Command Picker ─────────────────────────────────────────────────────

function SlashPicker({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (cmd: string) => void;
}) {
  const filtered = SLASH_COMMANDS.filter((c) =>
    c.cmd.startsWith('/' + query.slice(1)) || query === '/'
  );

  if (filtered.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden z-10"
      style={{
        background: 'rgba(18,18,28,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="px-3 py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#4a4a60' }}>
          Commands
        </span>
      </div>
      {filtered.map((item) => (
        <button
          key={item.cmd}
          onClick={() => onSelect(item.cmd)}
          className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
          style={{ color: '#e8e8f0' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span className="text-xs font-mono font-semibold" style={{ color: '#3B82F6', minWidth: 72 }}>
            {item.cmd}
          </span>
          <span className="text-xs" style={{ color: '#686880' }}>
            {item.description}
          </span>
        </button>
      ))}
    </motion.div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { chatMessages, addMessage } = useProspectorStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showSlash = input.startsWith('/');

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    addMessage('user', trimmed);
    setInput('');
    setIsTyping(true);

    // Simulate agent thinking delay
    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      setIsTyping(false);
      addMessage('agent', getFakeResponse(trimmed));
    }, delay);
  }, [input, addMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape') {
      setInput('');
    }
  };

  const handleSlashSelect = (cmd: string) => {
    setInput(cmd + ' ');
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden"
      style={{
        width: 'min(420px, calc(100vw - 24px))',
        height: 500,
        background: 'rgba(10,10,18,0.97)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          {/* Status dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
              style={{ background: '#3B82F6' }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: '#3B82F6' }}
            />
          </span>
          <span className="text-sm font-semibold" style={{ color: '#e8e8f0', letterSpacing: '-0.01em' }}>
            Prospector Agent
          </span>
          <span
            className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            Online
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
          style={{ color: '#686880' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#686880';
          }}
          title="Minimise"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
      >
        {chatMessages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="shrink-0 px-3 pb-3 pt-2 relative"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <AnimatePresence>
          {showSlash && (
            <SlashPicker query={input} onSelect={handleSlashSelect} />
          )}
        </AnimatePresence>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message or /command…"
            className="flex-1 bg-transparent text-xs outline-none font-mono placeholder:opacity-30"
            style={{ color: '#e8e8f0' }}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default shrink-0"
            style={{ background: '#3B82F6', color: 'white' }}
            onMouseEnter={(e) => {
              if (input.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#3B82F6';
            }}
            title="Send"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[9px] font-mono text-center mt-1.5" style={{ color: '#2a2a3a' }}>
          Type / for commands · Enter to send
        </p>
      </div>
    </motion.div>
  );
}

// ─── Chat Toggle Button ───────────────────────────────────────────────────────

export function ChatToggle({
  isOpen,
  onToggle,
  unreadCount = 0,
}: {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.93 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full shadow-lg cursor-pointer transition-colors duration-200"
      style={{
        background: isOpen ? '#1d4ed8' : hovered ? '#2563eb' : '#3B82F6',
        color: 'white',
        border: 'none',
        padding: hovered && !isOpen ? '0.75rem 1.25rem' : '0.75rem',
        boxShadow: '0 4px 24px rgba(59,130,246,0.4)',
      }}
      title={isOpen ? 'Close chat' : 'Open chat'}
    >
      <MessageSquare className="w-5 h-5 shrink-0" />
      {hovered && !isOpen && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          className="text-sm font-medium whitespace-nowrap overflow-hidden"
        >
          Chat with Prospector
        </motion.span>
      )}

      {/* Unread badge */}
      {unreadCount > 0 && !isOpen && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{ background: '#ef4444', color: 'white', border: '2px solid #0a0a0f' }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {/* Red dot (no count) — always shows unread state */}
      {unreadCount === 0 && !isOpen && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
          style={{ background: '#ef4444', border: '2px solid #0a0a0f' }}
        />
      )}
    </motion.button>
  );
}

// ─── Composed Chat Widget (convenience export) ────────────────────────────────

export function ProspectorChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && <ChatPanel onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
      <ChatToggle isOpen={isOpen} onToggle={() => setIsOpen((v) => !v)} />
    </>
  );
}

export default ProspectorChat;
