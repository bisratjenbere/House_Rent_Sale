import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Property } from '@/models';
import { createPropertySchema } from '@/types/property';
import { propertySearchQuerySchema } from '@/types/property-search';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import {
  buildPropertyFilter,
  buildSortStage,
  applyCursor,
} from '@/services/property-search.service';
import { buildRadiusFilter } from '@/lib/geospatial';

/**
 * GET /api/properties
 * Public property listing with filtering, search, and cursor-based pagination
 */
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const validation = propertySearchQuerySchema.safeParse(rawQuery);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const query = validation.data;
    await connectDB();

    const filter = await buildPropertyFilter(query);

    // Radius search (US-7): all three params must be present together
    if (query.centerLat !== undefined || query.centerLng !== undefined || query.radiusKm !== undefined) {
      if (query.centerLat === undefined || query.centerLng === undefined || query.radiusKm === undefined) {
        return NextResponse.json(
          { success: false, error: 'Radius search requires centerLat, centerLng, and radiusKm' },
          { status: 400 }
        );
      }

      const radiusFilter = buildRadiusFilter(query.centerLat, query.centerLng, query.radiusKm);
      if (!radiusFilter) {
        return NextResponse.json(
          { success: false, error: 'Invalid radius search parameters' },
          { status: 400 }
        );
      }

      // Merge radius filter (AND combination with existing filters)
      Object.assign(filter, radiusFilter);

      // Radius replaces city filter — mutually exclusive per US-7
      delete (filter as Record<string, unknown>).city;
    }

    if (query.search) {
      // Text search branch: offset-based pagination (score sort doesn't compose with cursor)
      const skip = (query.page - 1) * query.limit;
      const properties = await Property.find(filter, { score: { $meta: 'textScore' } })
        .sort(buildSortStage(query))
        .skip(skip)
        .limit(query.limit)
        .populate('category', 'name slug')
        .populate('owner', 'name avatar');

      const total = await Property.countDocuments(filter);

      return NextResponse.json({
        success: true,
        data: {
          properties,
          total,
          page: query.page,
          hasMore: skip + properties.length < total,
          nextCursor: null,
        },
      });
    }

    // Cursor-based pagination branch (D9)
    applyCursor(filter, query.cursor);
    const properties = await Property.find(filter)
      .sort(buildSortStage(query))
      .limit(query.limit + 1)
      .populate('category', 'name slug')
      .populate('owner', 'name avatar');

    const hasMore = properties.length > query.limit;
    const trimmed = hasMore ? properties.slice(0, query.limit) : properties;
    const nextCursor = hasMore ? trimmed[trimmed.length - 1]._id.toString() : null;

    return NextResponse.json({
      success: true,
      data: { properties: trimmed, nextCursor, hasMore },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

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
