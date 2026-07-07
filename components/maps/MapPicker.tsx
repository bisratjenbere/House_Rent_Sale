'use client';

import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import { useDebouncedCallback } from 'use-debounce';
import { useLeaflet } from '@/hooks/useLeaflet';
import { geocodeAddress, reverseGeocode, getCachedGeocode, setCachedGeocode } from '@/lib/geocoding';
import { DEFAULT_MAP_CENTER } from '@/lib/map-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MapPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number }) => void;
  addressHint?: string;
  className?: string;
}

function ClickHandler({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPlace(e.latlng.lat, e.latlng.lng) });
  return null;
}

export function MapPicker({ value, onChange, addressHint, className }: MapPickerProps) {
  const { isLoaded } = useLeaflet();
  const markerRef = useRef<LeafletMarker>(null);
  const [manualLat, setManualLat] = useState(value?.lat?.toFixed(6) ?? '');
  const [manualLng, setManualLng] = useState(value?.lng?.toFixed(6) ?? '');
  const [suggestedAddress, setSuggestedAddress] = useState<string | null>(null);
  const center: [number, number] = value
    ? [value.lat, value.lng]
    : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng];

  useEffect(() => {
    if (!addressHint) return;
    const run = async () => {
      const cached = getCachedGeocode(addressHint);
      if (cached) { onChange(cached); return; }
      const loc = await geocodeAddress(addressHint).catch(() => null);
      if (loc) { onChange(loc); setCachedGeocode(addressHint, loc); }
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressHint]);

  const handlePlace = async (lat: number, lng: number) => {
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));
    onChange({ lat, lng });
    const addr = await reverseGeocode(lat, lng);
    if (addr) setSuggestedAddress(addr);
  };

  const handleManualInput = useDebouncedCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onChange({ lat, lng });
    }
  }, 500);

  if (!isLoaded) return <div className={`${className} min-h-[400px] bg-muted rounded animate-pulse`} />;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="map-lat">Latitude</Label>
          <Input
            id="map-lat"
            type="number"
            step="0.000001"
            placeholder="-90 to 90"
            value={manualLat}
            onChange={(e) => { setManualLat(e.target.value); handleManualInput(); }}
          />
        </div>
        <div>
          <Label htmlFor="map-lng">Longitude</Label>
          <Input
            id="map-lng"
            type="number"
            step="0.000001"
            placeholder="-180 to 180"
            value={manualLng}
            onChange={(e) => { setManualLng(e.target.value); handleManualInput(); }}
          />
        </div>
      </div>

      <MapContainer center={center} zoom={value ? 15 : 12} className="w-full rounded border mb-2" style={{ height: '400px' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPlace={handlePlace} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            draggable
            ref={markerRef}
            eventHandlers={{
              dragend: () => {
                const pos = markerRef.current?.getLatLng();
                if (pos) handlePlace(pos.lat, pos.lng);
              },
            }}
          />
        )}
      </MapContainer>

      <p className="text-muted-foreground text-xs">
        Click on the map to place a marker, or drag the marker to adjust the location.
      </p>
      {suggestedAddress && (
        <p className="text-primary text-sm mt-2">Suggested address: {suggestedAddress}</p>
      )}
    </div>
  );
}
