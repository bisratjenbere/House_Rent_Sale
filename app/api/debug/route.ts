import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Property } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET() {
  const info: Record<string, unknown> = {
    MONGODB_URI: process.env.MONGODB_URI ? '✅ set' : '❌ missing',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ set' : '❌ missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '❌ missing',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✅ set' : '❌ missing',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? '✅ set' : '❌ missing',
  };

  try {
    await connectDB();
    info.db = '✅ connected';

    const count = await Property.countDocuments({ status: 'published' });
    info.publishedProperties = count;

    const sample = await Property.findOne({ status: 'published' }, { _id: 1, title: 1 }).lean();
    info.sampleProperty = sample;
  } catch (err) {
    info.db = `❌ ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json(info);
}
