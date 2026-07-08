"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { PropertyFilters } from "@/components/property/PropertyFilters";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { useProperties } from "@/hooks/useProperties";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";

// Dynamically import PropertyMapView to avoid SSR issues with Leaflet
const PropertyMapView = dynamic(
  () =>
    import("@/components/maps/PropertyMapView").then((mod) => mod.PropertyMapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-muted rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [mapViewActive, setMapViewActive] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { properties, loading, error, hasMore, loadMore } = useProperties({
    search: searchParams.get("search") || undefined,
    listingType: searchParams.get("listingType") || undefined,
    propertyType: searchParams.get("propertyType") || undefined,
    city: searchParams.get("city") || undefined,
    category: searchParams.get("category") || undefined,
    minPrice: searchParams.get("minPrice") || undefined,
    maxPrice: searchParams.get("maxPrice") || undefined,
    bedrooms: searchParams.get("bedrooms") || undefined,
    bathrooms: searchParams.get("bathrooms") || undefined,
    sort: searchParams.get("sort") || undefined,
    featured: searchParams.get("featured") || undefined,
    limit: 12,
  });

  const toggleMapView = () => {
    setMapViewActive(!mapViewActive);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Browse Properties
        </h1>
        <p className="mt-2 text-muted-foreground">
          {loading
            ? "Loading properties..."
            : `${properties.length} ${
                properties.length === 1 ? "property" : "properties"
              } found`}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-4 rounded-lg border border-border bg-card p-6">
            <h2 className="font-semibold text-lg mb-6">Filters</h2>
            <PropertyFilters
              onMapToggle={toggleMapView}
              showMapToggle={true}
              mapViewActive={mapViewActive}
            />
          </div>
        </aside>

        {/* Mobile Filter Button */}
        <div className="lg:hidden">
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine your property search
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <PropertyFilters
                  onMapToggle={toggleMapView}
                  showMapToggle={true}
                  mapViewActive={mapViewActive}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive mb-6">
              <p className="font-medium">Error loading properties</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {mapViewActive ? (
            <PropertyMapView properties={properties} />
          ) : (
            <>
              <PropertyGrid
                properties={properties}
                loading={loading}
                emptyMessage={
                  searchParams.toString()
                    ? "No properties match your filters. Try adjusting your search criteria."
                    : "No properties available at the moment."
                }
                emptyAction={
                  searchParams.toString()
                    ? {
                        label: "Clear Filters",
                        onClick: () => (window.location.href = "/properties"),
                      }
                    : undefined
                }
              />

              {/* Load More Button */}
              {hasMore && !loading && (
                <div className="mt-8 text-center">
                  <Button onClick={loadMore} variant="outline" size="lg">
                    Load More Properties
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
