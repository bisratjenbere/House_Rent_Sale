/**
 * Discriminates between a password-change body and a notification-settings body.
 * Used in PUT /api/settings to branch between the two update paths.
 */
export function isPasswordChangeRequest(body: unknown): body is { currentPassword: string; newPassword: string } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'currentPassword' in body &&
    'newPassword' in body
  );
}
