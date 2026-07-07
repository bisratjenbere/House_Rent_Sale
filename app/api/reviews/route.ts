import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Review, User } from '@/models';
import { createReviewSchema } from '@/types/review';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { assertReviewEligible } from '@/services/review.service';
import { notifySingleUser } from '@/services/notification.service';
import { sendReviewNotificationEmail } from '@/services/email.service';

export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });

    const body = await request.json();
    const validation = createReviewSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ success: false, error: 'Validation failed', details: validation.error.issues }, { status: 400 });

    const { propertyId, rating, comment } = validation.data;
    await connectDB();

    const property = await assertReviewEligible(token.userId as string, propertyId);
    const review = await Review.create({ property: propertyId, user: token.userId, rating, comment });

    const ownerId = property.owner.toString();
    const excerpt = comment.length > 100 ? comment.substring(0, 100) + '...' : comment;

    notifySingleUser(ownerId, {
      type: 'review',
      title: `New review on ${property.title}`,
      message: excerpt,
      link: `/properties/${propertyId}`,
      relatedProperty: propertyId,
    }).catch((err) => console.error('Failed to create review notification:', err));

    const owner = await User.findById(ownerId).select('emailNotificationsEnabled email');
    if (owner?.emailNotificationsEnabled) {
      sendReviewNotificationEmail(owner.email, property.title, rating, excerpt, propertyId).catch(
        (err) => console.error('Failed to send review notification email:', err)
      );
    }

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
