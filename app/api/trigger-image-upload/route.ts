import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

/**
 * POST /api/trigger-image-upload
 * Admin trigger để sync ảnh lên R2 trong background
 *
 * Body JSON:
 * {
 *   "secret": "your-secret-token",
 *   "mode": "movies-only" | "actors-only" | "all",   // optional, mặc định "all"
 *   "limit": 100,                                      // optional, số phim tối đa
 *   "newOnly": true                                    // optional, chỉ sync phim chưa có
 * }
 */
export async function POST(request: NextRequest) {
    // ─── Auth ──────────────────────────────────────────────────────────────────
    const TRIGGER_SECRET = process.env.TRIGGER_IMAGE_SECRET || process.env.ADMIN_PASSWORD;
    if (!TRIGGER_SECRET) {
        return NextResponse.json({ error: 'Server không có secret key' }, { status: 500 });
    }

    let body: any = {};
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body phải là JSON' }, { status: 400 });
    }

    if (body.secret !== TRIGGER_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ─── Build args ────────────────────────────────────────────────────────────
    const args: string[] = [];

    if (body.mode === 'movies-only') args.push('--movies-only');
    else if (body.mode === 'actors-only') args.push('--actors-only');

    if (body.limit) args.push(`--limit=${body.limit}`);
    if (body.newOnly !== false) args.push('--new-only'); // mặc định new-only để tránh re-sync toàn bộ

    // ─── Spawn background process ──────────────────────────────────────────────
    const scriptPath = path.resolve(process.cwd(), 'scripts/sync-images.mjs');
    const jobId = `sync-${Date.now()}`;

    try {
        const child = spawn('node', [scriptPath, ...args], {
            detached: true,
            stdio: 'ignore', // không block response
            env: { ...process.env },
        });
        child.unref(); // cho phép process cha kết thúc mà không chờ child

        console.log(`[trigger-image-upload] Started job ${jobId} | args: ${args.join(' ')}`);

        return NextResponse.json({
            status: 'started',
            jobId,
            mode: body.mode || 'all',
            newOnly: body.newOnly !== false,
            limit: body.limit || 'unlimited',
            message: 'Sync đã được khởi động trong background. Kiểm tra logs VPS để xem tiến độ.',
        });
    } catch (err: any) {
        console.error('[trigger-image-upload] Failed to spawn:', err.message);
        return NextResponse.json({ error: 'Không thể khởi động sync process', detail: err.message }, { status: 500 });
    }
}

/** GET để kiểm tra endpoint còn sống */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: '/api/trigger-image-upload',
        usage: 'POST với { secret, mode?, limit?, newOnly? }',
    });
}
