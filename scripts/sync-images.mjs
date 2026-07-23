#!/usr/bin/env node
/**
 * sync-images.mjs – Tải ảnh phim & diễn viên về Cloudflare R2 (JPG → WebP)
 *
 * Cách dùng:
 *   node scripts/sync-images.mjs                             # Sync toàn bộ (phim + diễn viên)
 *   node scripts/sync-images.mjs --movies-only                # Chỉ sync ảnh phim
 *   node scripts/sync-images.mjs --actors-only                # Chỉ sync ảnh diễn viên
 *   node scripts/sync-images.mjs --new-only                   # Chỉ sync phim chưa có trên R2 (>1KB)
 *   node scripts/sync-images.mjs --start-page=1 --max-pages=15 # Quét theo khoảng trang chỉ định
 *   node scripts/sync-images.mjs --resume                     # Khôi phục chạy tiếp từ trang dừng trước đó
 *   node scripts/sync-images.mjs --retry-failed               # Sửa 100% các ảnh bị lỗi từ lần chạy trước
 *
 * Yêu cầu env vars (copy từ .env.local):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *   NEXT_PUBLIC_R2_PUBLIC_URL
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
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
const moviesOnly   = args.includes('--movies-only');
const actorsOnly   = args.includes('--actors-only');
const newOnly      = args.includes('--new-only');
const retryFailed  = args.includes('--retry-failed');
const resumeMode   = args.includes('--resume');

const limitArg     = args.find(a => a.startsWith('--limit='));
const pageArg      = args.find(a => a.startsWith('--page='));
const maxPagesArg  = args.find(a => a.startsWith('--max-pages='));
const startPageArg = args.find(a => a.startsWith('--start-page='));

// File Checkpoint & Failed Logs
const STATE_FILE  = resolve(__dirname, 'sync-state.json');
const FAILED_FILE = resolve(__dirname, 'failed-images.json');

// Đọc checkpoint cũ nếu có cờ --resume
let savedState = { lastPage: 1 };
if (resumeMode && existsSync(STATE_FILE)) {
    try {
        savedState = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
        console.log(`[Checkpoint] Khôi phục từ trang gần nhất: Page ${savedState.lastPage}`);
    } catch {}
}

const LIMIT            = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;
const SINGLE_PAGE      = pageArg ? parseInt(pageArg.split('=')[1]) : null;
const START_PAGE       = startPageArg ? parseInt(startPageArg.split('=')[1]) : (resumeMode ? savedState.lastPage : (SINGLE_PAGE || 1));
const MAX_PAGES_LIMIT  = maxPagesArg ? parseInt(maxPagesArg.split('=')[1]) : (SINGLE_PAGE ? SINGLE_PAGE : 9999);

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
        const res = await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
        // Đảm bảo file tồn tại VÀ kích thước > 1KB (nếu 0-byte hoặc bị lỗi sẽ tự động tải lại)
        return (res.ContentLength || 0) > 1024;
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
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
        });
        if (!res.ok) {
            if (res.status === 429) {
                await sleep(3000);
            }
            throw new Error(`HTTP ${res.status}`);
        }
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

/** Normalize URL ảnh từ phimapi / nguonc / ophim / netflix / tmdb (relative → absolute) */
function normalizeImgUrl(url) {
    if (!url) return null;
    let t = url.trim();
    if (!t || t === "null" || t === "undefined" || t === "N/A" || t === "none") return null;

    if (t.startsWith("//")) {
        t = `https:${t}`;
    }

    if (t.includes("phimimg.com/https://phimimg.com/")) {
        t = t.replace(/https:\/\/phimimg\.com\/https:\/\/phimimg\.com\//g, "https://phimimg.com/");
    }
    if (t.includes("phimimg.com/public/images/")) {
        t = t.replace("phimimg.com/public/images/", "phim.nguonc.com/public/images/");
    }

    if (!t.startsWith("http://") && !t.startsWith("https://")) {
        if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+\//.test(t)) {
            t = `https://${t}`;
        }
    }

    if (t.startsWith("http://") || t.startsWith("https://")) {
        return t;
    }

    const ophimIdx = t.indexOf("ophim");
    if (ophimIdx !== -1 && !t.includes(".")) {
        return `https://img.ophim.live/${t.slice(ophimIdx)}`;
    }

    const dnmIdx = t.indexOf("dnm/");
    if (dnmIdx !== -1) {
        return `https://occ-0-8407-116.1.nflxso.net/${t.slice(dnmIdx)}`;
    }

    const tmdbIdx = t.indexOf("t/p/");
    if (tmdbIdx !== -1) {
        return `https://image.tmdb.org/${t.slice(tmdbIdx)}`;
    }

    const publicIdx = t.indexOf("public/images/");
    if (publicIdx !== -1) {
        return `https://phim.nguonc.com/${t.slice(publicIdx)}`;
    }

    const uploadsIdx = t.indexOf("uploads/");
    if (uploadsIdx !== -1) {
        return `https://phimimg.com/${t.slice(uploadsIdx)}`;
    }

    const uploadIdx = t.indexOf("upload/");
    if (uploadIdx !== -1) {
        return `https://phimimg.com/${t.slice(uploadIdx)}`;
    }

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

// ─── Stats & Log List ─────────────────────────────────────────────────────────
const stats = {
    movies:  { total: 0, uploaded: 0, skipped: 0, failed: 0 },
    actors:  { total: 0, uploaded: 0, skipped: 0, failed: 0 },
};

const failedItems = [];

function saveFailedLog(item) {
    failedItems.push(item);
    try {
        writeFileSync(FAILED_FILE, JSON.stringify(failedItems, null, 2));
    } catch {}
}

function saveCheckpoint(page) {
    try {
        writeFileSync(STATE_FILE, JSON.stringify({ lastPage: page, updatedAt: new Date().toISOString() }, null, 2));
    } catch {}
}

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
        saveFailedLog({ type: 'poster', slug, url: poster_url, key: posterKey, error: err.message });
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
        saveFailedLog({ type: 'thumb', slug, url: thumb_url || poster_url, key: thumbKey, error: err.message });
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
        cast = (data.cast || []).filter(a => a.profile_path);
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
        } catch (err) {
            stats.actors.failed++;
            const imgUrl = `https://image.tmdb.org/t/p/w185${actor.profile_path}`;
            saveFailedLog({ type: 'actor', actorId: actor.id, url: imgUrl, key: actorKey, error: err.message });
        }
    }
}

// ─── Fetch danh sách phim từ phimapi.com ──────────────────────────────────────
async function fetchAllMovies() {
    const allMovies = [];
    let page = START_PAGE;
    const maxPage = MAX_PAGES_LIMIT;

    console.log('[phimapi] Đang fetch danh sách phim...');

    while (page <= maxPage) {
        try {
            const url = `https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=${page}&limit=64`;
            const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
            if (!res.ok) {
                if (res.status === 429) {
                    console.warn(`  ⚠️ Dính Rate Limit (429) tại trang ${page}, tạm dừng 5s rồi thử lại...`);
                    await sleep(5000);
                    continue; // Thử lại cùng trang này
                }
                console.error(`  ⚠️ Lỗi HTTP ${res.status} tại trang ${page}, bỏ qua trang này...`);
                page++;
                await sleep(1000);
                continue;
            }
            const data = await res.json();

            const items = data?.items || data?.data?.items || [];
            if (!items.length) break;

            allMovies.push(...items);
            saveCheckpoint(page);

            const totalPages = data?.pagination?.totalPages || data?.data?.params?.pagination?.totalPage || 999;
            console.log(`  Trang ${page}/${totalPages}: ${items.length} phim (tổng: ${allMovies.length})`);

            if (page >= totalPages || page >= maxPage) break;
            if (allMovies.length >= LIMIT) break;

            page++;
            await sleep(300); // tránh spam API
        } catch (err) {
            console.error(`  Lỗi trang ${page}: ${err.message}. Sẽ bỏ qua trang này và tiếp tục...`);
            page++;
            await sleep(1000);
            continue;
        }
    }

    return allMovies.slice(0, LIMIT === Infinity ? undefined : LIMIT);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  LoFilm Image Sync → Cloudflare R2');
    console.log(`  Mode: ${retryFailed ? 'RETRY FAILED LOGS' : actorsOnly ? 'actors-only' : moviesOnly ? 'movies-only' : 'movies + actors'}`);
    console.log(`  New-only: ${newOnly}`);
    console.log(`  Resume: ${resumeMode}`);
    console.log(`  Limit: ${LIMIT === Infinity ? 'unlimited' : LIMIT} phim`);
    console.log('═══════════════════════════════════════════════════════\n');

    // KỊCH BẢN CHỈ SYNC LẠI CÁC ẢNH BỊ LỖI
    if (retryFailed) {
        if (!existsSync(FAILED_FILE)) {
            console.log('🎉 Không tìm thấy file failed-images.json (Không có ảnh nào bị lỗi trước đó)!');
            return;
        }
        try {
            const list = JSON.parse(readFileSync(FAILED_FILE, 'utf8'));
            if (!list.length) {
                console.log('🎉 Danh sách ảnh lỗi trống (100% ảnh đã sync thành công)!');
                return;
            }
            console.log(`[Retry Failed] Đang thử tải lại ${list.length} ảnh bị lỗi...`);
            const remainingFailed = [];
            let fixedCount = 0;

            for (const item of list) {
                try {
                    const url = normalizeImgUrl(item.url);
                    if (url) {
                        const buf = await downloadImage(url);
                        await convertAndUpload(buf, item.key, item.type === 'poster' ? 400 : 800, 80);
                        fixedCount++;
                        console.log(`  ✓ Đã sửa thành công ảnh lỗi [${item.type}]: ${item.slug || item.key}`);
                    }
                } catch (err) {
                    console.error(`  ✗ Vẫn lỗi [${item.key}]: ${err.message}`);
                    remainingFailed.push(item);
                }
                await sleep(300);
            }
            writeFileSync(FAILED_FILE, JSON.stringify(remainingFailed, null, 2));
            console.log(`\n[Hoàn tất Retry] Đã sửa được: ${fixedCount}/${list.length} ảnh. Còn lại: ${remainingFailed.length} lỗi.`);
            return;
        } catch (err) {
            console.error('Lỗi khi đọc file failed-images.json:', err.message);
            return;
        }
    }

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
            if (actorsOnly) {
                const currentCount = Math.min(i + BATCH_SIZE, movies.length);
                const pct = Math.round((currentCount / movies.length) * 100);
                console.log(`[Actors] Đã xử lý ${currentCount}/${movies.length} phim (${pct}%) | Upload mới: ${stats.actors.uploaded} | Đã có trên R2: ${stats.actors.skipped}`);
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
