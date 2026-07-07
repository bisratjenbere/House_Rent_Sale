import { z } from 'zod';

export const rejectPropertySchema = z.object({
  rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(500, 'Rejection reason must not exceed 500 characters'),
});

export const propertySearchQuerySchema = z.object({
  status: z.enum(['draft', 'pending_review', 'published', 'rejected', 'rented', 'sold', 'archived']).optional(),
  search: z.string().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
