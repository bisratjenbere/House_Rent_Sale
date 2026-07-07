/**
 * Geocoding helpers using Nominatim (OpenStreetMap) — no API key required.
 * Drop-in replacement for the previous google-maps.ts geocoding functions.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Geocode an address string to { lat, lng }.
 * Returns null if address not found. Throws on network/quota error.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });

  if (!res.ok) throw new Error('Geocoding request failed');

  const data = await res.json();
  if (!data.length) return null;

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

/**
 * Reverse geocode { lat, lng } to a human-readable address string.
 * Silent failure — returns null on any error (US-5 optional enhancement).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name ?? null;
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
