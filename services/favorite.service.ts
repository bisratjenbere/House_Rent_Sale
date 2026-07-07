import { Favorite, Property } from '@/models';
import { NotFoundError } from '@/services/property.service';

export async function assertPropertyPublished(propertyId: string) {
  const property = await Property.findOne({ _id: propertyId, status: 'published' });
  if (!property) {
    throw new NotFoundError('Property not found or not available');
  }
  return property;
}

export async function isFavorited(userId: string, propertyId: string): Promise<boolean> {
  return (await Favorite.exists({ user: userId, property: propertyId })) !== null;
}
