import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Message } from '@/models';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { assertConversationParticipant } from '@/services/message.service';

/**
 * GET /api/messages/property/:propertyId
 * Conversation thread for a property — marks messages as read
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Higher limit for polling — users poll every 30s, so 120 req/min allows safe headroom
    const rateLimitResult = await checkRateLimit(token.userId as string, 120, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    await connectDB();

    await assertConversationParticipant(token.userId as string, propertyId);

    const messages = await Message.find({
      property: propertyId,
      $or: [{ sender: token.userId }, { receiver: token.userId }],
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 }); // oldest first — chat order

    // Mark received messages as read
    await Message.updateMany(
      { property: propertyId, receiver: token.userId, read: false },
      { read: true }
    );

    return NextResponse.json({ success: true, data: { messages } });
  } catch (error) {
    return handleApiError(error);
  }
}
