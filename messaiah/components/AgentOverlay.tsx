import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getChatSession, hasApiKey } from '../services/geminiService';
import { X, Send, Sparkles, Cpu, MessageSquare, Lock } from 'lucide-react';
import { ContactRole } from '../types';

const AgentOverlay: React.FC = () => {
  const { chatHistory, addChatMessage, activeContext, addContact, setAngelsPaused } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto-pause angels when menu opens to focus resources/attention
      // And importantly to allow safe configuration/resetting
      setAngelsPaused(true);
    }
  }, [chatHistory, isOpen, isTyping, setAngelsPaused]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    addChatMessage(userText, 'user');
    setIsTyping(true);

    try {
      const apiHistory = chatHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const chat = getChatSession(apiHistory, activeContext);
      let result = await chat.sendMessage({ message: userText });

      const functionCalls = result.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === 'addContact') {
            const args = call.args as any;
            addContact({
              id: `c-${Date.now()}`,
              name: args.name,
              role: args.role,
              company: args.company,
              type: (args.type as ContactRole) || ContactRole.PEER,
              influenceScore: 50,
              notes: args.notes || "Added via Agent",
              lastContactDate: new Date().toISOString(),
              avatarSeed: Math.floor(Math.random() * 1000),
              connectionStrength: 50,
              connectionDegree: '1st',
              discoveryScore: 10,
              careerFit: 50
            });

            result = await chat.sendMessage({
              message: [{
                functionResponse: {
                  id: call.id,
                  name: call.name,
                  response: { result: "Contact added successfully to CRM." }
                }
              }]
            });
          }
        }
      }

      setIsTyping(false);
      addChatMessage(result.text || "Done.", 'model');

    } catch (error) {
      console.error(error);
      setIsTyping(false);
      addChatMessage("My connection to the ether is weak. Try again.", 'model');
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-[0_0_20px_rgba(8,145,178,0.4)] flex items-center justify-center transition-transform hover:scale-110 z-50 border border-cyan-400/20"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Chat Interface */}
      <div
        className={`fixed bottom-6 right-6 w-full max-w-[380px] h-[600px] max-h-[80vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col transition-all duration-300 transform origin-bottom-right overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-violet-600 p-4 flex justify-between items-center shrink-0 shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">mess.ai.ah</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <p className="text-cyan-100 text-[10px] font-mono uppercase tracking-wide truncate max-w-[150px]">
                  {activeContext}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                  ? 'bg-slate-800 text-white rounded-br-none border border-slate-700'
                  : 'bg-gradient-to-br from-cyan-900/20 to-violet-900/20 text-slate-200 border border-slate-800 rounded-bl-none'
                  }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          {hasApiKey() ? (
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Seek guidance..."
                className="w-full bg-slate-950 text-white text-sm rounded-xl border border-slate-700 pl-4 pr-12 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none placeholder:text-slate-600 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 text-sm">
              <Lock size={14} />
              <span>Chat requires API Key</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AgentOverlay;