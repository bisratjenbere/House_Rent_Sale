import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Category } from '@/models';
import { createCategorySchema } from '@/types/category';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { getCategoriesWithPropertyCount } from '@/services/admin.service';
import { generateSlug } from '@/services/slug.service';

/**
 * GET /api/admin/categories
 * List all categories with property counts (US-13)
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

    const categories = await getCategoriesWithPropertyCount();

    return NextResponse.json({ success: true, data: { categories } });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/categories
 * Create a new category with auto-generated slug (US-14)
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
    const bodyResult = createCategorySchema.safeParse(body);
    if (!bodyResult.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: bodyResult.error.issues }, { status: 400 });
    }

    await connectDB();

    const slug = generateSlug(bodyResult.data.name);
    const exists = await Category.exists({ slug });
    if (exists) {
      return NextResponse.json({ success: false, error: 'A category with this name already exists' }, { status: 400 });
    }

    const category = await Category.create({ name: bodyResult.data.name, slug, description: bodyResult.data.description });

    return NextResponse.json({ success: true, data: { category } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
