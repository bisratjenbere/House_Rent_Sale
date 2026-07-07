'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(
  () => import('@/components/maps/MapPicker').then((m) => m.MapPicker),
  { ssr: false }
);

interface Location {
  lat: number;
  lng: number;
}

interface FormData {
  title: string;
  address: string;
  city: string;
  region: string;
  location: Location | null;
}

export default function NewPropertyPage() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    address: '',
    city: '',
    region: '',
    location: null,
  });

  const addressHint = [formData.address, formData.city, formData.region]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Add Property</h1>

      <div className="space-y-4">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="City"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Region"
          value={formData.region}
          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
        />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Property Location</p>
        <MapPicker
          value={formData.location}
          onChange={(location) => setFormData({ ...formData, location })}
          addressHint={addressHint}
        />
      </div>
    </div>
  );
}
