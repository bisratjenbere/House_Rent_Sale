import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Property } from '@/models';
import { handleApiError } from '@/lib/handleApiError';

/**
 * GET /api/properties/my
 * Get current user's properties with optional status filter
 * Query params: ?status=draft|pending_review|published|rejected|rented|sold|archived
 *               ?page=1 (default)
 *               ?limit=20 (default)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Extract query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const skip = (page - 1) * limit;

    const allowedStatuses = ['draft', 'pending_review', 'published', 'rejected', 'rented', 'sold', 'archived'];

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status value' }, { status: 400 });
    }

    // Build query
    const query: Record<string, unknown> = { owner: token.userId };
    if (status) query.status = status;

    // Get total count for pagination
    const total = await Property.countDocuments(query);

    // Get properties
    const properties = await Property.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
