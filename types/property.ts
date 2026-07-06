import { z } from 'zod';

// Property type enum
export const propertyTypeEnum = z.enum([
  'house',
  'apartment',
  'villa',
  'studio',
  'land',
  'commercial-unit',
]);

// Listing type enum
export const listingTypeEnum = z.enum(['rent', 'sale']);

// Location schema (optional, but if provided both lat and lng must be present)
const locationSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .optional();

// Image schema
const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
});

// Base property schema (excludes owner, status, featured - server-controlled fields)
export const propertyBaseSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  propertyType: propertyTypeEnum,
  category: z.string().min(1, 'Category is required'), // MongoDB ObjectId as string
  listingType: listingTypeEnum,
  price: z.number().min(0, 'Price cannot be negative'),
  bedrooms: z.number().min(0, 'Bedrooms cannot be negative').default(0),
  bathrooms: z.number().min(0, 'Bathrooms cannot be negative').default(0),
  kitchens: z.number().min(0, 'Kitchens cannot be negative').default(0),
  parking: z.number().min(0, 'Parking cannot be negative').default(0),
  area: z.number().min(1, 'Area must be greater than 0'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'Region is required'),
  location: locationSchema,
  amenities: z.array(z.string()).default([]), // Array of MongoDB ObjectIds as strings
  images: z
    .array(imageSchema)
    .max(10, 'Maximum 10 images allowed per property')
    .default([]),
});

// Create property schema - all base fields required (except those with defaults)
export const createPropertySchema = propertyBaseSchema;

// Update property schema - all base fields optional (partial update support)
export const updatePropertySchema = propertyBaseSchema.partial();

// Featured toggle schema - completely separate, only used by admin
export const featuredToggleSchema = z.object({
  featured: z.boolean(),
});

// Type exports
export type PropertyBase = z.infer<typeof propertyBaseSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type FeaturedToggleInput = z.infer<typeof featuredToggleSchema>;
