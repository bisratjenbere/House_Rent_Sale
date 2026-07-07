import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

export const userSearchQuerySchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  search: z.string().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
