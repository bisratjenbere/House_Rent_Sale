import Property from '@/models/Property';
import { connectDB } from '@/lib/db';

/**
 * Ensures a compound index on location.lat + location.lng exists.
 * Compatible with plain { lat, lng } storage (no GeoJSON required).
 * Idempotent — safe to call multiple times.
 */
export async function ensureGeospatialIndex(): Promise<void> {
  await connectDB();
  try {
    await Property.collection.createIndex({ 'location.lat': 1, 'location.lng': 1 });
  } catch (error) {
    console.error('Failed to create geospatial index:', error);
  }
}

/**
 * Builds a MongoDB bounding-box filter for radius-based property search (US-7).
 * Uses Haversine-derived lat/lng deltas — works with plain { lat, lng } storage.
 *
 * The bounding box is a rectangle approximation of the circle.
 * Acceptable tradeoff for 1–100km property search at v1.
 *
 * Returns null if any param is invalid.
 */
export function buildRadiusFilter(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): Record<string, unknown> | null {
  if (
    typeof centerLat !== 'number' || centerLat < -90 || centerLat > 90 ||
    typeof centerLng !== 'number' || centerLng < -180 || centerLng > 180 ||
    typeof radiusKm !== 'number' || radiusKm < 1 || radiusKm > 100
  ) {
    return null;
  }

  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180));

  return {
    'location.lat': { $gte: centerLat - latDelta, $lte: centerLat + latDelta },
    'location.lng': { $gte: centerLng - lngDelta, $lte: centerLng + lngDelta },
  };
}
