import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { registerSchema } from '@/types/auth';
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
    const validationResult = registerSchema.safeParse(body);
    
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
    
    const { name, email, password } = validationResult.data;
    
    await connectDB();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Hash password (cost 10)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with role = 'user' unconditionally
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user', // Always 'user', ignore any client-submitted role
      emailVerified: false,
      emailNotificationsEnabled: true, // D14
    });
    
    // Generate verification token
    const verificationToken = await generateVerificationToken(user._id.toString());
    
    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken);
    
    if (!emailResult.success) {
      // Email send failed - log and return special message
      console.error('⚠️  ALERT: Verification email failed to send for user:', email);
      return NextResponse.json(
        {
          success: true,
          message: 'Registration successful, but the verification email failed to send. Please use the resend verification option.',
          emailSent: false,
        },
        { status: 201 }
      );
    }
    
    // Success - email sent
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please check your email to verify your account before logging in.',
        emailSent: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
