import { NextRequest, NextResponse } from 'next/server';
import redis from '@/app/lib/redis';

/**
 * POST /api/flush-cache
 * Xóa toàn bộ Redis cache để buộc tất cả trang fetch lại data mới từ API.
 * Bảo vệ bằng secret key trong env.
 *
 * Body: { secret: string, pattern?: string }
 * - pattern: xóa theo pattern cụ thể (vd: '*phim/ten-phim*')
 *            nếu không có pattern → xóa toàn bộ (FLUSHDB)
 */
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const secret = body.secret || req.headers.get('x-flush-secret');

    // Kiểm tra secret key
    const expectedSecret = process.env.FLUSH_CACHE_SECRET || 'lofilm-flush-2024';
    if (secret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const pattern: string | undefined = body.pattern;

        if (pattern) {
            // Xóa theo pattern cụ thể
            // Upstash Redis hỗ trợ SCAN + DEL
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
            return NextResponse.json({
                success: true,
                message: `Đã xóa ${keys.length} keys khớp pattern: ${pattern}`,
                deleted: keys.length,
            });
        } else {
            // Xóa toàn bộ cache
            await redis.flushdb();
            return NextResponse.json({
                success: true,
                message: 'Đã xóa toàn bộ Redis cache. Data sẽ được fetch mới từ API.',
            });
        }
    } catch (error: any) {
        console.error('[Flush Cache] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Lỗi khi xóa cache' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/flush-cache
 * Xem thống kê Redis hiện tại (không xóa)
 */
export async function GET(req: NextRequest) {
    const secret = req.headers.get('x-flush-secret') || req.nextUrl.searchParams.get('secret');

    const expectedSecret = process.env.FLUSH_CACHE_SECRET || 'lofilm-flush-2024';
    if (secret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const dbSize = await redis.dbsize();
        return NextResponse.json({
            totalKeys: dbSize,
            message: `Redis hiện có ${dbSize} keys đang cache.`,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
