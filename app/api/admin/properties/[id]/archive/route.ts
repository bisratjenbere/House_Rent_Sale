import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Property } from '@/models';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

/**
 * PATCH /api/admin/properties/:id/archive
 * Archive a property from any status (US-9)
 */
export async function PATCH(
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

    const property = await Property.findByIdAndUpdate(id, { status: 'archived' }, { new: true });
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { property } });
  } catch (error) {
    return handleApiError(error);
  }
}
