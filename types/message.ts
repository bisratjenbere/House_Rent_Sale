import { z } from 'zod';

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export const sendMessageSchema = z.object({
  propertyId: z.string().refine(isValidObjectId, 'Invalid property ID'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must not exceed 2000 characters'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
