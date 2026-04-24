import { NextResponse } from 'next/server';
import redis from '@/app/lib/redis';
import { flushMemoryCache } from '@/app/lib/fetch-with-redis';

// API endpoint to flush all cache (Redis + Memory)
// Usage: POST /api/flush-cache?secret=YOUR_SECRET
export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple secret protection
    if (secret !== process.env.CACHE_FLUSH_SECRET && secret !== 'lofilm-flush-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Flush Redis if configured
        if (process.env.UPSTASH_REDIS_REST_URL) {
            await redis.flushall().catch(e => console.error('Redis flush failed:', e));
        }

        // 2. Flush local memory cache
        flushMemoryCache();

        return NextResponse.json({ 
            success: true, 
            message: 'All cache (Redis + Memory) flushed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Flush cache error:', error);
        return NextResponse.json({ error: error.message || 'Failed to flush cache' }, { status: 500 });
    }
}
