import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Favorite } from '@/models';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

/**
 * GET /api/favorites/check/:propertyId
 * Check if the authenticated user has favorited a property
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // No rate limiting - this is a lightweight read-only check with no side effects

    await connectDB();

    const favorite = await Favorite.findOne({ user: token.userId, property: propertyId }).select('_id');

    return NextResponse.json({ success: true, data: { isFavorited: !!favorite, favoriteId: favorite?._id ?? null } });
  } catch (error) {
    return handleApiError(error);
  }
}
