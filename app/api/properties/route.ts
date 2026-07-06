import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Property } from '@/models';
import { createPropertySchema } from '@/types/property';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

/**
 * POST /api/properties
 * Create a new property listing
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - 10 requests per minute per user
    const rateLimitResult = await checkRateLimit(token.userId as string, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.error },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createPropertySchema.safeParse(body);

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

    // Connect to database
    await connectDB();

    // Create property with server-controlled fields
    // Force owner, status, and featured regardless of body content
    const property = await Property.create({
      ...validationResult.data,
      owner: token.userId, // Server-controlled
      status: 'draft', // Server-controlled
      featured: false, // Server-controlled
    });

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
