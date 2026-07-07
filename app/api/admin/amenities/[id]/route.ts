import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Amenity, Property } from '@/models';
import { updateAmenitySchema } from '@/types/amenity';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

/**
 * PUT /api/admin/amenities/:id
 * Update an amenity with case-insensitive uniqueness check (US-20)
 */
export async function PUT(
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

    const body = await request.json();
    const bodyResult = updateAmenitySchema.safeParse(body);
    if (!bodyResult.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: bodyResult.error.issues }, { status: 400 });
    }

    await connectDB();

    const amenity = await Amenity.findById(id);
    if (!amenity) {
      return NextResponse.json({ success: false, error: 'Amenity not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (bodyResult.data.name) {
      const exists = await Amenity.exists({
        name: { $regex: new RegExp(`^${bodyResult.data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        _id: { $ne: id },
      });
      if (exists) {
        return NextResponse.json({ success: false, error: 'An amenity with this name already exists' }, { status: 400 });
      }
      updates.name = bodyResult.data.name;
    }

    if (bodyResult.data.icon !== undefined) {
      updates.icon = bodyResult.data.icon;
    }

    const updated = await Amenity.findByIdAndUpdate(id, updates, { new: true });

    return NextResponse.json({ success: true, data: { amenity: updated } });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/amenities/:id
 * Delete an amenity immediately (no protection check) (US-21)
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

    const count = await Property.countDocuments({ amenities: id });
    if (count > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete amenity: ${count} propert${count === 1 ? 'y is' : 'ies are'} using it. Remove it from those properties first.` },
        { status: 400 }
      );
    }

    const deleted = await Amenity.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Amenity not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Amenity deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
