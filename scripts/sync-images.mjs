#!/usr/bin/env node
/**
 * sync-images.mjs – Tải ảnh phim & diễn viên về Cloudflare R2 (JPG → WebP)
 *
 * Cách dùng:
 *   node scripts/sync-images.mjs                  # Sync toàn bộ (phim + diễn viên)
 *   node scripts/sync-images.mjs --movies-only     # Chỉ sync ảnh phim
 *   node scripts/sync-images.mjs --actors-only     # Chỉ sync ảnh diễn viên
 *   node scripts/sync-images.mjs --limit=50        # Test với 50 phim đầu
 *   node scripts/sync-images.mjs --page=1          # Chỉ sync trang 1
 *   node scripts/sync-images.mjs --new-only        # Chỉ sync phim chưa có trên R2
 *
 * Cron VPS (3AM mỗi đêm):
 *   0 3 * * * cd /var/www/lofilm && node scripts/sync-images.mjs --new-only >> /var/log/sync-images.log 2>&1
 *
 * Yêu cầu env vars (copy từ .env.local):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *   NEXT_PUBLIC_R2_PUBLIC_URL
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env.local ───────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

try {
    const envContent = readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx < 0) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
    }
} catch {
    console.warn('[ENV] Không tìm thấy .env.local, dùng env hiện tại');
}

// ─── Config ────────────────────────────────────────────────────────────────────
const R2_ACCOUNT_ID      = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID   = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME     = process.env.R2_BUCKET_NAME || 'lofilm';

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error('[ERROR] Thiếu R2 credentials. Kiểm tra .env.local');
    process.exit(1);
}

// ─── Parse CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const moviesOnly = args.includes('--movies-only');
const actorsOnly = args.includes('--actors-only');
const newOnly    = args.includes('--new-only');
const limitArg   = args.find(a => a.startsWith('--limit='));
const pageArg    = args.find(a => a.startsWith('--page='));
const LIMIT      = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;
const SINGLE_PAGE = pageArg ? parseInt(pageArg.split('=')[1]) : null;

// ─── TMDB keys (round-robin để tránh rate limit) ───────────────────────────────
const TMDB_KEYS = [
    'fb7bb23f03b6994dafc674c074d01761',
    'e55425032d3d0f371fc776f302e7c09b',
    '8301a21598f8b45668d5711a814f01f6',
    '8cf43ad9c085135b9479ad5cf6bbcbda',
    'da63548086e399ffc910fbc08526df05',
    '13e53ff644a8bd4ba37b3e1044ad24f3',
    '269890f657dddf4635473cf4cf456576',
    'a2f888b27315e62e471b2d587048f32e',
];
let tmdbKeyIndex = 0;
const getTmdbKey = () => TMDB_KEYS[tmdbKeyIndex++ % TMDB_KEYS.length];

// ─── R2 Client ─────────────────────────────────────────────────────────────────
const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Kiểm tra file đã có trên R2 chưa */
async function existsOnR2(key) {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
        return true;
    } catch {
        return false;
    }
}

/** Download ảnh từ URL, trả về Buffer */
async function downloadImage(url, timeout = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LoFilm-ImageSync/1.0)' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
    } finally {
        clearTimeout(timer);
    }
}

/** Convert buffer → WebP rồi upload lên R2 */
async function convertAndUpload(srcBuffer, r2Key, width, quality = 80) {
    const webpBuffer = await sharp(srcBuffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

    await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        Body: webpBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable', // cache 1 năm
    }));

    return webpBuffer.length;
}

/** Normalize URL ảnh từ phimapi (relative → absolute) */
function normalizeImgUrl(url) {
    if (!url) return null;
    const t = url.trim();
    if (t.startsWith('http')) return t;
    const uploadIdx = t.indexOf('/upload/');
    if (uploadIdx !== -1) return `https://phimimg.com${t.slice(uploadIdx)}`;
    return `https://phimimg.com/${t.replace(/^\//, '')}`;
}

/** Retry wrapper */
async function withRetry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries - 1) throw err;
            await sleep(delay * (i + 1));
        }
    }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Stats ─────────────────────────────────────────────────────────────────────
const stats = {
    movies:  { total: 0, uploaded: 0, skipped: 0, failed: 0 },
    actors:  { total: 0, uploaded: 0, skipped: 0, failed: 0 },
};

// ─── Process 1 phim: poster + thumb ───────────────────────────────────────────
async function processMovieImages(movie, idx, total) {
    const { slug, poster_url, thumb_url } = movie;
    if (!slug) return;

    const posterKey = `images/movies/${slug}-poster.webp`;
    const thumbKey  = `images/movies/${slug}-thumb.webp`;

    let posterDone = false, thumbDone = false;

    // --- POSTER ---
    try {
        if (newOnly && await existsOnR2(posterKey)) {
            posterDone = true;
            stats.movies.skipped++;
        } else {
            const url = normalizeImgUrl(poster_url);
            if (url) {
                await withRetry(async () => {
                    const buf = await downloadImage(url);
                    const size = await convertAndUpload(buf, posterKey, 400, 80);
                    stats.movies.uploaded++;
                    posterDone = true;
                });
            }
        }
    } catch (err) {
        stats.movies.failed++;
        console.error(`  ✗ poster [${slug}]: ${err.message}`);
    }

    // --- THUMB ---
    try {
        if (newOnly && await existsOnR2(thumbKey)) {
            thumbDone = true;
            stats.movies.skipped++;
        } else {
            const url = normalizeImgUrl(thumb_url || poster_url);
            if (url) {
                await withRetry(async () => {
                    const buf = await downloadImage(url);
                    await convertAndUpload(buf, thumbKey, 800, 82);
                    stats.movies.uploaded++;
                    thumbDone = true;
                });
            }
        }
    } catch (err) {
        stats.movies.failed++;
        console.error(`  ✗ thumb  [${slug}]: ${err.message}`);
    }

    const pct = Math.round((idx / total) * 100);
    const pIcon = posterDone ? '✓' : '✗';
    const tIcon = thumbDone  ? '✓' : '✗';
    process.stdout.write(`\r[${idx}/${total}] ${pct}% | poster${pIcon} thumb${tIcon} | ${slug.slice(0, 30).padEnd(30)}`);
}

// ─── Process ảnh diễn viên cho 1 phim ─────────────────────────────────────────
const processedActors = new Set(); // tránh upload cùng 1 người nhiều lần

async function processActorImages(movie) {
    // API list chỉ trả thông tin cơ bản, cần fetch detail để lấy tmdb.id
    let tmdb = movie.tmdb;
    if (!tmdb?.id && movie.slug) {
        try {
            const res = await fetch(`https://phimapi.com/phim/${movie.slug}`, { signal: AbortSignal.timeout(8000) });
            if (res.ok) {
                const data = await res.json();
                tmdb = data?.movie?.tmdb;
            }
        } catch {
            return; // Không lấy được detail → bỏ qua
        }
        await sleep(200); // tránh spam phimapi
    }

    if (!tmdb?.id) return;

    const tmdbType = tmdb.type === 'movie' ? 'movie' : 'tv';
    const apiKey = getTmdbKey();

    let cast = [];
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/${tmdbType}/${tmdb.id}/credits?api_key=${apiKey}&language=vi-VN`,
            { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) return;
        const data = await res.json();
        cast = (data.cast || []).filter(a => a.profile_path).slice(0, 10);
    } catch {
        return; // TMDB timeout / lỗi → bỏ qua
    }

    for (const actor of cast) {
        const actorKey = `images/actors/${actor.id}.webp`;
        if (processedActors.has(actor.id)) continue;
        processedActors.add(actor.id);
        stats.actors.total++;

        try {
            if (newOnly && await existsOnR2(actorKey)) {
                stats.actors.skipped++;
                continue;
            }
            const imgUrl = `https://image.tmdb.org/t/p/w185${actor.profile_path}`;
            await withRetry(async () => {
                const buf = await downloadImage(imgUrl);
                await convertAndUpload(buf, actorKey, 200, 80);
                stats.actors.uploaded++;
            });
        } catch {
            stats.actors.failed++;
        }
    }
}

// ─── Fetch danh sách phim từ phimapi.com ──────────────────────────────────────
async function fetchAllMovies() {
    const allMovies = [];
    let page = SINGLE_PAGE || 1;
    const maxPage = SINGLE_PAGE || 999;

    console.log('[phimapi] Đang fetch danh sách phim...');

    while (page <= maxPage) {
        try {
            const url = `https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=${page}&limit=64`;
            const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
            if (!res.ok) break;
            const data = await res.json();

            const items = data?.items || data?.data?.items || [];
            if (!items.length) break;

            allMovies.push(...items);

            const totalPages = data?.pagination?.totalPages || data?.data?.params?.pagination?.totalPage || 999;
            console.log(`  Trang ${page}/${totalPages}: ${items.length} phim (tổng: ${allMovies.length})`);

            if (page >= totalPages) break;
            if (allMovies.length >= LIMIT) break;

            page++;
            await sleep(300); // tránh spam API
        } catch (err) {
            console.error(`  Lỗi trang ${page}: ${err.message}`);
            break;
        }
    }

    return allMovies.slice(0, LIMIT === Infinity ? undefined : LIMIT);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  LoFilm Image Sync → Cloudflare R2');
    console.log(`  Mode: ${actorsOnly ? 'actors-only' : moviesOnly ? 'movies-only' : 'movies + actors'}`);
    console.log(`  New-only: ${newOnly}`);
    console.log(`  Limit: ${LIMIT === Infinity ? 'unlimited' : LIMIT} phim`);
    console.log('═══════════════════════════════════════════════════════\n');

    const movies = await fetchAllMovies();
    stats.movies.total = movies.length * 2; // poster + thumb

    console.log(`\n[Bắt đầu] ${movies.length} phim\n`);

    // Batch processing: 10 phim song song
    const BATCH_SIZE = 10;
    for (let i = 0; i < movies.length; i += BATCH_SIZE) {
        const batch = movies.slice(i, i + BATCH_SIZE);

        // Sync ảnh phim
        if (!actorsOnly) {
            await Promise.all(
                batch.map((movie, j) => processMovieImages(movie, i + j + 1, movies.length))
            );
        }

        // Sync ảnh diễn viên (sau khi xong phim trong batch, delay để tránh rate limit TMDB)
        if (!moviesOnly) {
            for (const movie of batch) {
                await processActorImages(movie);
                await sleep(250); // ~4 req/s, an toàn với TMDB free
            }
        }

        // Delay giữa các batch
        if (i + BATCH_SIZE < movies.length) {
            await sleep(500);
        }
    }

    // ─── Summary ───────────────────────────────────────────────────────────────
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('  KẾT QUẢ SYNC');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Ảnh phim:`);
    console.log(`    ✓ Uploaded : ${stats.movies.uploaded}`);
    console.log(`    → Skipped  : ${stats.movies.skipped}`);
    console.log(`    ✗ Failed   : ${stats.movies.failed}`);
    console.log(`  Ảnh diễn viên:`);
    console.log(`    ✓ Uploaded : ${stats.actors.uploaded}`);
    console.log(`    → Skipped  : ${stats.actors.skipped}`);
    console.log(`    ✗ Failed   : ${stats.actors.failed}`);
    console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('\n[FATAL]', err);
    process.exit(1);
});
