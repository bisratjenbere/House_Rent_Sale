import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { handleApiError } from '@/lib/handleApiError';
import { checkRateLimit } from '@/lib/rate-limit';
import { isPasswordChangeRequest } from '@/services/profile.service';
import { updateNotificationSettingsSchema, changePasswordSchema } from '@/types/profile';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('emailNotificationsEnabled').lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { emailNotificationsEnabled: (user as { emailNotificationsEnabled: boolean }).emailNotificationsEnabled } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await connectDB();

    if (isPasswordChangeRequest(body)) {
      // Password change branch — rate limited (5/min/user)
      const rl = await checkRateLimit(session.user.id, 5, 60);
      if (!rl.success) {
        return NextResponse.json({ success: false, error: rl.error }, { status: 429 });
      }

      const parsed = changePasswordSchema.parse(body);

      const user = await User.findById(session.user.id).select('password').lean() as { password: string } | null;
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      const match = await bcrypt.compare(parsed.currentPassword, user.password);
      if (!match) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
      }

      const hashed = await bcrypt.hash(parsed.newPassword, 10);
      await User.findByIdAndUpdate(session.user.id, { $set: { password: hashed } });

      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    // Notification settings branch — no rate limit
    const parsed = updateNotificationSettingsSchema.parse(body);
    await User.findByIdAndUpdate(session.user.id, { $set: { emailNotificationsEnabled: parsed.emailNotificationsEnabled } });

    return NextResponse.json({ success: true, message: 'Notification settings updated' });
  } catch (error) {
    return handleApiError(error);
  }
}
