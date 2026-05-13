import { useEffect, useRef, useCallback, DependencyList } from 'react';

/**
 * Runs `effect` after `delay` ms whenever any of `deps` changes.
 * If `deps` changes again before the timer fires, the previous timer is cancelled
 * (standard debounce).
 *
 * Returns a `flush()` function. Calling it cancels the pending timer and runs the
 * effect synchronously — use this when unmounting, navigating away, or backgrounding
 * the app to make sure no in-flight changes are lost.
 *
 * Note: the effect fires once with the initial deps (after `delay`). If that's
 * undesirable, gate inside the effect (e.g. check whether anything actually changed).
 */
export function useDebouncedEffect(
  effect: () => void,
  deps: DependencyList,
  delay: number,
): () => void {
  const effectRef = useRef(effect);
  effectRef.current = effect;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    pendingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      pendingRef.current = false;
      effectRef.current();
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current) {
      pendingRef.current = false;
      effectRef.current();
    }
  }, []);

  return flush;
}
