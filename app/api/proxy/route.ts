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
    const revalidate = revalidateParam ? parseInt(revalidateParam) : 300; // Tăng lên 5 phút mặc định

    const data = await fetchWithRedis(targetUrl, { revalidate });

    if (!data) {
      throw new Error('Dữ liệu không tồn tại hoặc lỗi kết nối từ nguồn API (TMDB/PhimAPI)');
    }

    return NextResponse.json(data, {
      headers: {
        // s-maxage for CDN/Vercel Edge, max-age=0 forces browser to always revalidate
        'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=5, max-age=0`,
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
