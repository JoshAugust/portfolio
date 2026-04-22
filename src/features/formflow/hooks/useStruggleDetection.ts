/**
 * useStruggleDetection.ts
 * Monitors interaction patterns to detect user struggle.
 *
 * Signals: dwell time >10s, delete-retype cycles >3,
 * focus ping-pong >2 blur+focus within 5s.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export function useStruggleDetection(fieldId: string) {
  const [isStruggling, setIsStruggling] = useState(false);
  const elementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Tracking state
  const focusTimeRef = useRef<number>(0);
  const deleteCountRef = useRef(0);
  const focusEventsRef = useRef<number[]>([]);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkStruggle = useCallback(() => {
    // Dwell check: >10s on field
    const dwellMs = focusTimeRef.current > 0 ? Date.now() - focusTimeRef.current : 0;
    if (dwellMs > 10000) {
      setIsStruggling(true);
      return;
    }

    // Delete-retype check: >3 cycles
    if (deleteCountRef.current > 3) {
      setIsStruggling(true);
      return;
    }

    // Focus ping-pong: >2 blur+focus within 5s
    const now = Date.now();
    const recentFocusEvents = focusEventsRef.current.filter(t => now - t < 5000);
    if (recentFocusEvents.length > 2) {
      setIsStruggling(true);
      return;
    }
  }, []);

  const handleFocus = useCallback(() => {
    focusTimeRef.current = Date.now();
    focusEventsRef.current.push(Date.now());

    // Start dwell timer
    dwellTimerRef.current = setTimeout(() => {
      checkStruggle();
    }, 10000);
  }, [checkStruggle]);

  const handleBlur = useCallback(() => {
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    checkStruggle();
  }, [checkStruggle]);

  const handleKeyDown = useCallback((e: Event) => {
    const key = (e as KeyboardEvent).key;
    if (key === 'Backspace' || key === 'Delete') {
      deleteCountRef.current += 1;
      checkStruggle();
    }
  }, [checkStruggle]);

  const attachListeners = useCallback((element: HTMLInputElement | HTMLTextAreaElement) => {
    elementRef.current = element;
    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);
    element.addEventListener('keydown', handleKeyDown);
  }, [handleFocus, handleBlur, handleKeyDown]);

  const detachListeners = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;
    el.removeEventListener('focus', handleFocus);
    el.removeEventListener('blur', handleBlur);
    el.removeEventListener('keydown', handleKeyDown);
    elementRef.current = null;
  }, [handleFocus, handleBlur, handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
      detachListeners();
    };
  }, [detachListeners]);

  // Reset when fieldId changes (shouldn't normally happen)
  useEffect(() => {
    setIsStruggling(false);
    deleteCountRef.current = 0;
    focusEventsRef.current = [];
  }, [fieldId]);

  return { isStruggling, attachListeners, detachListeners };
}
