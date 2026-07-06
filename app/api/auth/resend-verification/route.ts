import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { resendVerificationSchema } from '@/types/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { generateVerificationToken } from '@/services/auth.service';
import { sendVerificationEmail } from '@/services/email.service';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, 5, 60);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.error },
        { status: 429 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = resendVerificationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }
    
    const { email } = validationResult.data;
    
    await connectDB();
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Enumeration protection: always return generic success message
    // But only actually send email if user exists and is unverified
    if (user && !user.emailVerified) {
      const token = await generateVerificationToken(user._id.toString());
      const emailResult = await sendVerificationEmail(email, token);
      
      if (!emailResult.success) {
        // Log error but still return generic success (enumeration protection)
        console.error('Failed to resend verification email to:', email.replace(/[\r\n]/g, ''));
      }
    }
    
    // Generic success message for all cases (enumeration protection)
    return NextResponse.json(
      {
        success: true,
        message: 'If that email is registered and unverified, a verification email has been sent.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
