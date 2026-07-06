import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: 'message' | 'review' | 'property_status' | 'system';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  relatedProperty?: mongoose.Types.ObjectId;
  relatedPropertyStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    type: {
      type: String,
      enum: ['message', 'review', 'property_status', 'system'],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
    },
    relatedProperty: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
    },
    relatedPropertyStatus: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user notifications queries
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
