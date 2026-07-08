import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Amenity } from '@/models';
import { handleApiError } from '@/lib/handleApiError';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const amenities = await Amenity.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: amenities });
  } catch (error) {
    return handleApiError(error);
  }
}
