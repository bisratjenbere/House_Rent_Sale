import { Message, Property } from '@/models';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/services/property.service';

export async function assertNotPropertyOwner(userId: string, propertyId: string) {
  const property = await Property.findOne({ _id: propertyId, status: 'published' });
  if (!property) {
    throw new NotFoundError('Property not found or not available');
  }
  if (property.owner.toString() === userId) {
    throw new ValidationError('You cannot send a message to yourself');
  }
  return property;
}

export async function assertConversationParticipant(userId: string, propertyId: string) {
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new NotFoundError('Property not found');
  }
  const isOwner = property.owner.toString() === userId;
  const isParticipant = await Message.exists({
    $or: [{ sender: userId }, { receiver: userId }],
    property: propertyId,
  });
  if (!isOwner && !isParticipant) {
    throw new ForbiddenError('You are not a participant in this conversation');
  }
  return property;
}

interface PopulatedMessage {
  property: { _id: { toString(): string }; title: string; images: { url: string; publicId: string }[] };
  sender: { _id: { toString(): string }; name: string; avatar?: string };
  receiver: { _id: { toString(): string }; name: string; avatar?: string };
  message: string;
  read: boolean;
  createdAt: Date;
}

export function groupMessagesByProperty(userId: string, messages: PopulatedMessage[]) {
  const grouped = new Map<string, { property: PopulatedMessage['property']; messages: PopulatedMessage[] }>();

  for (const msg of messages) {
    const propertyId = msg.property._id.toString();
    if (!grouped.has(propertyId)) {
      grouped.set(propertyId, { property: msg.property, messages: [] });
    }
    grouped.get(propertyId)!.messages.push(msg);
  }

  const conversations = [];

  for (const [, data] of grouped) {
    const sorted = [...data.messages].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const latest = sorted[0];
    const unreadCount = data.messages.filter(
      (m) => m.receiver._id.toString() === userId && !m.read
    ).length;
    const otherParticipant =
      latest.sender._id.toString() === userId ? latest.receiver : latest.sender;

    conversations.push({
      property: {
        _id: data.property._id,
        title: data.property.title,
        images: data.property.images,
      },
      otherParticipant: {
        _id: otherParticipant._id,
        name: otherParticipant.name,
        avatar: otherParticipant.avatar,
      },
      latestMessage: {
        message: latest.message,
        createdAt: latest.createdAt,
        sender: latest.sender._id.toString(),
      },
      unreadCount,
      lastMessageAt: latest.createdAt,
    });
  }

  return conversations.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
}
