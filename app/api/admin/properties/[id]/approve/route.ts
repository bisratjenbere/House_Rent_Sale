import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Property, User } from '@/models';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { notifySingleUser } from '@/services/notification.service';
import { sendPropertyStatusNotificationEmail } from '@/services/email.service';

/**
 * PATCH /api/admin/properties/:id/approve
 * Approve a pending_review property (US-7)
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

    await connectDB();

    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    if (property.status !== 'pending_review') {
      return NextResponse.json({ success: false, error: 'Property is not pending approval' }, { status: 400 });
    }

    property.status = 'published';
    property.rejectionReason = undefined;
    await property.save();

    // In-app notification
    await notifySingleUser(property.owner.toString(), {
      type: 'property_status',
      title: `Your property "${property.title}" has been approved`,
      message: 'Your listing is now live',
      link: `/properties/${id}`,
      relatedProperty: property._id as string,
      relatedPropertyStatus: 'published',
    });

    // Email notification (D14)
    const owner = await User.findById(property.owner).select('emailNotificationsEnabled email');
    if (owner?.emailNotificationsEnabled === true) {
      const emailResult = await sendPropertyStatusNotificationEmail(owner.email, property.title, 'approved');
      if (!emailResult.success) console.error('Property approval email failed:', emailResult.error);
    }

    return NextResponse.json({ success: true, data: { property } });
  } catch (error) {
    return handleApiError(error);
  }
}
