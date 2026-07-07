import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import { Category, Property } from '@/models';
import { updateCategorySchema } from '@/types/category';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/handleApiError';
import { generateSlug } from '@/services/slug.service';

/**
 * PUT /api/admin/categories/:id
 * Update a category, regenerating slug if name changed (US-15)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const bodyResult = updateCategorySchema.safeParse(body);
    if (!bodyResult.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: bodyResult.error.issues }, { status: 400 });
    }

    await connectDB();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (bodyResult.data.name) {
      const newSlug = generateSlug(bodyResult.data.name);
      const exists = await Category.exists({ slug: newSlug, _id: { $ne: id } });
      if (exists) {
        return NextResponse.json({ success: false, error: 'A category with this name already exists' }, { status: 400 });
      }
      updates.name = bodyResult.data.name;
      updates.slug = newSlug;
    }

    if (bodyResult.data.description !== undefined) {
      updates.description = bodyResult.data.description;
    }

    const updated = await Category.findByIdAndUpdate(id, updates, { new: true });

    return NextResponse.json({ success: true, data: { category: updated } });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/categories/:id
 * Delete a category only if no properties are using it (US-16)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const count = await Property.countDocuments({ category: id });
    if (count > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category: one or more properties are using it. Reassign those properties first.' },
        { status: 400 }
      );
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
