import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { forgotPasswordSchema } from '@/types/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { generatePasswordResetToken } from '@/services/auth.service';
import { sendPasswordResetEmail } from '@/services/email.service';

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
    const validationResult = forgotPasswordSchema.safeParse(body);
    
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
    // But only actually send email if user exists
    if (user) {
      const token = await generatePasswordResetToken(user._id.toString());
      const emailResult = await sendPasswordResetEmail(email, token);
      
      if (!emailResult.success) {
        // Log error but still return generic success (enumeration protection)
        console.error('Failed to send password reset email to:', email.replace(/[\r\n]/g, ''));
      }
    }
    
    // Generic success message for all cases (enumeration protection)
    return NextResponse.json(
      {
        success: true,
        message: 'If that email is registered, you will receive a password reset link.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
