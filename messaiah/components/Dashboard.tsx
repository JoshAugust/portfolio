import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FeedItemType } from '../types';
import { Calendar, CheckCircle } from 'lucide-react';
import { StatsOverview } from './features/dashboard/StatsOverview';
import { FeedItemCard } from './features/dashboard/FeedItemCard';

const Dashboard: React.FC = () => {
    const { feedItems, user, setActiveContext, contacts, isPaused, setAngelsPaused } = useApp();
    const [expandedFeedId, setExpandedFeedId] = useState<string | null>(null);

    // Update Context on mount
    useEffect(() => {
        setActiveContext("Dashboard - Reviewing Daily Actions & Game Plan");
    }, [setActiveContext]);

    const activeItems = feedItems.filter(i => !i.isCompleted);

    const toggleExpand = (id: string, contactName: string) => {
        if (expandedFeedId === id) {
            setExpandedFeedId(null);
            setActiveContext("Dashboard");
        } else {
            setExpandedFeedId(id);
            setActiveContext(`Dashboard - Analyzing Opportunity with ${contactName}`);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-24">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{user?.name || "War Room"}</h2>
                    <p className="text-slate-400 mt-1">Execute your high-leverage moves for today.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Angel Control */}
                    <button
                        onClick={() => setAngelsPaused(!isPaused)}
                        className={`flex items-center gap-2 text-xs font-bold py-1.5 px-3 rounded-full border transition-all ${isPaused ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-cyan-400 animate-pulse'}`}></div>
                        ANGELS: {isPaused ? 'PAUSED' : 'RUNNING'}
                    </button>

                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-900 py-2 px-4 rounded-full border border-slate-800">
                        <Calendar size={14} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Col: Gamification / Stats */}
                <StatsOverview />

                {/* Right Col: The Feed Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
                    <div className="md:col-span-2 flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">Priority Actions</h3>
                        <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">{activeItems.length}</span>
                    </div>

                    {activeItems.length === 0 && (
                        <div className="md:col-span-2 text-center p-12 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed animate-in fade-in">
                            <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                            <h3 className="text-xl text-white font-medium">All caught up!</h3>
                            <p className="text-slate-400">You've executed all strategic moves for today.</p>
                        </div>
                    )}

                    {activeItems.map((item) => {
                        const relatedContact = contacts.find(c => c.id === item.relatedContactId);
                        const isExpanded = expandedFeedId === item.id;

                        return (
                            <div className={isExpanded ? "md:col-span-2" : ""} key={item.id}>
                                <FeedItemCard
                                    item={item}
                                    isExpanded={isExpanded}
                                    onToggle={() => toggleExpand(item.id, relatedContact?.name || 'Item')}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;