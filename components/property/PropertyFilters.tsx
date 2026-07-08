"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MapPin, Search, X } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface PropertyFiltersProps {
  onMapToggle?: () => void;
  showMapToggle?: boolean;
  mapViewActive?: boolean;
}

export function PropertyFilters({
  onMapToggle,
  showMapToggle = true,
  mapViewActive = false,
}: PropertyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    listingType: searchParams.get("listingType") || "",
    propertyType: searchParams.get("propertyType") || "",
    city: searchParams.get("city") || "",
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    bathrooms: searchParams.get("bathrooms") || "",
    sort: searchParams.get("sort") || "createdAt:desc",
  });

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  // Sync filters to URL
  const applyFilters = () => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    router.push(`/properties?${params.toString()}`);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: "",
      listingType: "",
      propertyType: "",
      city: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      bathrooms: "",
      sort: "createdAt:desc",
    });
    router.push("/properties");
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by title, description, or city..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Listing Type */}
      <div className="space-y-2">
        <Label htmlFor="listingType">Listing Type</Label>
        <Select
          value={filters.listingType}
          onValueChange={(value) => handleFilterChange("listingType", value)}
        >
          <SelectTrigger id="listingType">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="rent">For Rent</SelectItem>
            <SelectItem value="sale">For Sale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <Label htmlFor="propertyType">Property Type</Label>
        <Select
          value={filters.propertyType}
          onValueChange={(value) => handleFilterChange("propertyType", value)}
        >
          <SelectTrigger id="propertyType">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="land">Land</SelectItem>
            <SelectItem value="commercial-unit">Commercial Unit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          placeholder="Enter city..."
          value={filters.city}
          onChange={(e) => handleFilterChange("city", e.target.value)}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => handleFilterChange("category", value)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Price Range (ETB)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange("minPrice", e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <Label htmlFor="bedrooms">Bedrooms</Label>
        <Select
          value={filters.bedrooms}
          onValueChange={(value) => handleFilterChange("bedrooms", value)}
        >
          <SelectTrigger id="bedrooms">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="1">1+</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="3">3+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
            <SelectItem value="5">5+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bathrooms */}
      <div className="space-y-2">
        <Label htmlFor="bathrooms">Bathrooms</Label>
        <Select
          value={filters.bathrooms}
          onValueChange={(value) => handleFilterChange("bathrooms", value)}
        >
          <SelectTrigger id="bathrooms">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="1">1+</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="3">3+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label htmlFor="sort">Sort By</Label>
        <Select
          value={filters.sort}
          onValueChange={(value) => handleFilterChange("sort", value)}
        >
          <SelectTrigger id="sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Newest First</SelectItem>
            <SelectItem value="createdAt:asc">Oldest First</SelectItem>
            <SelectItem value="price:asc">Price: Low to High</SelectItem>
            <SelectItem value="price:desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4">
        <Button onClick={applyFilters} className="w-full">
          Apply Filters
        </Button>
        <Button onClick={resetFilters} variant="outline" className="w-full">
          <X className="mr-2 h-4 w-4" />
          Reset
        </Button>
        {showMapToggle && (
          <Button
            onClick={onMapToggle}
            variant="outline"
            className="w-full"
          >
            <MapPin className="mr-2 h-4 w-4" />
            {mapViewActive ? "List View" : "Map View"}
          </Button>
        )}
      </div>
    </div>
  );
}
