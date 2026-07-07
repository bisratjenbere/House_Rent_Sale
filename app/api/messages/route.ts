import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Message, User } from '@/models';
import { sendMessageSchema } from '@/types/message';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { assertNotPropertyOwner, groupMessagesByProperty } from '@/services/message.service';
import { notifySingleUser } from '@/services/notification.service';
import { sendMessageNotificationEmail } from '@/services/email.service';

/**
 * GET /api/messages
 * Inbox view — conversations grouped by property
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = 20;

    await connectDB();

    // Fetch only the messages needed for this page's conversations.
    // We over-fetch slightly (page * limit * 10) to have enough unique property
    // groups to fill the page after grouping, then paginate the grouped result.
    const fetchLimit = page * limit * 10;

    const messages = await Message.find({
      $or: [{ sender: token.userId }, { receiver: token.userId }],
    })
      .populate('property', 'title images')
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(fetchLimit);

    // Filter out messages where property was deleted
    const valid = messages.filter((m) => m.property !== null);

    const conversations = groupMessagesByProperty(token.userId as string, valid as never);
    const total = conversations.length;
    const paginated = conversations.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: {
        conversations: paginated,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/messages
 * Send a message about a property
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // D5: 20 req/min for messages
    const rateLimitResult = await checkRateLimit(token.userId as string, 20, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { propertyId, message } = validation.data;
    await connectDB();

    const property = await assertNotPropertyOwner(token.userId as string, propertyId);

    const newMessage = await Message.create({
      property: propertyId,
      sender: token.userId,
      receiver: property.owner,
      message,
      read: false,
    });

    const receiverId = property.owner.toString();
    const excerpt = message.length > 100 ? message.substring(0, 100) + '...' : message;

    // In-app notification (best-effort — don't block on failure)
    notifySingleUser(receiverId, {
      type: 'message',
      title: `New message about ${property.title}`,
      message: excerpt,
      link: `/dashboard/messages?property=${propertyId}`,
      relatedProperty: propertyId,
    }).catch((err) => console.error('Failed to create message notification:', err));

    // Email notification — only if receiver has enabled it (D14)
    const receiver = await User.findById(receiverId).select('emailNotificationsEnabled email');
    if (receiver?.emailNotificationsEnabled) {
      sendMessageNotificationEmail(receiver.email, property.title, excerpt, propertyId).catch(
        (err) => console.error('Failed to send message notification email:', err)
      );
    }

    return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
