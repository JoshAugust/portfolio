import { useState, useRef, useEffect } from 'react';
import { Send, Square, Radio, Sparkles, Code, Lightbulb, Loader2 } from 'lucide-react';
import { useChat } from '../../gateway';
import { ChatMessage } from './ChatMessage';

const SUGGESTIONS = [
  { icon: Sparkles, text: 'What can you help me with?' },
  { icon: Code, text: 'Show me recent agent activity' },
  { icon: Lightbulb, text: 'What skills do you have?' },
];

export function ChatPanel() {
  const { messages, streaming, streamText, send, abort } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || streaming) return;
    send(text);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  const isEmpty = messages.length === 0 && !streaming;

  return (
    <div className="flex flex-col h-full flex-1" style={{ background: 'var(--bg-primary)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.15)' }}>
                <Radio className="w-6 h-6" style={{ color: 'var(--corgi-orange)' }} />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Orchestra</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>AI agents working in harmony</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer hover:opacity-80"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  <s.icon className="w-3.5 h-3.5" style={{ color: 'var(--corgi-orange)' }} />
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {streaming && streamText && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  role: 'assistant',
                  text: streamText,
                  streaming: true,
                }}
              />
            )}
            {streaming && !streamText && (
              <div className="flex items-center gap-2 px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--corgi-orange)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Thinking…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2">
        <div
          className="max-w-3xl mx-auto flex items-end gap-2 rounded-xl px-3 py-2"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Send a message…"
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none py-1"
            style={{ color: 'var(--text-primary)', maxHeight: 200 }}
          />
          {streaming ? (
            <button
              onClick={abort}
              className="p-2 rounded-lg shrink-0 cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: 'var(--danger)' }}
              title="Stop"
            >
              <Square className="w-4 h-4 text-white" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 rounded-lg shrink-0 cursor-pointer transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'var(--corgi-orange)' }}
              title="Send"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
