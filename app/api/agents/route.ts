import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Property } from '@/models';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

/**
 * GET /api/agents
 * Returns users with at least one published property (derived via aggregation, D10)
 */
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    await connectDB();

    const [result] = await Property.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$owner', propertyCount: { $sum: 1 } } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          agents: [
            { $sort: { propertyCount: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
              },
            },
            { $unwind: '$user' },
            {
              $project: {
                _id: 0,
                userId: '$_id',
                name: '$user.name',
                avatar: '$user.avatar',
                phone: '$user.phone',
                bio: '$user.bio',
                propertyCount: 1,
              },
            },
          ],
        },
      },
    ]);

    const total = result.total[0]?.count ?? 0;
    const agents = result.agents;

    return NextResponse.json({
      success: true,
      data: {
        agents,
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
