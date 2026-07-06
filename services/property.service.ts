import { Property, type IProperty } from '@/models';

// Custom error classes for better error handling
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Assert that the current user is either the property owner or an admin
 * @param propertyId - Property ID to check
 * @param userId - Current user's ID
 * @param role - Current user's role
 * @returns Property document if authorized
 * @throws NotFoundError if property doesn't exist
 * @throws ForbiddenError if user is neither owner nor admin
 */
export async function assertOwnerOrAdmin(
  propertyId: string,
  userId: string,
  role: string
): Promise<IProperty> {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  const isOwner = property.owner.toString() === userId;
  const isAdmin = role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('You do not have permission to access this property');
  }

  return property;
}

/**
 * Resolve the final status after a property edit based on D1 transition rules and D18 auto-reset
 * @param currentStatus - Property's current status
 * @param requestedStatus - Status from request body (if any)
 * @param role - Current user's role ('user' or 'admin')
 * @returns Final status to set
 * @throws ForbiddenError for invalid transitions
 * @throws ValidationError for invalid status values
 */
export function resolveStatusAfterEdit(
  currentStatus: IProperty['status'],
  requestedStatus: IProperty['status'] | undefined,
  role: string
): IProperty['status'] {
  // D18: Owner edits to published properties reset status to pending_review
  // Admin edits do NOT trigger this reset
  if (currentStatus === 'published' && role !== 'admin') {
    return 'pending_review';
  }

  // If no status requested in body, keep current status (unless D18 applied above)
  if (!requestedStatus) {
    return currentStatus;
  }

  // Admin can set any status (except through update endpoint - those are separate endpoints)
  // Users can only set to 'draft' or keep existing status
  if (role !== 'admin') {
    // Users cannot directly set status to published/rented/sold/archived via update endpoint
    const forbiddenStatuses: IProperty['status'][] = [
      'published',
      'pending_review',
      'rented',
      'sold',
      'archived',
    ];
    if (forbiddenStatuses.includes(requestedStatus)) {
      throw new ForbiddenError(
        'You cannot set status to this value. Use the submit endpoint or contact an admin.'
      );
    }

    // Users can only set to 'draft' (effectively "unpublish" their own pending/rejected)
    if (requestedStatus !== 'draft') {
      throw new ValidationError('Invalid status value');
    }

    return 'draft';
  }

  // Admin requested status - allow it
  return requestedStatus;
}

/**
 * Resolve status after deleting an image from a property
 * @param currentStatus - Property's current status
 * @param role - Current user's role
 * @returns New status (D18: published → pending_review for owner image deletions only)
 */
export function resolveStatusAfterImageDelete(
  currentStatus: IProperty['status'],
  role: string
): IProperty['status'] {
  // D18: Owner deletions of images from published properties trigger review
  // Admin deletions do NOT trigger this reset
  if (currentStatus === 'published' && role !== 'admin') {
    return 'pending_review';
  }

  return currentStatus;
}
