import { useState, useMemo } from 'react';
import { Activity, Cpu, Users, Settings, Monitor, BarChart3 } from 'lucide-react';
import { useCapacity } from '../../gateway';
import { RunsTab } from './tabs/RunsTab';
import { AgentsTab } from './tabs/AgentsTab';
import { FleetTab } from './tabs/FleetTab';
import { ControlTab } from './tabs/ControlTab';
import { SystemTab } from './tabs/SystemTab';
import { UsageTab } from './tabs/UsageTab';

// ─── Glow helper ─────────────────────────────────────────────────────────────

function glowStyle(current: number, max: number): React.CSSProperties {
  if (current === 0) return {};
  const ratio = current / max;
  let level: number;
  let duration: string;
  if (ratio >= 1.0)       { level = 4; duration = '0.8s'; }
  else if (ratio >= 0.75) { level = 3; duration = '1.2s'; }
  else if (ratio >= 0.5)  { level = 2; duration = '1.8s'; }
  else                    { level = 1; duration = '2.5s'; }
  return { animation: `amber-glow-${level} ${duration} ease-in-out infinite` };
}

const TABS = [
  { id: 'runs', label: 'Runs', icon: Activity },
  { id: 'agents', label: 'Agents', icon: Cpu },
  { id: 'fleet', label: 'Fleet', icon: Users },
  { id: 'control', label: 'Control', icon: Settings },
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('runs');
  const { subAgents } = useCapacity();
  const containerGlow = useMemo(
    () => glowStyle(subAgents.current, subAgents.max),
    [subAgents.current, subAgents.max],
  );

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 350,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-subtle)',
        ...containerGlow,
      }}
    >
      {/* Tab bar */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer transition-colors relative"
              style={{ color: isActive ? 'var(--corgi-orange)' : 'var(--text-muted)' }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ background: 'var(--corgi-orange)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'runs' && <RunsTab />}
        {activeTab === 'agents' && <AgentsTab />}
        {activeTab === 'fleet' && <FleetTab />}
        {activeTab === 'control' && <ControlTab />}
        {activeTab === 'system' && <SystemTab />}
        {activeTab === 'usage' && <UsageTab />}
      </div>
    </div>
  );
}
