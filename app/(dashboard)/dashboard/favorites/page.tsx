"use client";

import { useState, useEffect } from "react";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Property {
  _id: string;
  title: string;
  price: number;
  listingType: "rent" | "sale";
  bedrooms: number;
  bathrooms: number;
  area: number;
  city: string;
  images: { url: string }[];
  featured?: boolean;
}

interface Favorite {
  _id: string;
  property: Property;
}

interface FavoritesResponse {
  success: boolean;
  data?: {
    favorites: Favorite[];
    total: number;
    page: number;
    pages: number;
  };
  error?: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch favorites
  const fetchFavorites = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const response = await fetch(`/api/favorites?page=${page}`);
      const data: FavoritesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch favorites");
      }

      setFavorites(data.data?.favorites || []);
      setCurrentPage(data.data?.page || 1);
      setTotalPages(data.data?.pages || 1);
      setTotalCount(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load favorites");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Handle remove favorite
  const handleRemoveFavorite = async (propertyId: string, isFavorited: boolean) => {
    // Find the favorite ID for this property
    const favorite = favorites.find((f) => f.property._id === propertyId);
    if (!favorite) return;

    try {
      const response = await fetch(`/api/favorites/${favorite._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to remove favorite");
      }

      toast.success("Property removed from favorites");

      // Remove from local state
      setFavorites((prev) => prev.filter((f) => f._id !== favorite._id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove favorite");
    }
  };

  // Loading state
  if (isLoading && favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold">My Favorites</h1>
          <p className="text-muted-foreground mt-2">Properties you&apos;ve saved for later</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold">My Favorites</h1>
          <p className="text-muted-foreground mt-2">Properties you&apos;ve saved for later</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{loadError}</p>
            </div>
            <Button onClick={() => fetchFavorites()} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract properties from favorites
  const properties = favorites.map((f) => f.property);
  const favoritedIds = new Set(properties.map((p) => p._id));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-semibold">My Favorites</h1>
            <p className="text-muted-foreground mt-1">
              {totalCount === 0
                ? "No favorites yet"
                : `${totalCount} ${totalCount === 1 ? "property" : "properties"} saved`}
            </p>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {/* Properties Grid */}
      <PropertyGrid
        properties={properties}
        loading={false}
        emptyMessage="No favorites yet"
        emptyAction={{
          label: "Browse Properties",
          onClick: () => (window.location.href = "/properties"),
        }}
        showFavorite={true}
        favoritedIds={favoritedIds}
        onFavoriteToggle={handleRemoveFavorite}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            onClick={() => fetchFavorites(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => fetchFavorites(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
