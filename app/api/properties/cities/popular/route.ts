import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Property } from '@/models';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

export const revalidate = 300; // 5-minute ISR

/**
 * GET /api/properties/cities/popular
 * Returns top cities by published listing count
 */
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);

    await connectDB();

    const cities = await Property.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { city: '$_id', count: 1, _id: 0 } },
    ]);

    return NextResponse.json({ success: true, data: { cities } });
  } catch (error) {
    return handleApiError(error);
  }
}
