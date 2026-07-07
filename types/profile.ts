import { z } from 'zod';
import { passwordSchema } from '@/types/auth';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export const updateNotificationSettingsSchema = z.object({
  emailNotificationsEnabled: z.boolean(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const deleteAccountRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Password is required'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountRequestInput = z.infer<typeof deleteAccountRequestSchema>;
