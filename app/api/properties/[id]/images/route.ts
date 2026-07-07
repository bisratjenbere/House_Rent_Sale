import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Property } from '@/models';
import { handleApiError } from '@/lib/handleApiError';
import {
  assertOwnerOrAdmin,
  resolveStatusAfterImageDelete,
} from '@/services/property.service';
import { cleanupOrphanedImages } from '@/services/cloudinary.service';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * DELETE /api/properties/:id/images
 * Delete a single image from a property
 * Expects { publicId: string } in request body
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

    const rateLimitResult = await checkRateLimit(token.userId as string, 30, 60);
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

    // Get publicId from request body
    const body = await request.json();
    const { publicId } = body;

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'publicId is required' },
        { status: 400 }
      );
    }

    // Find and remove the image from the array
    const imageIndex = property.images.findIndex((img) => img.publicId === publicId);

    if (imageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    // Remove image from array
    property.images.splice(imageIndex, 1);

    // Resolve new status after image deletion (D18)
    const newStatus = resolveStatusAfterImageDelete(property.status, token.role as string);
    property.status = newStatus;

    // Save property
    await property.save();

    // Delete from Cloudinary via shared service (log-and-continue on failure)
    const removedImage = { url: '', publicId };
    await cleanupOrphanedImages([removedImage], []);

    return NextResponse.json({
      success: true,
      data: property,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
