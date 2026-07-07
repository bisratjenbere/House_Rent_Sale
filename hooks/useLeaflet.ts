'use client';

import { useState, useEffect } from 'react';
import type { Map as LeafletMap } from 'leaflet';

export type { LeafletMap };

/**
 * Ensures Leaflet is loaded client-side only (Leaflet requires window).
 * Returns { isLoaded } — components can gate rendering on this flag.
 */
export function useLeaflet() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Fix default marker icon paths broken by webpack/Next.js bundling
    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setIsLoaded(true);
    });
  }, []);

  return { isLoaded };
}
