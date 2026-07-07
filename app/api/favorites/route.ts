import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Favorite } from '@/models';
import { addFavoriteSchema } from '@/types/favorite';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { assertPropertyPublished, isFavorited } from '@/services/favorite.service';

/**
 * GET /api/favorites
 * List authenticated user's favorites (published properties only)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    await connectDB();

    const allFavorites = await Favorite.find({ user: token.userId })
      .populate({
        path: 'property',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'owner', select: 'name avatar' },
        ],
      })
      .sort({ createdAt: -1 });

    // Filter out deleted or unpublished properties
    const valid = allFavorites.filter(
      (f) => f.property && (f.property as { status?: string }).status === 'published'
    );

    const total = valid.length;
    const paginated = valid.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: {
        favorites: paginated,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/favorites
 * Add a property to favorites
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(token.userId as string, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    const body = await request.json();
    const validation = addFavoriteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { propertyId } = validation.data;
    await connectDB();

    await assertPropertyPublished(propertyId);

    if (await isFavorited(token.userId as string, propertyId)) {
      return NextResponse.json(
        { success: false, error: 'Property is already in your favorites' },
        { status: 400 }
      );
    }

    const favorite = await Favorite.create({ user: token.userId, property: propertyId });

    return NextResponse.json({ success: true, data: favorite }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
