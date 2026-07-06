import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Property } from '@/models';
import { handleApiError } from '@/lib/handleApiError';
import {
  assertOwnerOrAdmin,
  resolveStatusAfterImageDelete,
} from '@/services/property.service';

/**
 * DELETE /api/properties/:id/images
 * Delete a single image from a property
 * Expects { publicId: string } in request body
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Assert ownership or admin role
    const property = await assertOwnerOrAdmin(
      params.id,
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

    // Delete from Cloudinary (log-and-continue on failure)
    try {
      const { v2: cloudinary } = await import('cloudinary');
      
      // Configure cloudinary
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted Cloudinary image: ${publicId}`);
    } catch (error) {
      console.error(`Failed to delete Cloudinary image ${publicId}:`, error);
      // Continue - don't block the DB update
    }

    return NextResponse.json({
      success: true,
      data: property,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
