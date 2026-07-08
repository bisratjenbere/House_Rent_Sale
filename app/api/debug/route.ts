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

    const testId = '6a4e3e01e2c7d53022613cc0';

    // Test 1: plain findOne
    try {
      const p1 = await Property.findOne({ _id: testId, status: 'published' }, { _id: 1, title: 1 }).lean();
      info.test1_plainFindOne = p1 ? `✅ found: ${(p1 as any).title}` : '❌ not found';
    } catch (e) {
      info.test1_plainFindOne = `❌ error: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test 2: with populate
    try {
      const p2 = await Property.findOne({ _id: testId, status: 'published' })
        .populate('category', 'name slug')
        .populate('amenities', 'name icon')
        .populate('owner', 'name avatar email phone bio')
        .lean();
      info.test2_withPopulate = p2 ? `✅ found: ${(p2 as any).title}` : '❌ not found';
      if (p2) {
        info.test2_category = (p2 as any).category;
        info.test2_owner = (p2 as any).owner ? `✅ ${(p2 as any).owner.name}` : '❌ null';
        info.test2_amenities = (p2 as any).amenities?.length;
      }
    } catch (e) {
      info.test2_withPopulate = `❌ error: ${e instanceof Error ? e.message : String(e)}`;
    }
  } catch (err) {
    info.db = `❌ ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json(info);
}
