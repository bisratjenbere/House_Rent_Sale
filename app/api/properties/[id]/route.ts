import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Property, Favorite, Message, Review, Notification } from '@/models';
import { updatePropertySchema } from '@/types/property';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import {
  assertOwnerOrAdmin,
  resolveStatusAfterEdit,
} from '@/services/property.service';
import { cleanupOrphanedImages } from '@/services/cloudinary.service';

/**
 * Get a single property (public - only published, or owner/admin can see any status)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await connectDB();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    const property = await Property.findById(id)
      .populate('category', 'name slug')
      .populate('amenities', 'name icon')
      .populate('owner', 'name avatar phone bio');

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Non-published properties are only visible to owner or admin
    const isOwner = token?.userId && property.owner._id.toString() === token.userId;
    const isAdmin = token?.role === 'admin';
    if (property.status !== 'published' && !isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/properties/:id
 * Update an existing property
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - 10 requests per minute per user
    const rateLimitResult = await checkRateLimit(token.userId as string, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.error },
        { status: 429 }
      );
    }

    await connectDB();

    // Assert ownership or admin role
    const existingProperty = await assertOwnerOrAdmin(
      id,
      token.userId as string,
      token.role as string
    );

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updatePropertySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Reject any 'featured' key in body (schema excludes it, but double-check)
    if ('featured' in body) {
      return NextResponse.json(
        {
          success: false,
          error: 'Featured flag cannot be set via this endpoint',
        },
        { status: 400 }
      );
    }

    // Resolve final status after edit (D1 + D18)
    const newStatus = resolveStatusAfterEdit(
      existingProperty.status,
      body.status,
      token.role as string
    );

    // If images updated, cleanup orphaned Cloudinary images
    if (body.images) {
      await cleanupOrphanedImages(existingProperty.images, body.images);
    }

    // Clear rejection reason if moving back to draft from rejected
    const updates: Record<string, unknown> = { ...validationResult.data, status: newStatus };
    if (newStatus === 'draft' && existingProperty.status === 'rejected') {
      updates.rejectionReason = undefined;
    }

    // Update property
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedProperty,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/properties/:id
 * Delete a property and cascade delete all related documents
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - 10 requests per minute per user
    const rateLimitResult = await checkRateLimit(token.userId as string, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    await connectDB();

    // Assert ownership or admin role
    const property = await assertOwnerOrAdmin(
      id,
      token.userId as string,
      token.role as string
    );

    // Cascade delete all related documents
    await Promise.all([
      Favorite.deleteMany({ property: id }),
      Message.deleteMany({ property: id }),
      Review.deleteMany({ property: id }),
      Notification.deleteMany({ relatedProperty: id }),
    ]);

    // Delete all Cloudinary images via shared service (log-and-continue per image)
    await cleanupOrphanedImages(property.images, []);

    // Delete property document
    await Property.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Property and all related data deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
