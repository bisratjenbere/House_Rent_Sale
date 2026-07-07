/**
 * Default map center coordinates.
 * Reads from env vars with Addis Ababa, Ethiopia as fallback.
 * Used in MapSearchInterface and MapPicker — no hardcoded coordinates in component files.
 */
export const DEFAULT_MAP_CENTER = {
  lat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_LAT || '9.03'),
  lng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_LNG || '38.74'),
};
