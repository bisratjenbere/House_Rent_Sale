'use client'

import { PropertyCard } from './PropertyCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface Property {
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

interface PropertyGridProps {
  properties: Property[]
  loading?: boolean
  emptyMessage?: string
  emptyAction?: {
    label: string
    onClick: () => void
  }
  showFavorite?: boolean
  favoritedIds?: Set<string>
  onFavoriteToggle?: (propertyId: string, currentState: boolean) => Promise<void>
}

export function PropertyGrid({ 
  properties, 
  loading = false,
  emptyMessage = "No properties found",
  emptyAction,
  showFavorite = false,
  favoritedIds = new Set(),
  onFavoriteToggle
}: PropertyGridProps) {
  // Loading State
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  // Empty State
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{emptyMessage}</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search criteria
            </p>
          </div>
          {emptyAction && (
            <Button onClick={emptyAction.onClick} variant="outline">
              {emptyAction.label}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Properties Grid
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard
          key={property._id}
          property={property}
          showFavorite={showFavorite}
          isFavorited={favoritedIds.has(property._id)}
          onFavoriteToggle={onFavoriteToggle}
        />
      ))}
    </div>
  )
}
