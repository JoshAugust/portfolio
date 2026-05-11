import React from 'react';
import { GlassCard } from '../../common/GlassCard';
import { Trophy } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const StatsOverview = () => {
    const { contacts, feedItems } = useApp();

    // Calculate Stats
    const completedCount = feedItems.filter(i => i.isCompleted).length;
    const progressPercentage = Math.min(100, (completedCount / 5) * 100);
    const warmIntros = contacts.filter(c => c.connectionDegree === '2nd').length;

    return (
        <div className="space-y-6">
            {/* Progress Tile */}
            <GlassCard gradient="indigo" className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-wider">
                        <Trophy size={14} /> Social Capital
                    </div>
                    <span className="text-2xl font-bold text-white">Level 4</span>
                </div>

                <div className="mb-2 flex justify-between text-xs text-slate-400">
                    <span>Daily Momentum</span>
                    <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                    You are in the <span className="text-emerald-400 font-bold">Top 15%</span> of networkers this week. Complete 2 more actions to hit "Super Connector" status.
                </p>
            </GlassCard>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4 text-center hover:border-slate-500 transition-colors">
                    <div className="text-2xl font-bold text-white mb-1">{contacts.length}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Total Network</div>
                </GlassCard>
                <GlassCard className="p-4 text-center hover:border-slate-500 transition-colors">
                    <div className="text-2xl font-bold text-emerald-400 mb-1">{warmIntros}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Warm Intros</div>
                </GlassCard>
            </div>
        </div>
    );
};
