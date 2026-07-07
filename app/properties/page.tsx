'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const PropertyMapView = dynamic(
  () => import('@/components/maps/PropertyMapView').then((m) => m.PropertyMapView),
  { ssr: false }
);
const MapSearchInterface = dynamic(
  () => import('@/components/maps/MapSearchInterface').then((m) => m.MapSearchInterface),
  { ssr: false }
);

interface Property {
  _id: string;
  title: string;
  price: number;
  location?: { lat: number; lng: number };
}

interface RadiusParams {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapView, setMapView] = useState(false);
  const [radiusParams, setRadiusParams] = useState<RadiusParams | null>(null);

  const fetchProperties = useCallback(async (extra?: RadiusParams | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      if (extra) {
        params.set('centerLat', String(extra.centerLat));
        params.set('centerLng', String(extra.centerLng));
        params.set('radiusKm', String(extra.radiusKm));
        params.delete('city');
      } else {
        params.delete('centerLat');
        params.delete('centerLng');
        params.delete('radiusKm');
      }
      const res = await fetch(`/api/properties?${params}`);
      const data = await res.json();
      setProperties(data.data ?? []);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { fetchProperties(radiusParams); }, [fetchProperties, radiusParams]);

  const handleSearchChange = useCallback((params: RadiusParams | null) => {
    setRadiusParams(params);
  }, []);

  const isEmpty = !loading && properties.length === 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setMapView(false)}
            className={`px-3 py-1.5 rounded text-sm border ${!mapView ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
          >
            List View
          </button>
          <button
            onClick={() => setMapView(true)}
            className={`px-3 py-1.5 rounded text-sm border ${mapView ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
          >
            Map View
          </button>
        </div>
      </div>

      <details className="border rounded p-4">
        <summary className="cursor-pointer text-sm font-medium">Search on Map</summary>
        <div className="mt-4">
          <MapSearchInterface onSearchChange={handleSearchChange} />
        </div>
      </details>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse" />
          ))}
        </div>
      )}

      {!loading && mapView && (
        <PropertyMapView
          properties={properties}
          onPropertyClick={(id) => router.push(`/properties/${id}`)}
        />
      )}

      {!loading && !mapView && (
        <>
          {isEmpty && radiusParams ? (
            <p className="text-muted-foreground text-sm">
              No properties found within {radiusParams.radiusKm} km of the selected location.
              Try increasing the radius or adjusting filters.
            </p>
          ) : isEmpty ? (
            <p className="text-muted-foreground text-sm">No properties found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((p) => (
                <a
                  key={p._id}
                  href={`/properties/${p._id}`}
                  className="border rounded p-4 hover:shadow transition-shadow"
                >
                  <p className="font-medium">{p.title}</p>
                  <p className="font-mono text-sm text-muted-foreground">
                    {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(p.price)}
                  </p>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
