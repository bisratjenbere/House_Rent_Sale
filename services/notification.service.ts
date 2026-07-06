import { User, Notification } from '@/models';
import type mongoose from 'mongoose';

interface NotificationPayload {
  type: 'message' | 'review' | 'property_status' | 'system';
  title: string;
  message: string;
  link?: string;
  relatedProperty?: mongoose.Types.ObjectId | string;
  relatedPropertyStatus?: string;
}

/**
 * Send a notification to all admin users
 * @param payload - Notification content and metadata
 * @returns Number of notifications created
 */
export async function notifyAllAdmins(payload: NotificationPayload): Promise<number> {
  // Find all admin users
  const admins = await User.find({ role: 'admin' }).select('_id');

  // If no admins, return early (no error)
  if (admins.length === 0) {
    console.warn('notifyAllAdmins: No admin users found');
    return 0;
  }

  // Create one notification per admin
  const notifications = admins.map((admin) => ({
    user: admin._id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link,
    relatedProperty: payload.relatedProperty,
    relatedPropertyStatus: payload.relatedPropertyStatus,
    read: false,
  }));

  // Bulk insert all notifications
  const result = await Notification.insertMany(notifications);

  console.log(`Created ${result.length} admin notifications`);
  return result.length;
}
