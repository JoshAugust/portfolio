import { FormFlowProvider } from './context/FormFlowContext';
import { FormFlowHero } from './components/FormFlowHero';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { FormComparison } from './components/FormComparison';
import { ComparisonStats } from './components/ComparisonStats';
import { FormFlowNarrative } from './components/FormFlowNarrative';
import { FormFlowFooter } from './components/FormFlowFooter';

export default function FormFlowPage() {
  return (
    <FormFlowProvider>
      <div className="min-h-screen bg-[#0D0F14] text-[#F0F2F8]">
        <FormFlowHero />
        <ApiKeyBanner />
        <FormComparison />
        <ComparisonStats />
        <FormFlowNarrative />
        <FormFlowFooter />
      </div>
    </FormFlowProvider>
  );
}
