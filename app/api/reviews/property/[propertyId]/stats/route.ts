import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { calculateReviewStats } from '@/services/review.service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ propertyId: string }> }) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateLimitResult = await checkRateLimit(ip, 100, 60);
    if (!rateLimitResult.success) return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });

    const { propertyId } = await params;
    await connectDB();

    const stats = await calculateReviewStats(propertyId);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return handleApiError(error);
  }
}
