import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter is missing' }, { status: 400 });
  }

  try {
    // Sử dụng fetch thay vì axios để tận dụng cache hệ thống của Next.js
    const response = await fetch(targetUrl, {
      next: { revalidate: 3600 } // Tự động cache kết quả trong 1 giờ
    });
    
    if (!response.ok) {
        throw new Error(`PhimAPI returned ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        // s-maxage=3600: Lưu tại CDN Vercel trong 1 tiếng
        // stale-while-revalidate: Trả về bản cũ ngay lập tức nếu bản mới đang được fetch
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59, max-age=60',
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
