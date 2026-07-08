import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models';
import { handleApiError } from '@/lib/handleApiError';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return handleApiError(error);
  }
}
