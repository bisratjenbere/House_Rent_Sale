import { z } from 'zod';

export const propertySearchQuerySchema = z.object({
  search: z.string().min(1).max(200).optional(),
  listingType: z.enum(['rent', 'sale']).optional(),
  propertyType: z
    .enum(['house', 'apartment', 'villa', 'studio', 'land', 'commercial-unit'])
    .optional(),
  city: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  cursor: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(['newest', 'oldest', 'price-asc', 'price-desc']).default('newest'),
});

export type PropertySearchQuery = z.infer<typeof propertySearchQuerySchema>;
