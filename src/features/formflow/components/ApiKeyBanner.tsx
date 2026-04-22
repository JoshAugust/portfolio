import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormFlow } from '../context/FormFlowContext';

export function ApiKeyBanner() {
  const { apiKey, setApiKey, clearApiKey, mode } = useFormFlow();
  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputId = useId();

  const handleActivate = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      setApiKey(trimmed);
      setInputValue('');
      setExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleActivate();
    if (e.key === 'Escape') setExpanded(false);
  };

  const isActive = mode === 'live' && apiKey;

  return (
    <div
      className="w-full border-b border-[#2A3045] bg-[#161A24]"
      role="region"
      aria-label="API key configuration"
    >
      <div className="max-w-[1240px] mx-auto px-4 py-3">
        {isActive ? (
          /* Active state */
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm text-green-400 font-medium flex items-center gap-2">
              <span aria-hidden="true">✦</span>
              Live AI mode · Claude 3.5 Haiku
            </span>
            <button
              onClick={clearApiKey}
              className="text-xs text-[#8B92A8] hover:text-red-400 transition-colors border border-[#2A3045] px-2.5 py-1 rounded"
            >
              Clear key
            </button>
          </div>
        ) : (
          /* Collapsed / Expanded state */
          <div>
            <button
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              className="text-sm text-[#8B92A8] hover:text-[#F0F2F8] transition-colors flex items-center gap-2"
            >
              <span>🔑 Want real AI? Enter your Anthropic API key for live Claude responses.</span>
              <span aria-hidden="true" className="text-[#6C63FF]">
                {expanded ? '↑' : '→'}
              </span>
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 pb-1 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label htmlFor={inputId} className="sr-only">
                        Anthropic API key
                      </label>
                      <input
                        id={inputId}
                        type="password"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="sk-ant-..."
                        autoComplete="off"
                        className="w-full rounded-lg border border-[#2A3045] bg-[#1E2333] px-3 py-2 text-sm text-[#F0F2F8] placeholder:text-[#545B72] focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-[#6C63FF]"
                      />
                      <p className="mt-1.5 text-xs text-[#545B72]">
                        Your key stays in your browser — it's never sent to any server except Anthropic's API directly. Free demo mode works without a key.
                      </p>
                    </div>
                    <div className="flex gap-2 sm:items-start">
                      <button
                        onClick={handleActivate}
                        disabled={!inputValue.trim()}
                        className="px-4 py-2 rounded-lg bg-[#6C63FF] text-white text-sm font-medium hover:bg-[#5851E0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => setExpanded(false)}
                        className="px-3 py-2 rounded-lg border border-[#2A3045] text-[#8B92A8] text-sm hover:border-[#6C63FF] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
