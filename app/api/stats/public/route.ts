import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Property, Category } from '@/models';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats/public
 * Returns aggregated platform statistics for homepage
 */
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    await connectDB();

    const [totalProperties, totalCategories, ownerIds, cityIds] = await Promise.all([
      Property.countDocuments({ status: 'published' }),
      Category.countDocuments({}),
      Property.distinct('owner', { status: 'published' }),
      Property.distinct('city', { status: 'published' }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalProperties,
        totalCategories,
        totalAgents: ownerIds.length,
        totalCities: cityIds.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
