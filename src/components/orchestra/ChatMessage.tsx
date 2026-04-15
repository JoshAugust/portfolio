import { type ReactNode, useState } from 'react';
import { User, Bot, ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../gateway';

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
        codeLines = [];
      } else {
        elements.push(
          <pre
            key={`code-${i}`}
            className="my-2 p-3 rounded-lg text-xs overflow-x-auto"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
          >
            {codeLang && <div className="text-[10px] mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{codeLang}</div>}
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeLines = [];
        codeLang = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.trim() === '') {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    // Process inline formatting
    const formatted = formatInline(line);

    // List items
    if (/^[-*]\s/.test(line)) {
      elements.push(
        <div key={`li-${i}`} className="flex gap-2 ml-2">
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>{formatted}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={`oli-${i}`} className="flex gap-2 ml-2">
          <span style={{ color: 'var(--text-muted)' }}>{num}.</span>
          <span>{formatted}</span>
        </div>
      );
    } else {
      elements.push(<p key={`p-${i}`} className="leading-relaxed">{formatted}</p>);
    }
  }

  return elements;
}

function formatInline(text: string): (string | ReactNode)[] {
  const parts: (string | ReactNode)[] = [];
  // Simple regex-based inline formatting
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const m = match[0];
    if (m.startsWith('`')) {
      parts.push(
        <code
          key={`ic-${match.index}`}
          className="px-1.5 py-0.5 rounded text-xs"
          style={{ background: 'var(--bg-primary)', color: 'var(--corgi-orange)' }}
        >
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith('**')) {
      parts.push(<strong key={`b-${match.index}`}>{m.slice(2, -2)}</strong>);
    } else if (m.startsWith('*')) {
      parts.push(<em key={`i-${match.index}`}>{m.slice(1, -1)}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// ─── Tool Call Card ─────────────────────────────────────────────────────────

function ToolCallCard({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono"
      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
    >
      <Wrench className="w-3 h-3" style={{ color: 'var(--corgi-orange)' }} />
      {name}
    </span>
  );
}

// ─── Collapsible Tool Result ────────────────────────────────────────────────

function ToolResultBlock({ content, toolCallId }: { content: string; toolCallId?: string }) {
  const [open, setOpen] = useState(false);
  const preview = typeof content === 'string' ? content.slice(0, 120) : String(content ?? '').slice(0, 120);
  const fullContent = typeof content === 'string' ? content : String(content ?? '');

  return (
    <div
      className="my-1 rounded-md overflow-hidden text-xs"
      style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-2 py-1 cursor-pointer"
        style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <span className="font-mono text-[10px]">
          {toolCallId ? `result (${toolCallId.slice(0, 10)}…)` : 'tool result'}
        </span>
        {!open && (
          <span className="truncate ml-2 opacity-50">{preview}{fullContent.length > 120 ? '…' : ''}</span>
        )}
      </button>
      {open && (
        <pre className="p-2 text-[11px] overflow-x-auto whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
          {fullContent}
        </pre>
      )}
    </div>
  );
}

// ─── Extract display content from message ───────────────────────────────────

function extractMessageContent(message: ChatMessageType): ReactNode[] {
  const elements: ReactNode[] = [];
  const msg = message as any;

  // 1. Extract text: flat field first, then content array
  const text = message.text ?? (
    Array.isArray(msg.content)
      ? msg.content
          .filter((s: any) => s.type === 'text')
          .map((s: any) => s.text ?? '')
          .join('\n')
      : ''
  );

  if (text) {
    elements.push(...renderMarkdown(text));
  }

  // 2. Render tool calls and results from content array
  if (Array.isArray(msg.content)) {
    for (let i = 0; i < msg.content.length; i++) {
      const seg = msg.content[i];
      if (seg.type === 'toolCall' || seg.type === 'tool_use') {
        elements.push(
          <div key={`tc-${i}`} className="my-1">
            <ToolCallCard name={seg.name ?? seg.toolName ?? 'tool'} />
          </div>
        );
      }
      if (seg.type === 'toolResult' || seg.type === 'tool_result') {
        const resultContent = typeof seg.content === 'string'
          ? seg.content
          : typeof seg.result === 'string'
            ? seg.result
            : JSON.stringify(seg.content ?? seg.result ?? '', null, 2);
        elements.push(
          <ToolResultBlock
            key={`tr-${i}`}
            content={resultContent}
            toolCallId={seg.toolCallId ?? seg.tool_use_id}
          />
        );
      }
    }
  }

  // 3. Also render segments if present (our own typed segments)
  if (Array.isArray(message.segments) && elements.length === 0) {
    for (let i = 0; i < message.segments.length; i++) {
      const seg = message.segments[i];
      if (seg.type === 'text' && seg.text) {
        elements.push(...renderMarkdown(seg.text));
      }
      if (seg.type === 'tool_use' && seg.toolName) {
        elements.push(
          <div key={`seg-tc-${i}`} className="my-1">
            <ToolCallCard name={seg.toolName} />
          </div>
        );
      }
      if (seg.type === 'tool_result') {
        elements.push(
          <ToolResultBlock
            key={`seg-tr-${i}`}
            content={typeof seg.toolResult === 'string' ? seg.toolResult : JSON.stringify(seg.toolResult ?? '', null, 2)}
          />
        );
      }
    }
  }

  // 4. If still nothing, show muted placeholder
  if (elements.length === 0) {
    elements.push(
      <span key="empty" className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
        (no text content)
      </span>
    );
  }

  return elements;
}

// ─── ChatMessage Component ──────────────────────────────────────────────────

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 py-3 px-4 ${isUser ? '' : ''}`}>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: isUser ? 'var(--bg-tertiary)' : 'rgba(255,92,0,0.15)',
        }}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        ) : (
          <Bot className="w-3.5 h-3.5" style={{ color: 'var(--corgi-orange)' }} />
        )}
      </div>
      <div
        className="flex-1 min-w-0 text-sm"
        style={{
          color: 'var(--text-primary)',
          borderLeft: isUser ? 'none' : '2px solid rgba(255,92,0,0.2)',
          paddingLeft: isUser ? 0 : 12,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium" style={{ color: isUser ? 'var(--text-secondary)' : 'var(--corgi-orange)' }}>
            {isUser ? 'You' : 'Assistant'}
          </span>
          {message.timestamp && (
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {message.model && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
              {message.model}
            </span>
          )}
        </div>
        <div className="space-y-1">{extractMessageContent(message)}</div>
      </div>
    </div>
  );
}
