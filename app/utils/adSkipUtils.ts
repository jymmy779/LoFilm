/**
 * adSkipUtils.ts
 *
 * Utility to parse HLS M3U8 playlists and detect ACTUAL VIDEO ad segments.
 *
 * How it works:
 * This CDN has 2 types of DISCONTINUITY blocks:
 *
 *   1. convertv7/xxx.ts, convertv8/xxx.ts, ...  → Film content with text/watermark overlay.
 *                                                  Still film, just with ad text on top. DO NOT SKIP.
 *
 *   2. /vN/<hash>/segment_000N.ts  → Actual video ad clip (N can be any number: v7, v8, v9...)
 *                                    This is the real ad to skip.
 *
 * We only skip type 2: absolute paths matching /vN/<hex-hash>/segment_NNNN.ts pattern.
 * Version number (vN) is intentionally NOT hardcoded to future-proof against CDN changes.
 */

export interface AdSegment {
    startTime: number; // seconds from video start
    endTime: number;   // seconds from video start
}

/**
 * Returns true ONLY for real video ad segments.
 *
 * Pattern: absolute path like /vN/<hex-hash>/segment_0001.ts
 * - N can be any version number (v7, v8, v9, v10...)
 * - hash is a 32-char hex string (MD5-like)
 * - filename must be segment_NNNN.ts
 * NOT convert... paths which are still film content with text overlay.
 */
function isAdSegmentUrl(url: string): boolean {
    const trimmed = url.trim();

    // Real video ad: absolute path /vN/<hex-hash>/segment_NNNN.ts
    // Version number is NOT hardcoded — works for v7, v8, v9, v10, etc.
    // e.g. /v7/18d007379882ef14b73445b93bf6168d/segment_0001.ts
    if (/^\/v\d+\/[a-f0-9]+\/segment_\d+\.ts$/.test(trimmed)) return true;

    return false;
}

/**
 * Parse an HLS M3U8 playlist string and return a list of ad time intervals.
 *
 * @param m3u8Text - Raw text content of the M3U8 media playlist
 * @returns Array of {startTime, endTime} intervals (in seconds) representing ad segments
 */
export function parseAdSegments(m3u8Text: string): AdSegment[] {
    const lines = m3u8Text.split('\n').map(l => l.trim()).filter(Boolean);

    const adSegments: AdSegment[] = [];

    let currentTime = 0;         // Cumulative time position in the video
    let pendingDuration = 0;     // Duration of next segment (from #EXTINF)
    let afterDiscontinuity = false; // Whether we just passed an EXT-X-DISCONTINUITY tag

    // Track ad block boundaries
    let adBlockStart: number | null = null;
    let inAdBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('#EXT-X-DISCONTINUITY')) {
            afterDiscontinuity = true;
            continue;
        }

        if (line.startsWith('#EXTINF:')) {
            // Parse duration: #EXTINF:4.36,
            const durationMatch = line.match(/#EXTINF:([\d.]+)/);
            pendingDuration = durationMatch ? parseFloat(durationMatch[1]) : 0;
            continue;
        }

        // Skip other M3U8 tags
        if (line.startsWith('#')) {
            continue;
        }

        // This is a segment URL line
        const segmentUrl = line;
        const isAd = isAdSegmentUrl(segmentUrl);

        if (isAd && !inAdBlock) {
            // Starting an ad block
            adBlockStart = currentTime;
            inAdBlock = true;
        } else if (!isAd && inAdBlock) {
            // Ending an ad block
            if (adBlockStart !== null) {
                adSegments.push({
                    startTime: adBlockStart,
                    endTime: currentTime
                });
            }
            adBlockStart = null;
            inAdBlock = false;
        }

        currentTime += pendingDuration;
        pendingDuration = 0;
    }

    // Close any open ad block at end of playlist
    if (inAdBlock && adBlockStart !== null) {
        adSegments.push({
            startTime: adBlockStart,
            endTime: currentTime
        });
    }

    return adSegments;
}

/**
 * Fetch an M3U8 playlist URL and parse its ad segments.
 * Handles both master playlists (redirects to the first media playlist)
 * and media playlists directly.
 *
 * @param m3u8Url - URL of the HLS master or media playlist
 * @returns Array of {startTime, endTime} ad intervals, or empty array on failure
 */
export async function fetchAndParseAdSegments(m3u8Url: string): Promise<AdSegment[]> {
    try {
        const response = await fetch(m3u8Url, {
            headers: { 'Accept': 'application/vnd.apple.mpegurl, */*' }
        });

        if (!response.ok) {
            return [];
        }

        const text = await response.text();

        // Check if this is a master playlist (contains #EXT-X-STREAM-INF)
        if (text.includes('#EXT-X-STREAM-INF')) {
            // Extract first media playlist URL
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            const streamInfIdx = lines.findIndex(l => l.startsWith('#EXT-X-STREAM-INF'));
            const mediaPlaylistRelative = lines[streamInfIdx + 1];

            if (!mediaPlaylistRelative) return [];

            // Resolve relative URL against the master playlist URL
            const base = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
            const mediaPlaylistUrl = mediaPlaylistRelative.startsWith('http')
                ? mediaPlaylistRelative
                : base + mediaPlaylistRelative;

            return fetchAndParseAdSegments(mediaPlaylistUrl);
        }

        // This is a media playlist
        return parseAdSegments(text);
    } catch (err) {
        return [];
    }
}

/**
 * Given a list of ad segments and the current playback time,
 * returns the end time to skip to if currently inside an ad, or null if not.
 *
 * @param adSegments - Parsed ad segment intervals
 * @param currentTime - Current video playback time in seconds
 * @param bufferSeconds - How many seconds before ad start to trigger skip (default: 0.3)
 */
export function getSkipTarget(
    adSegments: AdSegment[],
    currentTime: number,
    bufferSeconds = 1.0,
    isRewinding = false
): number | null {
    for (const ad of adSegments) {
        // Nếu đang tua ngược (rewind), không dùng buffer trước ad (để tránh bị đẩy tới lại khi vừa lùi qua mép)
        const effectiveBuffer = isRewinding ? 0 : bufferSeconds;

        if (currentTime >= ad.startTime - effectiveBuffer && currentTime < ad.endTime) {
            if (isRewinding) {
                // Phải nhảy lùi xa hơn vùng đệm của timeupdate và trừ hao sai số m3u8
                return Math.max(0, ad.startTime - 2.0); 
            }
            // Nếu đang xem/tua tới -> nhảy lố qua quảng cáo 1.0s (vì timestamp HLS m3u8 thường sai số khoảng 0.5-1s)
            return ad.endTime + 1.0;
        }
    }
    return null;
}

export function removeAdsFromM3u8(m3u8Text: string): string {
    const lines = m3u8Text.split('\n');
    const result: string[] = [];
    let currentSegmentTags: string[] = [];
    let droppedAd = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#')) {
            // Các tag đi kèm với từng segment
            if (line.startsWith('#EXTINF') || 
                line.startsWith('#EXT-X-BYTERANGE') || 
                line.startsWith('#EXT-X-PROGRAM-DATE-TIME') ||
                line === '#EXT-X-DISCONTINUITY') {
                currentSegmentTags.push(line);
            } else {
                // Các tag toàn cục (áp dụng cho cả playlist)
                result.push(line);
            }
        } else {
            // Đây là URL của phân mảnh video
            // Match /vN/<hex-hash>/segment_NNNN.ts — version number intentionally not hardcoded
            const isAd = /^\/v\d+\/[a-f0-9]+\/segment_\d+\.ts$/.test(line);
            if (isAd) {
                // ĐÂY LÀ QUẢNG CÁO! Vứt bỏ toàn bộ tag và URL của nó
                currentSegmentTags = [];
                droppedAd = true;
            } else {
                // ĐÂY LÀ PHIM THẬT!
                if (droppedAd) {
                    // Vừa thoát khỏi một đoạn quảng cáo bị xóa.
                    // Cần chèn cờ DISCONTINUITY để báo hiệu cho HLS.js biết thời gian bị nhảy do cắt ghép
                    if (!currentSegmentTags.includes('#EXT-X-DISCONTINUITY')) {
                        currentSegmentTags.unshift('#EXT-X-DISCONTINUITY');
                    }
                }
                droppedAd = false;
                result.push(...currentSegmentTags);
                result.push(line);
                currentSegmentTags = [];
            }
        }
    }
    return result.join('\n');
}
