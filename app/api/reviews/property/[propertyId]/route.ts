import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Review } from '@/models';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

export async function GET(request: NextRequest, { params }: { params: Promise<{ propertyId: string }> }) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateLimitResult = await checkRateLimit(ip, 100, 60);
    if (!rateLimitResult.success) return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });

    const { propertyId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = 20;

    await connectDB();

    const [reviews, total] = await Promise.all([
      Review.find({ property: propertyId })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments({ property: propertyId }),
    ]);

    return NextResponse.json({ success: true, data: { reviews, total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error);
  }
}
