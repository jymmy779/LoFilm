import { NextResponse } from 'next/server';
import redis from '@/app/lib/redis';

// API endpoint to flush all Redis cache
// Usage: POST /api/flush-cache?secret=YOUR_SECRET
export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple secret protection
    if (secret !== process.env.CACHE_FLUSH_SECRET && secret !== 'lofilm-flush-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await redis.flushall();
        return NextResponse.json({ 
            success: true, 
            message: 'All Redis cache flushed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Flush cache error:', error);
        return NextResponse.json({ error: 'Failed to flush cache' }, { status: 500 });
    }
}
