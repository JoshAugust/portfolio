import { useState, lazy, Suspense } from 'react';
import { useFormFlow } from '../context/FormFlowContext';
import { ComparisonHeader } from './ComparisonHeader';

// B2 and B3 components — stub files are in place; full implementations
// will be delivered by those agents and will replace these stubs.
const TraditionalForm = lazy(() => import('./traditional/TraditionalForm'));
const AIForm = lazy(() => import('./ai/AIForm'));

const FormSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4" aria-hidden="true">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-10 rounded bg-[#1E2333]" />
    ))}
  </div>
);

type ActiveTab = 'traditional' | 'ai';

export function FormComparison() {
  const { stats } = useFormFlow();
  const [activeTab, setActiveTab] = useState<ActiveTab>('traditional');

  return (
    <section
      id="formflow-comparison"
      className="w-full"
      aria-label="Form comparison"
    >
      <ComparisonHeader stats={stats} />

      <div className="max-w-[1240px] mx-auto px-4 py-6">
        {/* ── Mobile tab switcher — visible below md ── */}
        <div
          className="flex md:hidden rounded-lg border border-[#2A3045] overflow-hidden mb-6"
          role="tablist"
          aria-label="Switch between form types"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'traditional'}
            aria-controls="panel-traditional"
            id="tab-traditional"
            onClick={() => setActiveTab('traditional')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'traditional'
                ? 'bg-[#2A3045] text-[#F0F2F8]'
                : 'text-[#8B92A8] hover:text-[#F0F2F8]'
            }`}
          >
            Traditional
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'ai'}
            aria-controls="panel-ai"
            id="tab-ai"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'ai'
                ? 'bg-[#2A3045] text-[#F0F2F8]'
                : 'text-[#8B92A8] hover:text-[#F0F2F8]'
            }`}
          >
            AI-Enhanced <span className="text-[#6C63FF]">✦</span>
          </button>
        </div>

        {/* ── Mobile panels — single column ── */}
        <div className="md:hidden">
          <div
            id="panel-traditional"
            role="tabpanel"
            aria-labelledby="tab-traditional"
            hidden={activeTab !== 'traditional'}
            className="rounded-xl border border-[#2A3045] bg-[#1A1814] overflow-hidden"
          >
            <Suspense fallback={<FormSkeleton />}>
              <TraditionalForm />
            </Suspense>
          </div>
          <div
            id="panel-ai"
            role="tabpanel"
            aria-labelledby="tab-ai"
            hidden={activeTab !== 'ai'}
            className="rounded-xl border border-[#6C63FF]/30 bg-[#141824] overflow-hidden"
          >
            <Suspense fallback={<FormSkeleton />}>
              <AIForm />
            </Suspense>
          </div>
        </div>

        {/* ── Tablet (md–lg) — stacked ── */}
        <div className="hidden md:flex lg:hidden flex-col gap-6">
          <div className="rounded-xl border border-[#2A3045] bg-[#1A1814] overflow-hidden">
            <Suspense fallback={<FormSkeleton />}>
              <TraditionalForm />
            </Suspense>
          </div>
          <div className="rounded-xl border border-[#6C63FF]/30 bg-[#141824] overflow-hidden">
            <Suspense fallback={<FormSkeleton />}>
              <AIForm />
            </Suspense>
          </div>
        </div>

        {/* ── Desktop side-by-side — visible at ≥1024px ── */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4 relative">
          {/* Traditional panel */}
          <div className="rounded-xl border border-[#2A3045] bg-[#1A1814] overflow-hidden">
            <Suspense fallback={<FormSkeleton />}>
              <TraditionalForm />
            </Suspense>
          </div>

          {/* VS badge — with dark-mode glow */}
          <div
            className="absolute left-1/2 top-12 -translate-x-1/2 z-10"
            aria-hidden="true"
          >
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0D0F14] border border-[#6C63FF]/50 text-xs font-bold text-[#6C63FF]"
              style={{
                boxShadow: '0 0 12px rgba(108, 99, 255, 0.35), 0 0 24px rgba(108, 99, 255, 0.15), inset 0 1px 0 rgba(108, 99, 255, 0.1)',
              }}
            >
              VS
            </span>
          </div>

          {/* AI panel */}
          <div className="rounded-xl border border-[#6C63FF]/30 bg-[#141824] overflow-hidden">
            <Suspense fallback={<FormSkeleton />}>
              <AIForm />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
