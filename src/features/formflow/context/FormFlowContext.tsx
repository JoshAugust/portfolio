import { createContext, useContext, type ReactNode } from 'react';
import type { FormFlowContextValue } from '../types';
import { useApiKey } from '../hooks/useApiKey';
import { useFormStats } from '../hooks/useFormStats';

const FormFlowContext = createContext<FormFlowContextValue | null>(null);

export function FormFlowProvider({ children }: { children: ReactNode }) {
  const { apiKey, setApiKey, clearApiKey, isLive } = useApiKey();
  const { stats, dispatch } = useFormStats();

  const value: FormFlowContextValue = {
    mode: isLive ? 'live' : 'demo',
    apiKey,
    setApiKey,
    clearApiKey,
    stats,
    dispatchStat: dispatch,
  };

  return (
    <FormFlowContext.Provider value={value}>
      {children}
    </FormFlowContext.Provider>
  );
}

export function useFormFlow(): FormFlowContextValue {
  const ctx = useContext(FormFlowContext);
  if (!ctx) {
    throw new Error('useFormFlow must be used within FormFlowProvider');
  }
  return ctx;
}
