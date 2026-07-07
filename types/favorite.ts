import { z } from 'zod';

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export const addFavoriteSchema = z.object({
  propertyId: z.string().refine(isValidObjectId, 'Invalid property ID'),
});

export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
