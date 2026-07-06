import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/handleApiError';
import { assertOwnerOrAdmin } from '@/services/property.service';
import { notifyAllAdmins } from '@/services/notification.service';

/**
 * POST /api/properties/:id/submit
 * Submit a property for admin review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Assert ownership or admin role
    const property = await assertOwnerOrAdmin(
      id,
      token.userId as string,
      token.role as string
    );

    // Verify current status is draft or rejected
    if (property.status !== 'draft' && property.status !== 'rejected') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only draft or rejected properties can be submitted for review',
        },
        { status: 400 }
      );
    }

    // Update status to pending_review and clear rejection reason
    property.status = 'pending_review';
    property.rejectionReason = undefined;
    await property.save();

    // Notify all admins
    await notifyAllAdmins({
      type: 'property_status',
      title: 'New Property Submission',
      message: `A new property "${property.title}" has been submitted for review`,
      link: `/admin/properties/${property._id}`,
      relatedProperty: property._id,
      relatedPropertyStatus: 'pending_review',
    });

    return NextResponse.json({
      success: true,
      data: property,
      message: 'Property submitted for review successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
