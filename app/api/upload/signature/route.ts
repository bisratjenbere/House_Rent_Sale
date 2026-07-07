import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateUploadSignature } from '@/services/cloudinary.service';
import { handleApiError } from '@/lib/handleApiError';

export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

/**
 * POST /api/upload/signature
 * Generate Cloudinary upload signature for authenticated users
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - 60 requests per minute per user (standard authenticated tier)
    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.error },
        { status: 429 }
      );
    }

    // Generate and return upload signature
    const signatureData = generateUploadSignature();

    return NextResponse.json({
      success: true,
      data: signatureData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
