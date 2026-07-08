/**
 * Geocoding helpers using Nominatim (OpenStreetMap) via our API proxy.
 * Avoids CORS issues and ensures proper User-Agent headers for Nominatim usage policy.
 */

/**
 * Geocode an address string to { lat, lng }.
 * Returns null if address not found. Throws on network/quota error.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `/api/geocode?q=${encodeURIComponent(address)}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error('Geocoding request failed');

  const json = await res.json();
  
  if (!json.success) {
    throw new Error(json.error || 'Geocoding failed');
  }

  return json.data;
}

/**
 * Reverse geocode { lat, lng } to a human-readable address string.
 * Silent failure — returns null on any error (US-5 optional enhancement).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `/api/geocode?lat=${lat}&lng=${lng}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data?.address ?? null : null;
  } catch {
    return null;
  }
}

// --- Geocoding cache (localStorage, LRU, 7-day TTL, max 100 entries) ---

const CACHE_KEY = 'geocode_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
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

  const entries = Object.entries(cache);
  if (entries.length > CACHE_MAX) {
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    const toRemove = entries.length - CACHE_MAX;
    for (let i = 0; i < toRemove; i++) delete cache[entries[i][0]];
  }

  writeCache(cache);
}
