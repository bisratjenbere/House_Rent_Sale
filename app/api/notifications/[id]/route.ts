import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Notification } from '@/models';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });

    const { id } = await params;
    await connectDB();

    const notification = await Notification.findById(id);
    if (!notification || notification.user.toString() !== token.userId) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    await Notification.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
