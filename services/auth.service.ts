import crypto from 'crypto';
import { User } from '@/models';

/**
 * Generate a random secure token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate verification token and update user record
 * @param userId - User ID to generate token for
 * @returns Generated token
 */
export async function generateVerificationToken(userId: string): Promise<string> {
  const token = generateToken();
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  await User.findByIdAndUpdate(userId, {
    verificationToken: token,
    verificationTokenExpires: expiry,
  });
  
  return token;
}

/**
 * Verify email token and mark user as verified
 * @param token - Verification token
 * @returns { success: boolean, error?: string }
 */
export async function verifyEmailToken(
  token: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() },
  });
  
  if (!user) {
    return { success: false, error: 'Invalid or expired verification token' };
  }
  
  if (user.emailVerified) {
    return { success: false, error: 'Email already verified' };
  }
  
  // Mark user as verified and clear token
  user.emailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();
  
  return { success: true, userId: user._id.toString() };
}

/**
 * Generate password reset token and update user record
 * @param userId - User ID to generate token for
 * @returns Generated token
 */
export async function generatePasswordResetToken(userId: string): Promise<string> {
  const token = generateToken();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  await User.findByIdAndUpdate(userId, {
    resetPasswordToken: token,
    resetPasswordExpires: expiry,
  });
  
  return token;
}

/**
 * Verify password reset token and check expiry
 * @param token - Password reset token
 * @returns { success: boolean, error?: string, userId?: string }
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }, // Token must not be expired
  });
  
  if (!user) {
    return { success: false, error: 'Invalid or expired password reset token' };
  }
  
  return { success: true, userId: user._id.toString() };
}

/**
 * Reset user password and clear reset token fields
 * @param userId - User ID
 * @param hashedPassword - New hashed password
 */
export async function resetPassword(
  userId: string,
  hashedPassword: string
): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    password: hashedPassword,
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
  });
}
