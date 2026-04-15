import type { ReactNode } from 'react';
import { User, Bot } from 'lucide-react';
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
        <div className="space-y-1">{renderMarkdown(message.text)}</div>
      </div>
    </div>
  );
}
