import dynamic from 'next/dynamic';

const PropertyMap = dynamic(
  () => import('@/components/maps/PropertyMap').then((m) => m.PropertyMap),
  { ssr: false }
);

interface Property {
  _id: string;
  title: string;
  description: string;
  price: number;
  location?: { lat: number; lng: number };
}

async function getProperty(id: string): Promise<Property | null> {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/properties/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return <div className="p-6 text-muted-foreground">Property not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-semibold">{property.title}</h1>
      <p className="text-muted-foreground">{property.description}</p>

      <section>
        <h2 className="text-lg font-medium mb-2">Location</h2>
        <PropertyMap
          lat={property.location?.lat}
          lng={property.location?.lng}
          title={property.title}
          className="rounded overflow-hidden"
        />
      </section>
    </div>
  );
}
