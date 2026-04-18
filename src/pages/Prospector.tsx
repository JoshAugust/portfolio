import { Link } from 'react-router-dom';
import { ArrowLeft, Crosshair, Target, GitBranch, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ICPBuilder from '@/components/prospector/ICPBuilder';
import ResultsView from '@/components/prospector/ResultsView';
import PipelineView from '@/components/prospector/PipelineView';
import { ProspectorChat } from '@/components/prospector/ChatPanel';
import { Toaster } from 'sonner';

// ─── Red Bull Badge ──────────────────────────────────────────────────────────

function RedBullBadge() {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase"
      style={{ background: 'rgba(219,10,64,0.15)', border: '1px solid rgba(219,10,64,0.35)', color: '#DB0A40' }}
    >
      <span>⚡</span>
      <span>Powered by Red Bull</span>
    </div>
  );
}

// ─── Tab Placeholder (for Pipeline until T4 lands) ──────────────────────────

function TabPlaceholder({ label, icon: Icon }: { label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 h-full min-h-[400px] rounded-xl"
      style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <Icon className="w-6 h-6" style={{ color: '#3B82F6' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: '#9898b0' }}>{label}</p>
        <p className="text-xs mt-1" style={{ color: '#4a4a60' }}>Coming soon</p>
      </div>
    </div>
  );
}

// ─── Prospector Page ─────────────────────────────────────────────────────────

export default function ProspectorPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0f', color: '#e8e8f0' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-mono transition-colors"
          style={{ color: '#686880' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#9898b0')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#686880')}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Portfolio
        </Link>
        <RedBullBadge />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="flex items-start gap-5 mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            <Crosshair className="w-7 h-7" style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight"
              style={{ color: '#e8e8f0', letterSpacing: '-0.02em' }}
            >
              Prospector
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#686880' }}>
              AI-Powered SDR Agent
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Active
              </span>
              <span
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: '#4a4a60' }}
              >
                Red Bull Hackathon Build
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="icp" className="flex-1">
          <TabsList
            className="mb-6 h-10 p-1 rounded-xl"
            style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <TabsTrigger
              value="icp"
              className="flex items-center gap-2 text-xs font-mono data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg px-4 h-8 transition-all"
              style={{ color: '#686880' }}
            >
              <Target className="w-3.5 h-3.5" />
              Define ICP
            </TabsTrigger>
            <TabsTrigger
              value="pipeline"
              className="flex items-center gap-2 text-xs font-mono data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg px-4 h-8 transition-all"
              style={{ color: '#686880' }}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="flex items-center gap-2 text-xs font-mono data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg px-4 h-8 transition-all"
              style={{ color: '#686880' }}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="icp" className="mt-0 outline-none">
            <ICPBuilder />
          </TabsContent>

          <TabsContent value="pipeline" className="mt-0 outline-none">
            <PipelineView />
          </TabsContent>

          <TabsContent value="results" className="mt-0 outline-none">
            <ResultsView />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat overlay */}
      <ProspectorChat />
      <Toaster theme="dark" position="bottom-left" />
    </div>
  );
}
