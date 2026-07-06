import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Property } from '@/models';
import { featuredToggleSchema } from '@/types/property';
import { handleApiError } from '@/lib/handleApiError';

/**
 * PATCH /api/admin/properties/:id/featured
 * Toggle the featured flag on a property (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // Defense in depth - re-check admin role inside handler
    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = featuredToggleSchema.safeParse(body);

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

    await connectDB();

    // Update only the featured field - no status change
    const property = await Property.findByIdAndUpdate(
      params.id,
      { featured: validationResult.data.featured },
      { new: true, runValidators: true }
    );

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: property,
      message: `Property ${validationResult.data.featured ? 'featured' : 'unfeatured'} successfully`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
