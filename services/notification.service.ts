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
 */
export async function notifyAllAdmins(payload: NotificationPayload): Promise<number> {
  const admins = await User.find({ role: 'admin' }).select('_id');

  if (admins.length === 0) {
    console.warn('notifyAllAdmins: No admin users found');
    return 0;
  }

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

  const result = await Notification.insertMany(notifications);
  return result.length;
}

/**
 * Send a notification to a single user
 */
export async function notifySingleUser(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  await Notification.create({
    user: userId,
    ...payload,
    read: false,
  });
}
