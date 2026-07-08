'use client';

import 'leaflet/dist/leaflet.css';
import { useLeaflet } from '@/hooks/useLeaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';

interface Property {
  _id: string;
  title: string;
  price: number;
  location?: { lat: number; lng: number };
}

interface PropertyMapViewProps {
  properties: Property[];
  onPropertyClick?: (propertyId: string) => void;
}

/** Auto-fits map bounds to show all markers */
function BoundsAdjuster({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 14);
    } else {
      map.fitBounds(positions);
    }
  }, [map, positions]);
  return null;
}

export function PropertyMapView({ properties, onPropertyClick }: PropertyMapViewProps) {
  const { isLoaded } = useLeaflet();

  const safeProperties = Array.isArray(properties) ? properties : [];
  const valid = safeProperties.filter((p) => p.location?.lat && p.location?.lng);
  const noLocationCount = safeProperties.length - valid.length;
  const positions = valid.map((p) => [p.location!.lat, p.location!.lng] as [number, number]);

  if (!isLoaded) {
    return <div className="w-full h-[500px] bg-muted rounded animate-pulse" />;
  }

  return (
    <div>
      <MapContainer
        center={positions[0] ?? [9.03, 38.74]}
        zoom={12}
        className="w-full rounded"
        style={{ height: '500px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsAdjuster positions={positions} />
        {valid.map((property) => (
          <Marker
            key={property._id}
            position={[property.location!.lat, property.location!.lng]}
            eventHandlers={{ click: () => onPropertyClick?.(property._id) }}
          >
            <Popup>
              <div className="p-1">
                <p className="font-medium text-sm mb-1">{property.title}</p>
                <p className="font-mono text-base">
                  {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(property.price)}
                </p>
                <a href={`/properties/${property._id}`} className="text-primary text-xs underline">
                  View Details
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {noLocationCount > 0 && (
        <p className="text-muted-foreground text-xs mt-2">
          {noLocationCount} {noLocationCount === 1 ? 'property has' : 'properties have'} no location data and {noLocationCount === 1 ? 'is' : 'are'} not shown on the map.
        </p>
      )}
    </div>
  );
}
