import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Notification } from '@/models';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = 20;

    await connectDB();

    const [notifications, total] = await Promise.all([
      Notification.find({ user: token.userId })
        .populate('relatedProperty', 'title images')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments({ user: token.userId }),
    ]);

    return NextResponse.json({ success: true, data: { notifications, total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error);
  }
}
