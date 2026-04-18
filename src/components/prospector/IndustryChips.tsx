import { motion } from 'framer-motion';

export const INDUSTRIES = [
  { id: 'ai-ml', label: 'AI/ML', emoji: '🤖' },
  { id: 'devtools', label: 'DevTools', emoji: '🛠️' },
  { id: 'fintech', label: 'Fintech', emoji: '💳' },
  { id: 'cybersecurity', label: 'Cybersecurity', emoji: '🔐' },
  { id: 'healthtech', label: 'HealthTech', emoji: '🏥' },
  { id: 'edtech', label: 'EdTech', emoji: '📚' },
  { id: 'ecommerce', label: 'E-commerce', emoji: '🛒' },
  { id: 'saas', label: 'SaaS', emoji: '☁️' },
  { id: 'infrastructure', label: 'Infrastructure', emoji: '🏗️' },
  { id: 'blockchain', label: 'Blockchain', emoji: '⛓️' },
  { id: 'iot', label: 'IoT', emoji: '📡' },
  { id: 'martech', label: 'MarTech', emoji: '📈' },
  { id: 'hrtech', label: 'HRTech', emoji: '👥' },
  { id: 'legaltech', label: 'LegalTech', emoji: '⚖️' },
  { id: 'cleantech', label: 'CleanTech', emoji: '🌱' },
];

interface IndustryChipsProps {
  selected: string[];
  onToggle: (id: string) => void;
}

const IndustryChips = ({ selected, onToggle }: IndustryChipsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {INDUSTRIES.map((industry) => {
        const isSelected = selected.includes(industry.id);
        return (
          <motion.button
            key={industry.id}
            onClick={() => onToggle(industry.id)}
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.92 }}
            animate={
              isSelected
                ? { scale: [1, 1.12, 1], transition: { duration: 0.25 } }
                : { scale: 1 }
            }
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200 select-none',
              'font-mono',
              isSelected
                ? 'border border-blue-500 bg-blue-500/10 text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.35)]'
                : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/20',
            ].join(' ')}
          >
            <span className="mr-1 text-sm leading-none">{industry.emoji}</span>
            {industry.label}
          </motion.button>
        );
      })}
    </div>
  );
};

export default IndustryChips;
