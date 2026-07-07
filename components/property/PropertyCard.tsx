'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { PropertyTypeBadge } from './PropertyTypeBadge'
import { PriceDisplay } from './PriceDisplay'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PropertyCardProps {
  property: {
    _id: string
    title: string
    price: number
    listingType: 'rent' | 'sale'
    bedrooms: number
    bathrooms: number
    area: number
    city: string
    images: { url: string }[]
    featured?: boolean
  }
  showFavorite?: boolean
  isFavorited?: boolean
  onFavoriteToggle?: (propertyId: string, currentState: boolean) => Promise<void>
}

export function PropertyCard({ 
  property, 
  showFavorite = false,
  isFavorited = false,
  onFavoriteToggle 
}: PropertyCardProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [favorited, setFavorited] = useState(isFavorited)

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!onFavoriteToggle || isToggling) return
    
    setIsToggling(true)
    try {
      await onFavoriteToggle(property._id, favorited)
      setFavorited(!favorited)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsToggling(false)
    }
  }

  const imageUrl = property.images[0]?.url || '/placeholder-property.jpg'

  return (
    <Link href={`/properties/${property._id}`} className="group block">
      <div className="overflow-hidden rounded bg-card shadow-sm transition-shadow hover:shadow-md">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Type Badge - Top Left */}
          <div className="absolute left-2 top-2">
            <PropertyTypeBadge type={property.listingType} />
          </div>

          {/* Featured Badge - Top Left (below type badge) */}
          {property.featured && (
            <div className="absolute left-2 top-10">
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                Featured
              </Badge>
            </div>
          )}

          {/* Favorite Icon - Top Right */}
          {showFavorite && (
            <button
              onClick={handleFavoriteClick}
              disabled={isToggling}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm transition-colors hover:bg-white disabled:opacity-50"
              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  favorited ? "fill-primary text-primary" : "text-muted-foreground"
                )}
              />
            </button>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-2">
          {/* Price */}
          <PriceDisplay 
            price={property.price} 
            type={property.listingType}
            className="text-xl font-semibold"
          />

          {/* Property Stats */}
          <p className="font-data tabular-nums text-sm text-muted-foreground">
            {property.bedrooms} bed · {property.bathrooms} bath · {property.area} m²
          </p>

          {/* Location */}
          <p className="text-sm text-muted-foreground">
            {property.city}
          </p>

          {/* Title */}
          <p className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {property.title}
          </p>
        </div>
      </div>
    </Link>
  )
}
