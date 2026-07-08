import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  Bed,
  Bath,
  Maximize,
  Car,
  Star,
} from 'lucide-react'
import { PropertyTypeBadge } from '@/components/property/PropertyTypeBadge'
import { PriceDisplay } from '@/components/property/PriceDisplay'
import { PropertyMapSection } from '@/components/property/PropertyMapSection'
import { AdminPropertyActions } from '@/components/admin/AdminPropertyActions'
import { connectDB } from '@/lib/db'
import { Property } from '@/models'

interface PropertyDetail {
  _id: string
  title: string
  description: string
  listingType: 'rent' | 'sale'
  propertyType: string
  price: number
  bedrooms: number
  bathrooms: number
  kitchens: number
  parking: number
  area: number
  address: string
  city: string
  region: string
  location?: {
    lat: number
    lng: number
  }
  images: { url: string; publicId: string }[]
  amenities: { _id: string; name: string; icon?: string }[]
  category: { _id: string; name: string; slug: string }
  isFeatured: boolean
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'rented' | 'sold' | 'archived'
  rejectionReason?: string
  owner: {
    _id: string
    name: string
    email: string
    phone?: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
}

async function getPropertyDetail(id: string): Promise<PropertyDetail | null> {
  try {
    await connectDB()
    const property = await Property.findById(id)
      .populate('category')
      .populate('amenities')
      .populate('owner', 'name email phone avatar')
      .lean()
    return property ? JSON.parse(JSON.stringify(property)) : null
  } catch {
    return null
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'published':
      return 'bg-primary text-primary-foreground'
    case 'pending_review':
      return 'bg-accent text-accent-foreground'
    case 'rejected':
      return 'bg-destructive text-destructive-foreground'
    case 'draft':
      return 'bg-muted text-muted-foreground'
    case 'archived':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export default async function AdminPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await getPropertyDetail(id)

  if (!property) {
    notFound()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <Link href="/admin/properties">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Button>
      </Link>

      {/* Header with Actions */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl font-semibold">
              {property.title}
            </h1>
            <Badge className={getStatusColor(property.status)}>
              {property.status.replace('_', ' ')}
            </Badge>
            <PropertyTypeBadge type={property.listingType} />
            {property.isFeatured && (
              <Badge variant="outline" className="bg-accent text-accent-foreground">
                Featured
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {property.address}, {property.city}, {property.region}
            </span>
          </div>
        </div>

        {/* Admin Actions */}
        <AdminPropertyActions property={property} />
      </div>

      {/* Price */}
      <div>
        <PriceDisplay price={property.price} type={property.listingType} />
      </div>

      {/* Rejection Reason (if rejected) */}
      {property.status === 'rejected' && property.rejectionReason && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">
              Rejection Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{property.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images ({property.images.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {property.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {property.images.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden"
                >
                  <Image
                    src={image.url}
                    alt={`${property.title} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No images uploaded</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Property Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Property Stats</CardTitle>
            </CardHeader>
            <CardContent>
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
                      Bedroom{property.bedrooms !== 1 ? 's' : ''}
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
                      Bathroom{property.bathrooms !== 1 ? 's' : ''}
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

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Property Type</p>
                  <p className="font-medium capitalize">
                    {property.propertyType.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{property.category.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bedrooms</p>
                  <p className="font-data tabular-nums font-medium">
                    {property.bedrooms}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bathrooms</p>
                  <p className="font-data tabular-nums font-medium">
                    {property.bathrooms}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kitchens</p>
                  <p className="font-data tabular-nums font-medium">
                    {property.kitchens}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Parking</p>
                  <p className="font-data tabular-nums font-medium">
                    {property.parking}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-data tabular-nums font-medium">
                    {property.area} m²
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{property.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity._id} variant="outline">
                      {amenity.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map */}
          {property.location?.lat && property.location?.lng && (
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyMapSection
                  lat={property.location.lat}
                  lng={property.location.lng}
                  title={property.title}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Owner & Metadata */}
        <div className="space-y-6">
          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle>Owner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
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
                    <User className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{property.owner.name}</p>
                  <Link
                    href={`/admin/users/${property.owner._id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Profile
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {property.owner.email}
                  </span>
                </div>
                {property.owner.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-data text-muted-foreground">
                      {property.owner.phone}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Property ID</p>
                <p className="font-data text-sm">{property._id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(property.status)}>
                  {property.status.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(property.createdAt), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(property.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
