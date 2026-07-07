import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { handleApiError } from '@/lib/handleApiError';
import { deleteAccountRequestSchema } from '@/types/profile';
import { sendDeleteAccountRequestEmail } from '@/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = deleteAccountRequestSchema.parse(body);

    await connectDB();
    const user = await User.findById(session.user.id).select('name email password').lean() as {
      name: string;
      email: string;
      password: string;
    } | null;

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const match = await bcrypt.compare(parsed.currentPassword, user.password);
    if (!match) {
      return NextResponse.json({ success: false, error: 'Password is incorrect' }, { status: 401 });
    }

    // Notify admin — best-effort, do not fail the request if email fails
    const emailResult = await sendDeleteAccountRequestEmail(user.name, user.email);
    if (!emailResult.success) {
      console.error('Delete account request email failed for user:', user.email);
    }

    // No data is deleted or modified — this is a notify-only placeholder
    return NextResponse.json({
      success: true,
      message: 'Your account deletion request has been received. Our team will process it shortly.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
