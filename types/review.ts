import { z } from 'zod';

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export const createReviewSchema = z.object({
  propertyId: z.string().refine(isValidObjectId, 'Invalid property ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must not exceed 1000 characters'),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).max(1000).optional(),
});
