import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { User, Property, Message, Favorite, Review } from '@/models';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

/**
 * GET /api/admin/analytics
 * Returns analytics data for the admin analytics dashboard (MVP)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.error },
        { status: 429 }
      );
    }

    await connectDB();

    // Calculate start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch overview stats
    const [
      totalUsers,
      totalProperties,
      newUsersThisMonth,
      newPropertiesThisMonth,
      totalMessages,
      totalFavorites,
      totalReviews,
      propertyStatusBreakdown,
    ] = await Promise.all([
      // Total users (all time)
      User.countDocuments({}),

      // Total properties (all time)
      Property.countDocuments({}),

      // New users this month
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),

      // New published properties this month
      Property.countDocuments({
        status: 'published',
        createdAt: { $gte: startOfMonth },
      }),

      // Total messages (engagement)
      Message.countDocuments({}),

      // Total favorites (engagement)
      Favorite.countDocuments({}),

      // Total reviews (engagement)
      Review.countDocuments({}),

      // Property status breakdown (for pie chart)
      Property.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            status: '$_id',
            count: 1,
          },
        },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProperties,
          newUsersThisMonth,
          newPropertiesThisMonth,
          totalMessages,
          totalFavorites,
          totalReviews,
        },
        propertyStatusBreakdown,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
