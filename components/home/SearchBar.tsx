"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "land", label: "Land" },
  { value: "commercial-unit", label: "Commercial Unit" },
];

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [listingType, setListingType] = useState<string>("all");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState<string>("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    
    if (keyword.trim()) params.append("search", keyword.trim());
    if (listingType && listingType !== "all") params.append("listingType", listingType);
    if (city.trim()) params.append("city", city.trim());
    if (propertyType && propertyType !== "all") params.append("propertyType", propertyType);

    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-lg border border-border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Keyword Search */}
        <div className="lg:col-span-2">
          <Input
            type="text"
            placeholder="Search by title, description, or location..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-12"
          />
        </div>

        {/* Listing Type */}
        <div>
          <Select value={listingType} onValueChange={setListingType}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Listing Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Listings</SelectItem>
              <SelectItem value="rent">For Rent</SelectItem>
              <SelectItem value="sale">For Sale</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div>
          <Input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-12"
          />
        </div>

        {/* Property Type */}
        <div>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Button - Full Width on Mobile */}
      <div className="mt-4">
        <Button type="submit" size="lg" className="w-full md:w-auto">
          <Search className="mr-2 h-5 w-5" />
          Search Properties
        </Button>
      </div>
    </form>
  );
}
