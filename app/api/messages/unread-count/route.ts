import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Message } from '@/models';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

/**
 * GET /api/messages/unread-count
 * Returns total unread message count for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Higher limit for polling — sidebar + messages page both fetch this frequently
    const rateLimitResult = await checkRateLimit(token.userId as string, 120, 60, 'messages:unread');
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    await connectDB();

    const unreadCount = await Message.countDocuments({ receiver: token.userId, read: false });

    return NextResponse.json({ success: true, data: { unreadCount } });
  } catch (error) {
    return handleApiError(error);
  }
}
