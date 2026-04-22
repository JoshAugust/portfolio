import { useState, useCallback } from 'react';

const STORAGE_KEY = 'formflow:anthropic-key';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setApiKey = useCallback((key: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // silently fail
    }
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // silently fail
    }
    setApiKeyState(null);
  }, []);

  return {
    apiKey,
    setApiKey,
    clearApiKey,
    isLive: apiKey !== null && apiKey.length > 0,
  };
}
