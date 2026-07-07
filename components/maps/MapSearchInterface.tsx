'use client';

import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import { useDebouncedCallback } from 'use-debounce';
import { useLeaflet } from '@/hooks/useLeaflet';
import { geocodeAddress, getCachedGeocode, setCachedGeocode } from '@/lib/geocoding';
import { DEFAULT_MAP_CENTER } from '@/lib/map-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface MapSearchInterfaceProps {
  onSearchChange: (params: { centerLat: number; centerLng: number; radiusKm: number } | null) => void;
}

/** Re-centers map when center changes */
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center); }, [map, center]);
  return null;
}

export function MapSearchInterface({ onSearchChange }: MapSearchInterfaceProps) {
  const { isLoaded } = useLeaflet();
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [center, setCenter] = useState<[number, number]>([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const notifiedRef = useRef(false);

  // Notify parent whenever center or radius changes
  useEffect(() => {
    if (!notifiedRef.current && center[0] === DEFAULT_MAP_CENTER.lat && center[1] === DEFAULT_MAP_CENTER.lng) return;
    notifiedRef.current = true;
    onSearchChange({ centerLat: center[0], centerLng: center[1], radiusKm });
  }, [center, radiusKm, onSearchChange]);

  const handleSearch = useDebouncedCallback(async (query: string) => {
    if (!query.trim()) { setGeocodeError(null); return; }

    const cached = getCachedGeocode(query);
    if (cached) { setCenter([cached.lat, cached.lng]); setGeocodeError(null); return; }

    try {
      const location = await geocodeAddress(query);
      if (location) {
        setCenter([location.lat, location.lng]);
        setCachedGeocode(query, location);
        setGeocodeError(null);
      } else {
        setGeocodeError(`Location "${query}" not found. Try a different search term.`);
      }
    } catch {
      setGeocodeError('Location search temporarily unavailable. Place the marker manually.');
    }
  }, 500);

  if (!isLoaded) return <div className="w-full h-[400px] bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="location-search">Search Location</Label>
        <Input
          id="location-search"
          placeholder="City, address, or landmark..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
        />
        {geocodeError && <p className="text-destructive text-xs mt-1">{geocodeError}</p>}
      </div>

      <div>
        <Label>Search Radius: {radiusKm} km</Label>
        <Slider
          value={[radiusKm]}
          onValueChange={([v]) => setRadiusKm(v)}
          min={1} max={50} step={1}
          className="mt-2"
        />
      </div>

      <MapContainer center={center} zoom={12} className="w-full rounded border" style={{ height: '400px' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} />
        <Circle
          center={center}
          radius={radiusKm * 1000}
          pathOptions={{ color: 'hsl(158, 32%, 24%)', fillColor: 'hsl(158, 32%, 24%)', fillOpacity: 0.15, weight: 2, opacity: 0.6 }}
        />
      </MapContainer>
    </div>
  );
}
