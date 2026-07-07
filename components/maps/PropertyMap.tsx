'use client';

import 'leaflet/dist/leaflet.css';
import { useLeaflet } from '@/hooks/useLeaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

interface PropertyMapProps {
  lat: number | undefined | null;
  lng: number | undefined | null;
  title?: string;
  className?: string;
}

export function PropertyMap({ lat, lng, title, className }: PropertyMapProps) {
  const { isLoaded } = useLeaflet();

  if (!lat || !lng) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm">Location not available</p>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={`${className} min-h-[300px] bg-muted rounded animate-pulse`} />;
  }

  return (
    <div className={className}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        className="w-full min-h-[300px] rounded"
        style={{ height: '350px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          {title && <Popup>{title}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}
