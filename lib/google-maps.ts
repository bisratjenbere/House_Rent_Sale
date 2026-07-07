// Singleton promise — multiple calls return the same promise, script loads once
let mapsPromise: Promise<typeof google> | null = null;

/**
 * Lazy-loads the Google Maps JavaScript API.
 * Safe to call multiple times — returns the same promise after first call.
 */
export function loadGoogleMapsAPI(): Promise<typeof google> {
  if (mapsPromise) return mapsPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key not configured'));
  }

  mapsPromise = new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.maps) {
      resolve(window.google);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) resolve(window.google);
      else reject(new Error('Google Maps API failed to load'));
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return mapsPromise;
}

/**
 * Geocode an address string to { lat, lng }.
 * Returns null if address not found. Throws on API quota exhaustion.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const g = await loadGoogleMapsAPI();
  const geocoder = new g.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else if (status === 'OVER_QUERY_LIMIT') {
        reject(new Error('Geocoding quota exhausted'));
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Reverse geocode { lat, lng } to a human-readable address string.
 * Silent failure — returns null on any error (US-5 optional enhancement).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const g = await loadGoogleMapsAPI();
    const geocoder = new g.maps.Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) resolve(results[0].formatted_address);
        else resolve(null);
      });
    });
  } catch {
    return null;
  }
}

// --- Geocoding cache (localStorage, LRU, 7-day TTL, max 100 entries) ---

const CACHE_KEY = 'geocode_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const CACHE_MAX = 100;

interface CacheEntry {
  location: { lat: number; lng: number };
  timestamp: number;
  lastAccessed: number;
}

type CacheStore = Record<string, CacheEntry>;

function readCache(): CacheStore {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as CacheStore;
  } catch {
    return {};
  }
}

function writeCache(cache: CacheStore): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage quota exceeded — cache is an optimization, failure is acceptable
  }
}

export function getCachedGeocode(address: string): { lat: number; lng: number } | null {
  if (typeof window === 'undefined') return null;

  const cache = readCache();
  const entry = cache[address];

  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    entry.lastAccessed = Date.now();
    writeCache(cache);
    return entry.location;
  }

  return null;
}

export function setCachedGeocode(address: string, location: { lat: number; lng: number }): void {
  if (typeof window === 'undefined') return;

  const cache = readCache();
  const now = Date.now();

  cache[address] = { location, timestamp: now, lastAccessed: now };

  // LRU eviction when over max size
  const entries = Object.entries(cache);
  if (entries.length > CACHE_MAX) {
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    const toRemove = entries.length - CACHE_MAX;
    for (let i = 0; i < toRemove; i++) delete cache[entries[i][0]];
  }

  writeCache(cache);
}
