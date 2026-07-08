"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import { propertyBaseSchema } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/property/ImageUploader";
import { Loader2 } from "lucide-react";

// Dynamically import MapPicker to avoid SSR issues
const MapPicker = dynamic(
  () => import("@/components/maps/MapPicker").then((m) => ({ default: m.MapPicker })),
  { ssr: false, loading: () => <div className="min-h-[400px] bg-muted rounded animate-pulse" /> }
);

// Form-specific schema without defaults to avoid type conflicts
const propertyFormSchema = propertyBaseSchema.required();

// Form data type - inferred from the schema
type PropertyFormData = z.infer<typeof propertyFormSchema>;

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Amenity {
  _id: string;
  name: string;
}

interface PropertyFormProps {
  initialData?: Partial<PropertyFormData & { _id?: string }>;
  onSubmit: (data: PropertyFormData, submitForReview?: boolean) => void;
  isSubmitting?: boolean;
  showSubmitForReview?: boolean;
}

const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "land", label: "Land" },
  { value: "commercial-unit", label: "Commercial Unit" },
];

const LISTING_TYPES = [
  { value: "rent", label: "For Rent" },
  { value: "sale", label: "For Sale" },
];

export function PropertyForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  showSubmitForReview = false,
}: PropertyFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitAction, setSubmitAction] = useState<"draft" | "review">("draft");

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      propertyType: initialData?.propertyType ?? "house",
      category: initialData?.category ?? "",
      listingType: initialData?.listingType ?? "rent",
      price: initialData?.price ?? 0,
      bedrooms: initialData?.bedrooms ?? 0,
      bathrooms: initialData?.bathrooms ?? 0,
      kitchens: initialData?.kitchens ?? 0,
      parking: initialData?.parking ?? 0,
      area: initialData?.area ?? 0,
      address: initialData?.address ?? "",
      city: initialData?.city ?? "",
      region: initialData?.region ?? "",
      location: initialData?.location,
      amenities: initialData?.amenities ?? [],
      images: initialData?.images ?? [],
    },
  });

  // Watch address fields for MapPicker hint
  const address = watch("address");
  const city = watch("city");
  const region = watch("region");
  const addressHint = [address, city, region].filter(Boolean).join(", ");

  // Fetch categories and amenities on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [categoriesRes, amenitiesRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/amenities"),
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          if (categoriesData.success && Array.isArray(categoriesData.data)) {
            setCategories(categoriesData.data);
          }
        }

        if (amenitiesRes.ok) {
          const amenitiesData = await amenitiesRes.json();
          if (amenitiesData.success && Array.isArray(amenitiesData.data)) {
            setAmenities(amenitiesData.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch categories/amenities:", error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const handleFormSubmit = (data: PropertyFormData) => {
    const shouldSubmitForReview = submitAction === "review";
    onSubmit(data, shouldSubmitForReview);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-semibold">Basic Information</h3>

        {/* Title */}
        <div>
          <Label htmlFor="title">
            Property Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="e.g., Modern 3BR Apartment in Bole"
            className="mt-1"
          />
          {errors.title && (
            <p className="text-destructive text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Describe the property, its features, and what makes it special..."
            rows={6}
            className="mt-1"
          />
          {errors.description && (
            <p className="text-destructive text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Property Type & Listing Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="propertyType">
              Property Type <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="propertyType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.propertyType && (
              <p className="text-destructive text-sm mt-1">{errors.propertyType.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="listingType">
              Listing Type <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="listingType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select listing type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LISTING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.listingType && (
              <p className="text-destructive text-sm mt-1">{errors.listingType.message}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category">
            Category <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loadingOptions}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingOptions ? "Loading..." : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-destructive text-sm mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <Label htmlFor="price">
            Price (ETB) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            {...register("price", { valueAsNumber: true })}
            placeholder="25000"
            className="mt-1"
            min="0"
          />
          {errors.price && (
            <p className="text-destructive text-sm mt-1">{errors.price.message}</p>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-semibold">Property Details</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              type="number"
              {...register("bedrooms", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1"
              min="0"
            />
            {errors.bedrooms && (
              <p className="text-destructive text-sm mt-1">{errors.bedrooms.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input
              id="bathrooms"
              type="number"
              {...register("bathrooms", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1"
              min="0"
            />
            {errors.bathrooms && (
              <p className="text-destructive text-sm mt-1">{errors.bathrooms.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="kitchens">Kitchens</Label>
            <Input
              id="kitchens"
              type="number"
              {...register("kitchens", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1"
              min="0"
            />
            {errors.kitchens && (
              <p className="text-destructive text-sm mt-1">{errors.kitchens.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="parking">Parking Spaces</Label>
            <Input
              id="parking"
              type="number"
              {...register("parking", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1"
              min="0"
            />
            {errors.parking && (
              <p className="text-destructive text-sm mt-1">{errors.parking.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="area">
            Area (m²) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="area"
            type="number"
            {...register("area", { valueAsNumber: true })}
            placeholder="150"
            className="mt-1"
            min="1"
          />
          {errors.area && (
            <p className="text-destructive text-sm mt-1">{errors.area.message}</p>
          )}
        </div>

        {/* Amenities */}
        <div>
          <Label>Amenities</Label>
          <Controller
            name="amenities"
            control={control}
            render={({ field }) => (
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                {loadingOptions ? (
                  <p className="text-muted-foreground text-sm col-span-full">Loading amenities...</p>
                ) : amenities.length === 0 ? (
                  <p className="text-muted-foreground text-sm col-span-full">No amenities available</p>
                ) : (
                  amenities.map((amenity) => (
                    <label
                      key={amenity._id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={amenity._id}
                        checked={field.value?.includes(amenity._id)}
                        onChange={(e) => {
                          const newValue = e.target.checked
                            ? [...(field.value || []), amenity._id]
                            : (field.value || []).filter((id) => id !== amenity._id);
                          field.onChange(newValue);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{amenity.name}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          />
          {errors.amenities && (
            <p className="text-destructive text-sm mt-1">{errors.amenities.message}</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-semibold">Location</h3>

        <div>
          <Label htmlFor="address">
            Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address"
            {...register("address")}
            placeholder="e.g., Bole Road, near Edna Mall"
            className="mt-1"
          />
          {errors.address && (
            <p className="text-destructive text-sm mt-1">{errors.address.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              {...register("city")}
              placeholder="e.g., Addis Ababa"
              className="mt-1"
            />
            {errors.city && (
              <p className="text-destructive text-sm mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="region">
              Region <span className="text-destructive">*</span>
            </Label>
            <Input
              id="region"
              {...register("region")}
              placeholder="e.g., Addis Ababa"
              className="mt-1"
            />
            {errors.region && (
              <p className="text-destructive text-sm mt-1">{errors.region.message}</p>
            )}
          </div>
        </div>

        {/* Map Picker */}
        <div>
          <Label>Map Location (Optional)</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Click on the map to set the property location, or enter coordinates manually.
          </p>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <MapPicker
                value={field.value || null}
                onChange={field.onChange}
                addressHint={addressHint}
                className="mt-2"
              />
            )}
          />
          {errors.location && (
            <p className="text-destructive text-sm mt-1">{errors.location.message}</p>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-semibold">Property Images</h3>
        <p className="text-sm text-muted-foreground">
          Upload up to 10 images. The first image will be the primary image shown in listings.
        </p>

        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <ImageUploader
              images={field.value || []}
              onChange={field.onChange}
              maxImages={10}
            />
          )}
        />
        {errors.images && (
          <p className="text-destructive text-sm mt-1">{errors.images.message}</p>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          type="submit"
          variant="outline"
          size="lg"
          disabled={isSubmitting}
          onClick={() => setSubmitAction("draft")}
        >
          {isSubmitting && submitAction === "draft" && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save as Draft
        </Button>
        {showSubmitForReview && (
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            onClick={() => setSubmitAction("review")}
          >
            {isSubmitting && submitAction === "review" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit for Review
          </Button>
        )}
      </div>
    </form>
  );
}
