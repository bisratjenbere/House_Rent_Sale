import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ensureGeospatialIndex } from '@/lib/geospatial';
import { handleApiError } from '@/lib/handleApiError';

export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

/**
 * POST /api/init
 * Admin-only: creates the compound geospatial index on Property.location.
 * Idempotent — safe to call multiple times (T6).
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await ensureGeospatialIndex();

    return NextResponse.json({
      success: true,
      message: 'Geospatial index on location.lat + location.lng created (or already exists)',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
