import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Geocoding proxy API to avoid CORS issues with Nominatim.
 * Nominatim Usage Policy: Must use a custom User-Agent and limit request rate.
 * This server-side proxy adds proper headers and can be rate-limited.
 */

// GET /api/geocode?q=address - Forward geocode (address -> coordinates)
// GET /api/geocode?lat=9.03&lng=38.76 - Reverse geocode (coordinates -> address)
export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 30 req/min per IP
    const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit');
    const ip = getClientIp(request);
    const rl = await checkRateLimit(ip, 30, 60, 'geocode');
    if (!rl.success) {
      return NextResponse.json({ success: false, error: rl.error }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const address = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // Validate lat/lng are numeric before interpolating into URL
    if ((lat !== null || lng !== null) && (isNaN(Number(lat)) || isNaN(Number(lng)))) {
      return NextResponse.json({ success: false, error: 'Invalid coordinates' }, { status: 400 });
    }

    let url: string;
    
    if (address) {
      // Forward geocoding: address -> coordinates
      url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    } else if (lat && lng) {
      // Reverse geocoding: coordinates -> address
      url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Add User-Agent header as required by Nominatim Usage Policy
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'HouseHub/1.0 (house-rent-sale-puce.vercel.app)',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Geocoding request failed' },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (address) {
      // Forward geocoding response
      if (!data.length) {
        return NextResponse.json({
          success: true,
          data: null,
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        },
      });
    } else {
      // Reverse geocoding response
      return NextResponse.json({
        success: true,
        data: {
          address: data.display_name || null,
        },
      });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
