import Review from '@/models/Review';
import Message from '@/models/Message';
import Property from '@/models/Property';
import { NotFoundError, ForbiddenError, ValidationError } from '@/services/property.service';

export async function assertReviewEligible(userId: string, propertyId: string) {
  const property = await Property.findById(propertyId);
  if (!property) throw new NotFoundError('Property not found');
  if (property.status !== 'published') throw new ValidationError('Can only review published properties');
  if (property.owner.toString() === userId) throw new ForbiddenError('You cannot review your own property');

  const hasMessaged = await Message.exists({
    $or: [{ sender: userId }, { receiver: userId }],
    property: propertyId,
  });
  if (!hasMessaged) throw new ForbiddenError('You must send a message to the property owner before leaving a review');

  const existingReview = await Review.exists({ user: userId, property: propertyId });
  if (existingReview) throw new ValidationError('You have already reviewed this property');

  return property;
}

export async function checkReviewEligibility(userId: string, propertyId: string): Promise<{ eligible: boolean; reason?: string }> {
  const property = await Property.findById(propertyId);
  if (!property || property.status !== 'published') return { eligible: false, reason: 'Property not found or not available' };
  if (property.owner.toString() === userId) return { eligible: false, reason: 'You cannot review your own property' };

  const hasMessaged = await Message.exists({
    $or: [{ sender: userId }, { receiver: userId }],
    property: propertyId,
  });
  if (!hasMessaged) return { eligible: false, reason: 'You must message the owner first' };

  const existingReview = await Review.exists({ user: userId, property: propertyId });
  if (existingReview) return { eligible: false, reason: 'You have already reviewed this property' };

  return { eligible: true };
}

export async function calculateReviewStats(propertyId: string): Promise<{ averageRating: number; reviewCount: number }> {
  const reviews = await Review.find({ property: propertyId }).select('rating');
  if (reviews.length === 0) return { averageRating: 0, reviewCount: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { averageRating: Math.round((sum / reviews.length) * 10) / 10, reviewCount: reviews.length };
}

export async function assertReviewOwner(reviewId: string, userId: string) {
  const review = await Review.findById(reviewId);
  if (!review || review.user.toString() !== userId) throw new NotFoundError('Review not found');
  return review;
}
