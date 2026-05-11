import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Users, Network, Settings, Loader2, Brain, Globe, Calendar, RefreshCw, Pause, Play } from 'lucide-react';
import { AngelState } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import ApiKeyInput from './common/ApiKeyInput';
import ProfileSettings from './ProfileSettings';

interface LayoutProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  children: React.ReactNode;
}

const AngelTile = ({ agent, icon: Icon, color }: { agent: AngelState, icon: any, color: 'purple' | 'cyan' | 'emerald' }) => {
  const isWorking = agent.status === 'thinking' || agent.status === 'working';
  const isSuccess = agent.status === 'success';
  const isPaused = agent.status === 'paused';

  const colorStyles = {
    purple: {
      bg: "bg-purple-900/20",
      border: "border-purple-500/50",
      text: "text-purple-400",
      dot: "bg-purple-500",
      pulse: "bg-purple-500/5"
    },
    cyan: {
      bg: "bg-cyan-900/20",
      border: "border-cyan-500/50",
      text: "text-cyan-400",
      dot: "bg-cyan-500",
      pulse: "bg-cyan-500/5"
    },
    emerald: {
      bg: "bg-emerald-900/20",
      border: "border-emerald-500/50",
      text: "text-emerald-400",
      dot: "bg-emerald-500",
      pulse: "bg-emerald-500/5"
    }
  };

  const style = colorStyles[color];

  return (
    <div className={twMerge(
      "p-3 rounded-lg border transition-all duration-500 relative overflow-hidden mb-3",
      (isWorking || isSuccess) ? `${style.bg} ${style.border}` :
        isPaused ? 'bg-slate-900 border-slate-800 opacity-60' :
          'bg-slate-800/40 border-slate-700/50'
    )}>
      {isWorking && <div className={`absolute inset-0 ${style.pulse} animate-pulse`}></div>}
      <div className="relative z-10 flex items-start gap-3">
        <div className={clsx(
          "p-2 rounded bg-slate-900 border border-slate-800 shrink-0",
          isWorking ? style.text : 'text-slate-500'
        )}>
          {isWorking ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <span className={clsx(
              "text-xs font-bold uppercase tracking-wider",
              (isWorking || isSuccess) ? style.text : 'text-slate-400'
            )}>
              {agent.name}
            </span>
            {isWorking && <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`}></span>}
          </div>
          <p className={clsx(
            "text-[10px] leading-tight truncate",
            isWorking ? 'text-slate-200' : 'text-slate-500'
          )}>
            {agent.currentTask}
          </p>
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children }) => {
  const { user, angels, triggerAngels, isAngelWorking, togglePauseAngels, isPaused, logout } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Action Dashboard', icon: LayoutDashboard },
    { id: 'crm', label: 'Network Grid', icon: Users },
    { id: 'galaxy', label: 'The Galaxy', icon: Network },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

      {/* Settings Modal */}
      <ProfileSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Sidebar */}
      <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          {/* Modern Minimalist Logo */}
          <div className="flex items-center gap-2 group select-none cursor-default">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-950 font-bold tracking-tighter text-lg shadow-[0_0_15px_rgba(255,255,255,0.3)]">m</div>
            <span className="font-light text-xl text-white tracking-tight font-mono">mess.ai.ah</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                )}
              >
                <Icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Angels</span>
            <div className="flex gap-2">
              <button
                onClick={togglePauseAngels}
                className={`${isPaused ? 'text-amber-400' : 'text-slate-500'} hover:text-white transition-colors`}
                title={isPaused ? "Resume Angels" : "Pause Angels"}
              >
                {isPaused ? <Play size={12} /> : <Pause size={12} />}
              </button>
              <button
                onClick={triggerAngels}
                disabled={isAngelWorking || isPaused}
                className="text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
                title="Force Sync Angels"
              >
                <RefreshCw size={12} className={isAngelWorking ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <AngelTile agent={angels.strategy} icon={Brain} color="purple" />
          <AngelTile agent={angels.network} icon={Globe} color="cyan" />
          <AngelTile agent={angels.events} icon={Calendar} color="emerald" />

          <button
            onClick={togglePauseAngels}
            className={clsx(
              "w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded border text-xs font-bold uppercase tracking-wide transition-colors",
              isPaused
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            )}
          >
            {isPaused ? <><Play size={12} /> Resume Angels</> : <><Pause size={12} /> Pause Angels</>}
          </button>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-4 justify-between">
            <div className="flex items-center gap-3 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsSettingsOpen(true)} title="Edit Configuration">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-cyan-500/20 shrink-0">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-white truncate flex items-center gap-2">
                  {user?.name}
                  <Settings size={10} className="text-slate-500" />
                </div>
                <div className="text-xs text-slate-500 truncate">{user?.title}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="text-slate-600 hover:text-red-400 transition-colors p-1"
              title="Sign Out"
            >
              <div className="sr-only">Logout</div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>

          <div className="px-2">
            <ApiKeyInput />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-950 relative">
        {children}
      </main>
    </div>
  );
};

export default Layout;