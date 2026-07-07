import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Property, User } from '@/models';
import { rejectPropertySchema } from '@/types/admin-property';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { notifySingleUser } from '@/services/notification.service';
import { sendPropertyStatusNotificationEmail } from '@/services/email.service';

/**
 * PATCH /api/admin/properties/:id/reject
 * Reject a pending_review property with a reason (US-8)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    const body = await request.json();
    const bodyResult = rejectPropertySchema.safeParse(body);
    if (!bodyResult.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: bodyResult.error.issues }, { status: 400 });
    }

    await connectDB();

    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    if (property.status !== 'pending_review') {
      return NextResponse.json({ success: false, error: 'Property is not pending approval' }, { status: 400 });
    }

    property.status = 'rejected';
    property.rejectionReason = bodyResult.data.rejectionReason;
    await property.save();

    const reasonExcerpt = bodyResult.data.rejectionReason.substring(0, 100) +
      (bodyResult.data.rejectionReason.length > 100 ? '...' : '');

    // In-app notification
    await notifySingleUser(property.owner.toString(), {
      type: 'property_status',
      title: `Your property "${property.title}" was not approved`,
      message: reasonExcerpt,
      link: `/dashboard/properties/${id}/edit`,
      relatedProperty: property._id as string,
      relatedPropertyStatus: 'rejected',
    });

    // Email notification (D14)
    const owner = await User.findById(property.owner).select('emailNotificationsEnabled email');
    if (owner?.emailNotificationsEnabled === true) {
      const emailResult = await sendPropertyStatusNotificationEmail(
        owner.email,
        property.title,
        'rejected',
        bodyResult.data.rejectionReason
      );
      if (!emailResult.success) console.error('Property rejection email failed:', emailResult.error);
    }

    return NextResponse.json({ success: true, data: { property } });
  } catch (error) {
    return handleApiError(error);
  }
}
