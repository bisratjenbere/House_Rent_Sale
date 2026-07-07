import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PropertyTypeBadge } from "@/components/property/PropertyTypeBadge";
import { PriceDisplay } from "@/components/property/PriceDisplay";
import { PropertyMapSection } from "@/components/property/PropertyMapSection";
import { MessageForm } from "@/components/property/MessageForm";
import { ReviewsSection } from "@/components/property/ReviewsSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bed,
  Bath,
  Car,
  Maximize,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Star,
} from "lucide-react";

interface Property {
  _id: string;
  title: string;
  description: string;
  listingType: "rent" | "sale";
  propertyType: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  parking: number;
  area: number;
  address: string;
  city: string;
  region: string;
  location?: {
    lat: number;
    lng: number;
  };
  images: { url: string; publicId: string }[];
  amenities: { _id: string; name: string; icon?: string }[];
  category: { _id: string; name: string; slug: string };
  isFeatured: boolean;
  owner: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    bio?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

async function getProperty(id: string): Promise<Property | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/properties/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Failed to fetch property:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const property = await getProperty(params.id);

  if (!property) {
    return {
      title: "Property Not Found",
    };
  }

  return {
    title: `${property.title} - HouseHub`,
    description: property.description.substring(0, 160),
    openGraph: {
      title: property.title,
      description: property.description.substring(0, 160),
      images: property.images[0]?.url ? [property.images[0].url] : [],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const property = await getProperty(params.id);

  if (!property) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          {" / "}
          <Link href="/properties" className="hover:text-foreground">
            Properties
          </Link>
          {" / "}
          <span className="text-foreground">{property.title}</span>
        </nav>

        {/* Image Gallery */}
        <section className="mb-8">
          {property.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {/* Main Image */}
              <div className="col-span-4 md:col-span-2 md:row-span-2 relative h-96 md:h-full rounded-lg overflow-hidden">
                <Image
                  src={property.images[0].url}
                  alt={property.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Thumbnail Grid */}
              {property.images.slice(1, 5).map((image, index) => (
                <div
                  key={index}
                  className="relative h-48 rounded-lg overflow-hidden"
                >
                  <Image
                    src={image.url}
                    alt={`${property.title} - Image ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}

              {/* View All Photos Button */}
              {property.images.length > 5 && (
                <button className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded text-sm font-medium hover:bg-background">
                  View All {property.images.length} Photos
                </button>
              )}
            </div>
          ) : (
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">No images available</p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Header */}
            <section>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <PropertyTypeBadge type={property.listingType} />
                    {property.isFeatured && (
                      <Badge variant="outline" className="bg-accent text-accent-foreground">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>
                      {property.address}, {property.city}, {property.region}
                    </span>
                  </div>
                </div>
              </div>

              <PriceDisplay price={property.price} type={property.listingType} />
            </section>

            {/* Key Stats */}
            <section>
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bed className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-data tabular-nums text-lg font-semibold">
                          {property.bedrooms}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Bedroom{property.bedrooms !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bath className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-data tabular-nums text-lg font-semibold">
                          {property.bathrooms}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Bathroom{property.bathrooms !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Maximize className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-data tabular-nums text-lg font-semibold">
                          {property.area}
                        </p>
                        <p className="text-sm text-muted-foreground">m²</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-data tabular-nums text-lg font-semibold">
                          {property.parking}
                        </p>
                        <p className="text-sm text-muted-foreground">Parking</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Description */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">
                Description
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </section>

            {/* Property Details */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">
                Property Details
              </h2>
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Property Type
                      </p>
                      <p className="font-medium capitalize">
                        {property.propertyType.replace("-", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Category</p>
                      <p className="font-medium">{property.category.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Bedrooms</p>
                      <p className="font-data tabular-nums font-medium">
                        {property.bedrooms}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Bathrooms</p>
                      <p className="font-data tabular-nums font-medium">
                        {property.bathrooms}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Kitchens</p>
                      <p className="font-data tabular-nums font-medium">
                        {property.kitchens}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Parking</p>
                      <p className="font-data tabular-nums font-medium">
                        {property.parking} space{property.parking !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Area</p>
                      <p className="font-data tabular-nums font-medium">
                        {property.area} m²
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">City</p>
                      <p className="font-medium">{property.city}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-semibold mb-4">
                  Amenities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity._id} variant="outline">
                      {amenity.name}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Map */}
            {property.location?.lat && property.location?.lng && (
              <section>
                <h2 className="font-display text-2xl font-semibold mb-4">Location</h2>
                <PropertyMapSection
                  lat={property.location.lat}
                  lng={property.location.lng}
                  title={property.title}
                />
              </section>
            )}

            {/* Reviews Section */}
            <ReviewsSection propertyId={property._id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Agent Contact Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Contact Agent</h3>

                  <div className="flex items-center gap-3 mb-6">
                    {property.owner.avatar ? (
                      <Image
                        src={property.owner.avatar}
                        alt={property.owner.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {property.owner.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{property.owner.name}</p>
                      <Link
                        href={`/agents/${property.owner._id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Phone */}
                    {property.owner.phone && (
                      <a
                        href={`tel:${property.owner.phone}`}
                        className="flex items-center gap-2 w-full p-3 rounded border border-border hover:bg-muted transition-colors"
                      >
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-data text-sm">{property.owner.phone}</span>
                      </a>
                    )}

                    {/* WhatsApp */}
                    {property.owner.phone && (
                      <a
                        href={`https://wa.me/${property.owner.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full p-3 rounded bg-[#25D366] text-white hover:bg-[#20BA5A] transition-colors"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        WhatsApp
                      </a>
                    )}

                    {/* Telegram */}
                    {property.owner.phone && (
                      <a
                        href={`https://t.me/${property.owner.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full p-3 rounded bg-[#0088cc] text-white hover:bg-[#0077b3] transition-colors"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                        Telegram
                      </a>
                    )}

                    {/* Message Form */}
                    <div className="pt-4 border-t border-border">
                      <MessageForm
                        propertyId={property._id}
                        propertyTitle={property.title}
                        ownerId={property.owner._id}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
