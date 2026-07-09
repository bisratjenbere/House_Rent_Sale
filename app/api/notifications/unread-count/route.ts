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

    // Higher limit for polling endpoint (120 req/min = 2 req/sec)
    const rateLimitResult = await checkRateLimit(token.userId as string, 120, 60, 'notifications:unread');
    if (!rateLimitResult.success) return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });

    await connectDB();
    const unreadCount = await Notification.countDocuments({ user: token.userId, read: false });

    return NextResponse.json({ success: true, data: { unreadCount } });
  } catch (error) {
    return handleApiError(error);
  }
}
