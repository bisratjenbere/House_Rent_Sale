import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { connectDB } from '@/lib/db';
import { ContactInquiry } from '@/models';
import { handleApiError } from '@/lib/handleApiError';

// Validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 req/min/IP (per tech.md D12)
    const ip = getClientIp(req);
    const rateLimitResult = await checkRateLimit(ip, 5, 60);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = contactSchema.parse(body);

    // Connect to database
    await connectDB();

    // Create contact inquiry
    const inquiry = await ContactInquiry.create({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone || '',
      message: validatedData.message,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: inquiry._id,
        message: 'Thank you for your message. We will get back to you soon.',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
