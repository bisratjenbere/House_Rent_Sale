import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { User, Property, Category, Amenity } from '@/models';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

/**
 * GET /api/admin/dashboard
 * Returns basic platform stats for the admin dashboard (US-23)
 */
export async function GET(request: NextRequest) {
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

    const [totalUsers, totalProperties, pendingApprovals, totalCategories, totalAmenities] = await Promise.all([
      User.countDocuments({}),
      Property.countDocuments({}),
      Property.countDocuments({ status: 'pending_review' }),
      Category.countDocuments({}),
      Amenity.countDocuments({}),
    ]);

    return NextResponse.json({
      success: true,
      data: { stats: { totalUsers, totalProperties, pendingApprovals, totalCategories, totalAmenities } },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
