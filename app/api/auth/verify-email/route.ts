import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyEmailSchema } from '@/types/auth';
import { verifyEmailToken } from '@/services/auth.service';

export async function GET(request: NextRequest) {
  try {
    // Extract token from query params
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    // Validate token
    const validationResult = verifyEmailSchema.safeParse({ token });
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Verify token and mark user as verified
    const result = await verifyEmailToken(validationResult.data.token);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
    // Redirect to login page with verified flag
    return NextResponse.redirect(new URL('/login?verified=true', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
