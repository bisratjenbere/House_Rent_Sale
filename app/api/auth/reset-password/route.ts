import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { resetPasswordSchema } from '@/types/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifyPasswordResetToken, resetPassword } from '@/services/auth.service';

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
    const validationResult = resetPasswordSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { token, password } = validationResult.data;
    
    await connectDB();
    
    // Verify token and check expiry
    const tokenResult = await verifyPasswordResetToken(token);
    
    if (!tokenResult.success) {
      return NextResponse.json(
        { success: false, error: tokenResult.error },
        { status: 400 }
      );
    }
    
    // Hash new password (cost 10)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Reset password and clear token fields
    await resetPassword(tokenResult.userId!, hashedPassword);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successful. You can now log in with your new password.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
