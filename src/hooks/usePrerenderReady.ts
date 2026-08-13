import { useEffect, useRef } from 'react';

/**
 * Hook to signal that a page is ready for prerendering.
 * Sets window.prerenderReady = true, which Netlify's Prerender extension checks.
 * 
 * Resets the signal on mount so each SPA navigation gets a fresh signal cycle.
 */
export function usePrerenderReady(isReady: boolean) {
  const hasSignaled = useRef(false);

  // Reset on mount for SPA navigation
  useEffect(() => {
    window.prerenderReady = false;
    hasSignaled.current = false;
  }, []);

  useEffect(() => {
    if (isReady && !hasSignaled.current) {
      hasSignaled.current = true;
      window.prerenderReady = true;
    }
  }, [isReady]);
}
