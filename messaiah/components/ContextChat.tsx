import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Lock } from 'lucide-react';
import { processContextualUpdate, hasApiKey } from '../services/geminiService';

interface ContextChatProps {
    data: any;
    onUpdate: (updates: any) => void;
    mode: 'contact' | 'action';
    contextName: string;
}

const ContextChat: React.FC<ContextChatProps> = ({ data, onUpdate, mode, contextName }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const result = await processContextualUpdate(data, userMsg, mode);

            if (result.updates && Object.keys(result.updates).length > 0) {
                onUpdate(result.updates);
            }

            setHistory(prev => [...prev, { role: 'model', text: result.reply || "Updated." }]);
        } catch (error) {
            setHistory(prev => [...prev, { role: 'model', text: "Failed to connect to the ether." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[300px] bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden">
            <div className="bg-slate-900/80 px-3 py-2 border-b border-slate-800 flex items-center gap-2">
                <Sparkles size={12} className="text-cyan-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Context Chat: {contextName}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                {history.length === 0 && (
                    <div className="text-center text-xs text-slate-600 mt-4 italic">
                        Ask me to update this {mode}, rewrite notes, or change status...
                    </div>
                )}
                {history.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs ${msg.role === 'user'
                            ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {hasApiKey() ? (
                <form onSubmit={handleSend} className="p-2 bg-slate-900 border-t border-slate-800 flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={`Update ${mode}...`}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-md transition-colors"
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                </form>
            ) : (
                <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
                    <span className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <Lock size={10} /> Smart updates require API Key
                    </span>
                </div>
            )}
        </div>
    );
};

export default ContextChat;