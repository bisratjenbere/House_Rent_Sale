import nodemailer from 'nodemailer';
import { deleteAccountRequestTemplate } from '@/lib/email/templates/delete-account-request';
import { verificationEmailTemplate } from '@/lib/email/templates/verification';
import { passwordResetEmailTemplate } from '@/lib/email/templates/password-reset';
import { messageNotificationTemplate } from '@/lib/email/templates/message-notification';
import { reviewNotificationTemplate } from '@/lib/email/templates/review-notification';
import { propertyStatusNotificationTemplate } from '@/lib/email/templates/property-status-notification';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `HouseHub <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
    await sendEmail(to, 'Verify Your Email Address', verificationEmailTemplate(verifyUrl));
    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    await sendEmail(to, 'Reset Your Password', passwordResetEmailTemplate(resetUrl));
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: 'Failed to send password reset email' };
  }
}

export async function sendMessageNotificationEmail(
  to: string,
  propertyTitle: string,
  messageExcerpt: string,
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const messageUrl = `${process.env.NEXTAUTH_URL}/dashboard/messages?property=${propertyId}`;
    await sendEmail(to, `New message about ${propertyTitle}`, messageNotificationTemplate(propertyTitle, messageExcerpt, messageUrl));
    return { success: true };
  } catch (error) {
    console.error('Failed to send message notification email:', error);
    return { success: false, error: 'Failed to send message notification email' };
  }
}

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
    await sendEmail(to, subject, propertyStatusNotificationTemplate(propertyTitle, status, rejectionReason));
    return { success: true };
  } catch (error) {
    console.error('Failed to send property status notification email:', error);
    return { success: false, error: 'Failed to send property status notification email' };
  }
}

export async function sendDeleteAccountRequestEmail(
  userName: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.GMAIL_USER!;
    await sendEmail(adminEmail, `Account Deletion Request from ${userEmail}`, deleteAccountRequestTemplate(userName, userEmail));
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
    await sendEmail(to, `New ${rating}-star review on ${propertyTitle}`, reviewNotificationTemplate(propertyTitle, rating, commentExcerpt, propertyUrl));
    return { success: true };
  } catch (error) {
    console.error('Failed to send review notification email:', error);
    return { success: false, error: 'Failed to send review notification email' };
  }
}
