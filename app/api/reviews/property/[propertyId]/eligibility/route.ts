import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { checkReviewEligibility } from '@/services/review.service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ propertyId: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // No rate limiting - this is a lightweight read-only check with no side effects

    const { propertyId } = await params;
    await connectDB();

    const result = await checkReviewEligibility(token.userId as string, propertyId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
