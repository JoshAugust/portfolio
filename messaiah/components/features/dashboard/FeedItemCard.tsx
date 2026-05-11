import React, { useState } from 'react';
import { GlassCard } from '../../common/GlassCard';
import { FeedItem, FeedItemType } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { Star, Calendar, ArrowUpRight, CheckCircle, Zap, MessageSquare, ChevronDown, ChevronUp, Sparkles, Lightbulb, MessageCircle, Lock } from 'lucide-react';
import { draftEmailAction, hasApiKey } from '../../../services/geminiService';
import ContextChat from '../../ContextChat';

interface FeedItemCardProps {
    item: FeedItem;
    isExpanded: boolean;
    onToggle: () => void;
}

export const FeedItemCard = ({ item, isExpanded, onToggle }: FeedItemCardProps) => {
    const { contacts, updateFeedItem, completeFeedItem, user } = useApp();
    const [draftingId, setDraftingId] = useState<string | null>(null);
    const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);

    const relatedContact = contacts.find(c => c.id === item.relatedContactId);

    const getIcon = (type: FeedItemType) => {
        switch (type) {
            case FeedItemType.SPONSOR_POTENTIAL: return <Star className="text-amber-400" size={20} />;
            case FeedItemType.WARM_PATH: return <Zap className="text-indigo-400" size={20} />;
            case FeedItemType.EVENT_SCOUT: return <Calendar className="text-pink-400" size={20} />;
            case FeedItemType.GRATITUDE: return <ArrowUpRight className="text-emerald-400" size={20} />;
            default: return <MessageSquare className="text-blue-400" size={20} />;
        }
    };

    const getGradient = (type: FeedItemType) => {
        switch (type) {
            case FeedItemType.SPONSOR_POTENTIAL: return 'amber';
            case FeedItemType.WARM_PATH: return 'indigo';
            case FeedItemType.EVENT_SCOUT: return 'pink';
            case FeedItemType.GRATITUDE: return 'emerald';
            default: return 'none';
        }
    };

    const handleAction = async () => {
        if (item.isCompleted) return;

        setDraftingId(item.id);
        setGeneratedDraft(null);

        if (item.relatedContactId && user) {
            const contact = contacts.find(c => c.id === item.relatedContactId);
            if (contact) {
                const draft = await draftEmailAction(contact.name, item.description, user);
                setGeneratedDraft(draft);
            }
        } else {
            setTimeout(() => {
                setGeneratedDraft("Action recorded. Angel will remind you in 7 days.");
            }, 1000);
        }
    };

    const confirmAction = () => {
        completeFeedItem(item.id);
        setDraftingId(null);
        setGeneratedDraft(null);
    };

    return (
        <GlassCard
            gradient={getGradient(item.type)}
            className={`transition-all duration-300 ${isExpanded ? 'md:col-span-2 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10' : ''}`}
        >
            {/* Main Card Content */}
            <div className="p-0">
                <div className="flex gap-4 items-start">
                    <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 shadow-inner rounded-2xl`}>
                        {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 className="text-base font-bold text-slate-100 truncate pr-4">{item.title}</h3>
                            <button
                                onClick={onToggle}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>
                        <div className="text-slate-400 text-sm mt-2 leading-relaxed whitespace-pre-wrap line-clamp-3">
                            {item.description}
                        </div>
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-white/10 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Details & Path */}
                            <div className="space-y-4 flex flex-col">
                                <div>
                                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Context & Path</h4>
                                    {relatedContact && (
                                        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800 mb-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                                                <span className="font-semibold">{relatedContact.name}</span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-slate-400">{relatedContact.role}</span>
                                            </div>
                                            <div className="text-xs text-emerald-400 font-bold mb-1">
                                                Career Fit: {relatedContact.careerFit}%
                                            </div>
                                        </div>
                                    )}
                                    {(item.rationale || item.tactics) && (
                                        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800 text-xs space-y-2">
                                            {item.rationale && (
                                                <div>
                                                    <span className="text-amber-500 font-bold flex items-center gap-1 mb-1"><Lightbulb size={10} /> WHY IT MATTERS</span>
                                                    <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{item.rationale}</div>
                                                </div>
                                            )}
                                            {item.tactics && (
                                                <div className="mt-2 pt-2 border-t border-slate-800">
                                                    <span className="text-cyan-500 font-bold flex items-center gap-1 mb-1"><MessageCircle size={10} /> TALKING POINT</span>
                                                    <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{item.tactics}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Smart Chat for Action */}
                                <div className="flex-1 min-h-[250px]">
                                    <ContextChat
                                        contextName="Action Item"
                                        data={item}
                                        mode="action"
                                        onUpdate={(updates: any) => updateFeedItem(item.id, updates)}
                                    />
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="flex flex-col h-full">
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Execution</h4>
                                <div className="flex-1 bg-slate-900/80 rounded-xl p-4 border border-slate-700 flex flex-col justify-center">
                                    {draftingId === item.id ? (
                                        <>
                                            {generatedDraft ? (
                                                <div className="space-y-3 w-full">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1"><Sparkles size={10} /> AI Draft Generated</span>
                                                    </div>
                                                    <textarea
                                                        className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-slate-300 text-sm font-mono focus:outline-none resize-none focus:border-indigo-500 transition-colors"
                                                        rows={8}
                                                        defaultValue={generatedDraft}
                                                    />
                                                    <div className="flex gap-3 justify-end">
                                                        <button
                                                            onClick={() => setDraftingId(null)}
                                                            className="text-xs text-slate-400 hover:text-white px-3 py-2 transition-colors"
                                                        >
                                                            Discard
                                                        </button>
                                                        <button
                                                            onClick={confirmAction}
                                                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-emerald-600/20"
                                                        >
                                                            <CheckCircle size={14} /> Send & Complete
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-3">
                                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-sm animate-pulse">Consulting Strategy Angel...</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="group relative w-full">
                                            <button
                                                onClick={handleAction}
                                                disabled={!hasApiKey()}
                                                className="w-full group flex items-center justify-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed py-3 rounded-lg transition-all shadow-lg shadow-indigo-600/20 disabled:shadow-none"
                                            >
                                                {hasApiKey() ? item.actionLabel : <span className="flex items-center gap-2"><Lock size={14} /> {item.actionLabel}</span>}
                                                {hasApiKey() && <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
                                            </button>
                                            {!hasApiKey() && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-900 text-xs text-white rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    Action requires Gemini Key
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action strip when collapsed */}
            {!isExpanded && !item.isCompleted && (
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-mono">High Leverage</span>
                    <button onClick={onToggle} className="text-xs text-indigo-400 hover:text-white font-medium flex items-center gap-1">
                        View Details <ArrowUpRight size={12} />
                    </button>
                </div>
            )}
        </GlassCard>
    );
};
