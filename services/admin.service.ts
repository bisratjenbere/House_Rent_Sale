import { User, Property, Category, Message, Review, Favorite } from '@/models';
import { ForbiddenError } from '@/services/property.service';

export function assertNotSelfDemotion(requesterId: string, targetUserId: string, newRole: string) {
  if (requesterId === targetUserId && newRole === 'user') {
    throw new ForbiddenError('You cannot change your own role');
  }
}

export async function getUsersWithPropertyCount(filter: Record<string, unknown>, skip: number, limit: number) {
  return User.aggregate([
    { $match: filter },
    { $lookup: { from: 'properties', localField: '_id', foreignField: 'owner', as: 'properties' } },
    { $addFields: { propertyCount: { $size: '$properties' } } },
    { $project: { password: 0, verificationToken: 0, verificationTokenExpires: 0, resetPasswordToken: 0, resetPasswordExpires: 0, properties: 0 } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);
}

export async function getUserDetailStats(userId: string) {
  const [propertyCount, messageCount, reviewCount, favoriteCount] = await Promise.all([
    Property.countDocuments({ owner: userId }),
    Message.countDocuments({ $or: [{ sender: userId }, { receiver: userId }] }),
    Review.countDocuments({ user: userId }),
    Favorite.countDocuments({ user: userId }),
  ]);
  return { propertyCount, messageCount, reviewCount, favoriteCount };
}

export async function getCategoriesWithPropertyCount() {
  return Category.aggregate([
    {
      $lookup: {
        from: 'properties',
        let: { categoryId: '$_id' },
        pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$category', '$$categoryId'] }, { $eq: ['$status', 'published'] }] } } }],
        as: 'properties',
      },
    },
    { $addFields: { propertyCount: { $size: '$properties' } } },
    { $project: { properties: 0 } },
    { $sort: { name: 1 } },
  ]);
}
