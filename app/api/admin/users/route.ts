import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { userSearchQuerySchema } from '@/types/admin-user';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { getUsersWithPropertyCount } from '@/services/admin.service';

/**
 * GET /api/admin/users
 * List all users with optional filtering and pagination (US-1)
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

    const { searchParams } = new URL(request.url);
    const queryResult = userSearchQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!queryResult.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: queryResult.error.issues }, { status: 400 });
    }

    const { role, search, page, limit } = queryResult.data;

    await connectDB();

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      getUsersWithPropertyCount(filter, (page - 1) * limit, limit),
    ]);

    return NextResponse.json({
      success: true,
      data: { users, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
