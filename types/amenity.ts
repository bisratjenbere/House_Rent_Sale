import { z } from 'zod';

export const createAmenitySchema = z.object({
  name: z.string().min(2).max(50),
  icon: z.string().max(50).optional(),
});

export const updateAmenitySchema = z.object({
  name: z.string().min(2).max(50).optional(),
  icon: z.string().max(50).optional(),
});
