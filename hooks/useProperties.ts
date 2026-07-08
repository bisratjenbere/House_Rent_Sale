"use client";

import { useEffect, useState } from "react";

interface Property {
  _id: string;
  title: string;
  description: string;
  listingType: "rent" | "sale";
  propertyType: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  city: string;
  address: string;
  images: { url: string; publicId: string }[];
  isFeatured: boolean;
  owner: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface UsePropertiesOptions {
  search?: string;
  listingType?: string;
  propertyType?: string;
  city?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  sort?: string;
  featured?: string;
  limit?: number;
}

interface UsePropertiesReturn {
  properties: Property[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
  loadMore: () => void;
  refetch: () => void;
}

export function useProperties(options: UsePropertiesOptions = {}): UsePropertiesReturn {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchProperties = async (cursor?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // Add all filter params
      if (options.search) params.set("search", options.search);
      if (options.listingType && options.listingType !== "all")
        params.set("listingType", options.listingType);
      if (options.propertyType && options.propertyType !== "all")
        params.set("propertyType", options.propertyType);
      if (options.city) params.set("city", options.city);
      if (options.category && options.category !== "all")
        params.set("category", options.category);
      if (options.minPrice) params.set("minPrice", options.minPrice);
      if (options.maxPrice) params.set("maxPrice", options.maxPrice);
      if (options.bedrooms && options.bedrooms !== "all")
        params.set("bedrooms", options.bedrooms);
      if (options.bathrooms && options.bathrooms !== "all")
        params.set("bathrooms", options.bathrooms);
      if (options.sort) params.set("sort", options.sort);
      if (options.featured) params.set("featured", options.featured);
      if (options.limit) params.set("limit", options.limit.toString());
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(`/api/properties?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch properties");
      }

      const incoming = data.data?.properties;
      const safeList = Array.isArray(incoming) ? incoming : [];

      if (cursor) {
        setProperties((prev) => [...prev, ...safeList]);
      } else {
        setProperties(safeList);
      }

      setNextCursor(data.data?.nextCursor || null);
      setHasMore(!!data.data?.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (nextCursor && !loading) {
      fetchProperties(nextCursor);
    }
  };

  const refetch = () => {
    setProperties([]);
    setNextCursor(null);
    fetchProperties();
  };

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.search,
    options.listingType,
    options.propertyType,
    options.city,
    options.category,
    options.minPrice,
    options.maxPrice,
    options.bedrooms,
    options.bathrooms,
    options.sort,
    options.featured,
    options.limit,
  ]);

  return {
    properties,
    loading,
    error,
    hasMore,
    nextCursor,
    loadMore,
    refetch,
  };
}
