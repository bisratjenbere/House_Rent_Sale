import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Amenity } from '@/models';
import { createAmenitySchema } from '@/types/amenity';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';

/**
 * GET /api/admin/amenities
 * List all amenities sorted alphabetically (US-18)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    await connectDB();

    const amenities = await Amenity.find().sort({ name: 1 });

    return NextResponse.json({ success: true, data: { amenities } });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/amenities
 * Create a new amenity with case-insensitive uniqueness check (US-19)
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    const body = await request.json();
    const bodyResult = createAmenitySchema.safeParse(body);
    if (!bodyResult.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: bodyResult.error.issues }, { status: 400 });
    }

    await connectDB();

    const exists = await Amenity.exists({
      name: { $regex: new RegExp(`^${bodyResult.data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (exists) {
      return NextResponse.json({ success: false, error: 'An amenity with this name already exists' }, { status: 400 });
    }

    const amenity = await Amenity.create({ name: bodyResult.data.name, icon: bodyResult.data.icon });

    return NextResponse.json({ success: true, data: { amenity } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
