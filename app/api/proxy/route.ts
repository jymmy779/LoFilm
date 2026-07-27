import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRedis } from '@/app/lib/fetch-with-redis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter is missing' }, { status: 400 });
  }

  try {
    const revalidateParam = searchParams.get('revalidate');
    const revalidate = revalidateParam ? parseInt(revalidateParam) : 60;

    const data = await fetchWithRedis(targetUrl, { revalidate });

    if (!data) {
      throw new Error('Dữ liệu không tồn tại hoặc lỗi kết nối từ nguồn API (TMDB/PhimAPI)');
    }

    // For long-lived static data (>= 1 hour), allow browser to cache it too.
    // This eliminates repeated hits to VPS for data like the-loai/quoc-gia that rarely change.
    const isLongLived = revalidate >= 3600;
    const cacheControlHeader = isLongLived
      ? `public, max-age=${revalidate}, stale-while-revalidate=600`
      : 'no-cache, no-store, must-revalidate';

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': cacheControlHeader,
      }
    });
  } catch (error: any) {
    console.error('Proxy error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

