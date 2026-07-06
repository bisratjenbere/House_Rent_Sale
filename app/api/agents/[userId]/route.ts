import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Property, User } from '@/models';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { propertySearchQuerySchema } from '@/types/property-search';
import { applyCursor } from '@/services/property-search.service';

/**
 * GET /api/agents/:userId
 * Returns public agent profile + their cursor-paginated published listings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    await connectDB();

    // 404 if user owns zero published properties (not a public agent)
    const hasPublished = await Property.exists({ owner: userId, status: 'published' });
    if (!hasPublished) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Public profile fields only
    const agent = await User.findById(userId).select('name avatar phone bio');
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Cursor-paginated published listings scoped to this owner
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const { data: query } = propertySearchQuerySchema.safeParse(rawQuery) ?? {};
    const limit = query?.limit ?? 12;
    const cursor = query?.cursor;

    const filter: Record<string, unknown> = { owner: userId, status: 'published' };
    applyCursor(filter, cursor);

    const properties = await Property.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('category', 'name slug')
      .populate('owner', 'name avatar');

    const hasMore = properties.length > limit;
    const trimmed = hasMore ? properties.slice(0, limit) : properties;
    const nextCursor = hasMore ? trimmed[trimmed.length - 1]._id.toString() : null;

    return NextResponse.json({
      success: true,
      data: { agent, properties: trimmed, nextCursor, hasMore },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
