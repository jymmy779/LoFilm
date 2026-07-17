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
    const revalidate = revalidateParam ? parseInt(revalidateParam) : 60; // Sync 60 giây với prefetch-home

    const data = await fetchWithRedis(targetUrl, { revalidate });

    if (!data) {
      throw new Error('Dữ liệu không tồn tại hoặc lỗi kết nối từ nguồn API (TMDB/PhimAPI)');
    }

    return NextResponse.json(data, {
      headers: {
        // Không cho Cloudflare/edge cache proxy (dữ liệu luôn thay đổi)
        'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'CDN-Cache-Control': 'no-cache',
        'Cloudflare-CDN-Cache-Control': 'no-cache',
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
