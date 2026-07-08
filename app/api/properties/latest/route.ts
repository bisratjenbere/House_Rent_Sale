import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Property } from '@/models';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * GET /api/properties/latest
 * Returns latest published properties for homepage
 */
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 20);

    await connectDB();

    const properties = await Property.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('category', 'name slug')
      .populate('owner', 'name avatar');

    return NextResponse.json({ success: true, data: { properties } });
  } catch (error) {
    return handleApiError(error);
  }
}
