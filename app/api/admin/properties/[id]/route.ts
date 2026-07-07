import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Property, Favorite, Message, Review, Notification } from '@/models';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { cleanupOrphanedImages } from '@/services/cloudinary.service';

/**
 * GET /api/admin/properties/:id
 * Get full property details including admin-only fields (US-10)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    await connectDB();

    const property = await Property.findById(id)
      .populate('category')
      .populate('amenities')
      .populate('owner', 'name email phone avatar');

    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { property } });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/properties/:id
 * Permanently delete a property with cascade delete (US-11)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    await connectDB();

    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    // Cascade delete related documents
    await Promise.all([
      Favorite.deleteMany({ property: id }),
      Message.deleteMany({ property: id }),
      Review.deleteMany({ property: id }),
      Notification.deleteMany({ relatedProperty: id }),
    ]);

    // Delete Cloudinary images (log-and-continue per image)
    await cleanupOrphanedImages(property.images, []);

    await Property.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Property and all related data deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
