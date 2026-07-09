import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.error('[NextAuth Client Error]:', {
      message: body.message,
      level: body.level,
      code: body.code,
    });

    // Return success response
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to log NextAuth error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
