import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimit(ip, 10, 60, 'auth-log');
    if (!rl.success) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await request.json();

    // Sanitize: only log known safe scalar fields, truncated
    const message = String(body.message ?? '').slice(0, 200);
    const level = String(body.level ?? '').slice(0, 20);
    const code = String(body.code ?? '').slice(0, 50);

    console.error('[NextAuth Client Error]:', { message, level, code });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to log NextAuth error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
