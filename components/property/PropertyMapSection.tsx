"use client";

import dynamic from "next/dynamic";

const PropertyMap = dynamic(
  () => import("@/components/maps/PropertyMap").then((mod) => mod.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-muted rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

interface PropertyMapSectionProps {
  lat: number;
  lng: number;
  title: string;
}

export function PropertyMapSection({ lat, lng, title }: PropertyMapSectionProps) {
  return (
    <PropertyMap
      lat={lat}
      lng={lng}
      title={title}
      className="h-96 rounded-lg overflow-hidden border border-border"
    />
  );
}
