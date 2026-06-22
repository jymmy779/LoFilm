import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ host: string; path: string[] }> }
) {
    const { host, path } = await props.params;
    const pathStr = path.join("/");
    const search = request.nextUrl.search;
    
    // Tạo URL đích đến server nguồn
    const targetUrl = `https://${host}/${pathStr}${search}`;

    try {
        // Gọi đến server nguồn với headers giả lập referer/origin hợp lệ
        const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": `https://${host}/`,
                "Origin": `https://${host}`,
            },
            // Tránh cache đè của Next.js để luôn lấy dữ liệu mới nhất nếu cần
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(`[Video Proxy] Remote server returned status ${response.status} for ${targetUrl}`);
        }

        // Đọc content-type gốc để truyền về trình duyệt chính xác
        const contentType = response.headers.get("content-type") || "application/octet-stream";

        // Nếu là file M3U8 → xóa quảng cáo ngay tại server trước khi trả về client
        const isM3u8 = contentType.includes("mpegurl") || pathStr.endsWith(".m3u8");
        if (isM3u8) {
            const text = await response.text();
            const cleaned = removeAdsFromM3u8(text);
            return new NextResponse(cleaned, {
                status: response.status,
                headers: {
                    "Content-Type": contentType,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Cache-Control": "public, max-age=3600",
                },
            });
        }

        // Còn lại (.ts, v.v.) → tải về buffer để tránh lỗi ERR_INCOMPLETE_CHUNKED_ENCODING khi stream
        const buffer = await response.arrayBuffer();
        const headers: Record<string, string> = {
            "Content-Type": contentType,
            "Content-Length": buffer.byteLength.toString(),
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Cache-Control": "public, max-age=3600",
        };

        return new NextResponse(buffer, {
            status: response.status,
            headers,
        });
    } catch (error: any) {
        console.error(`[Video Proxy Error] ${targetUrl}:`, error.message || error);
        return new NextResponse("Failed to proxy video resource", { status: 502 });
    }
}

/**
 * Xóa toàn bộ segment quảng cáo khỏi M3U8 playlist.
 *
 * Ads được nhận diện bằng pattern: /vN/<hex-hash>/segment_NNNN.ts
 * (N = số version bất kỳ — không hardcode để future-proof)
 *
 * Khi một khối ads bị xóa, chèn #EXT-X-DISCONTINUITY để HLS.js
 * biết rằng timeline đã bị nhảy và không bị lỗi decode.
 */
function removeAdsFromM3u8(m3u8Text: string): string {
    const lines = m3u8Text.split("\n");
    const result: string[] = [];
    let pendingSegmentTags: string[] = [];
    let justRemovedAd = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line.startsWith("#")) {
            // Tags gắn liền với segment tiếp theo: giữ lại tạm, quyết định sau
            if (
                line.startsWith("#EXTINF") ||
                line.startsWith("#EXT-X-BYTERANGE") ||
                line.startsWith("#EXT-X-PROGRAM-DATE-TIME") ||
                line === "#EXT-X-DISCONTINUITY"
            ) {
                pendingSegmentTags.push(line);
            } else {
                // Tag toàn cục (VERSION, TARGETDURATION, KEY, ENDLIST...) → giữ lại luôn
                result.push(line);
            }
        } else {
            // Đây là URL segment
            // Có thể là định dạng /vN/hash/segment_N.ts hoặc chứa /adjump/
            // Thêm heuristic: quảng cáo thường có đường dẫn dài chứa nhiều dấu '/' (>= 2)
            // Trong khi phim thật thường là tên file trực tiếp hoặc path ngắn (0-1 dấu '/')
            const slashCount = (line.match(/\//g) || []).length;
            const isAd = 
                /^\/v\d+\/[a-f0-9]+\/segment_\d+\.ts$/.test(line) || 
                line.includes('/adjump/') || 
                slashCount >= 3;

            if (isAd) {
                // Quảng cáo → vứt bỏ toàn bộ tags + URL đi kèm
                pendingSegmentTags = [];
                justRemovedAd = true;
            } else {
                // Phim thật → giữ lại
                if (justRemovedAd) {
                    // Vừa thoát khỏi block ads → đảm bảo có DISCONTINUITY để HLS.js xử lý đúng
                    if (!pendingSegmentTags.includes("#EXT-X-DISCONTINUITY")) {
                        pendingSegmentTags.unshift("#EXT-X-DISCONTINUITY");
                    }
                }
                justRemovedAd = false;
                result.push(...pendingSegmentTags, line);
                pendingSegmentTags = [];
            }
        }
    }

    return result.join("\n");
}
