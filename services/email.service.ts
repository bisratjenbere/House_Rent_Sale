import { Resend } from 'resend';
import { deleteAccountRequestTemplate } from '@/lib/email/templates/delete-account-request';
import { verificationEmailTemplate } from '@/lib/email/templates/verification';
import { passwordResetEmailTemplate } from '@/lib/email/templates/password-reset';
import { messageNotificationTemplate } from '@/lib/email/templates/message-notification';
import { reviewNotificationTemplate } from '@/lib/email/templates/review-notification';
import { propertyStatusNotificationTemplate } from '@/lib/email/templates/property-status-notification';

// Lazy-initialize Resend client to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

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
    
    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: 'Verify Your Email Address',
      html,
    });

    if (error) {
      console.error('Resend rejected verification email:', error);
      return { success: false, error: error.message };
    }

    console.log('Verification email sent, id:', data?.id, 'to:', to);
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
    
    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: 'Reset Your Password',
      html,
    });

    if (error) {
      console.error('Resend rejected password reset email:', error);
      return { success: false, error: error.message };
    }

    console.log('Password reset email sent, id:', data?.id, 'to:', to);
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return {
      success: false,
      error: 'Failed to send password reset email',
    };
  }
}

/**
 * Send message notification email to property owner (D14 — only if emailNotificationsEnabled)
 */
export async function sendMessageNotificationEmail(
  to: string,
  propertyTitle: string,
  messageExcerpt: string,
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const messageUrl = `${process.env.NEXTAUTH_URL}/dashboard/messages?property=${propertyId}`;
    const html = messageNotificationTemplate(propertyTitle, messageExcerpt, messageUrl);

    const resendClient = getResendClient();
    await resendClient.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: `New message about ${propertyTitle}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send message notification email:', error);
    return { success: false, error: 'Failed to send message notification email' };
  }
}

/**
 * Send property status notification email (approved/rejected) to property owner
 * Only called if owner's emailNotificationsEnabled = true (D14)
 */
export async function sendPropertyStatusNotificationEmail(
  to: string,
  propertyTitle: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject =
      status === 'approved'
        ? `Your property "${propertyTitle}" has been approved`
        : `Your property "${propertyTitle}" was not approved`;
    const html = propertyStatusNotificationTemplate(propertyTitle, status, rejectionReason);
    const resendClient = getResendClient();
    await resendClient.emails.send({ from: process.env.EMAIL_FROM!, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Failed to send property status notification email:', error);
    return { success: false, error: 'Failed to send property status notification email' };
  }
}

/**
 * Send review notification email to property owner (D14 — only if emailNotificationsEnabled)
 */
/**
 * Send account deletion request notification to admin
 */
export async function sendDeleteAccountRequestEmail(
  userName: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM!;
    const html = deleteAccountRequestTemplate(userName, userEmail);
    const resendClient = getResendClient();
    await resendClient.emails.send({
      from: process.env.EMAIL_FROM!,
      to: adminEmail,
      subject: `Account Deletion Request from ${userEmail}`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send delete account request email:', error);
    return { success: false, error: 'Failed to send delete account request email' };
  }
}

export async function sendReviewNotificationEmail(
  to: string,
  propertyTitle: string,
  rating: number,
  commentExcerpt: string,
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const propertyUrl = `${process.env.NEXTAUTH_URL}/properties/${propertyId}`;
    const html = reviewNotificationTemplate(propertyTitle, rating, commentExcerpt, propertyUrl);
    const resendClient = getResendClient();
    await resendClient.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: `New ${rating}-star review on ${propertyTitle}`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send review notification email:', error);
    return { success: false, error: 'Failed to send review notification email' };
  }
}
