import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter is missing' }, { status: 400 });
  }

  try {
    const response = await axios.get(targetUrl);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Proxy error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: error.response?.status || 500 }
    );
  }
}
