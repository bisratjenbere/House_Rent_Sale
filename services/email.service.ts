import { Resend } from 'resend';
import { verificationEmailTemplate } from '@/lib/email/templates/verification';
import { passwordResetEmailTemplate } from '@/lib/email/templates/password-reset';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send verification email to user
 * @param to - Recipient email address
 * @param token - Verification token
 * @returns { success: boolean, error?: string }
 */
export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
    const html = verificationEmailTemplate(verifyUrl);
    
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: 'Verify Your Email Address',
      html,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return {
      success: false,
      error: 'Failed to send verification email',
    };
  }
}

/**
 * Send password reset email to user
 * @param to - Recipient email address
 * @param token - Password reset token
 * @returns { success: boolean, error?: string }
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    const html = passwordResetEmailTemplate(resetUrl);
    
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: 'Reset Your Password',
      html,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return {
      success: false,
      error: 'Failed to send password reset email',
    };
  }
}
