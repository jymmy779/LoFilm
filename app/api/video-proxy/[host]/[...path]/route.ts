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

        // Nếu là file M3U8 → tải về và trả về trực tiếp
        const isM3u8 = contentType.includes("mpegurl") || pathStr.endsWith(".m3u8");
        if (isM3u8) {
            let text = await response.text();
            
            // Viết lại các URL bên trong m3u8 để trỏ qua proxy
            const basePath = pathStr.substring(0, pathStr.lastIndexOf('/') + 1);
            
            const rewriteSingleUrl = (url: string) => {
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    try {
                        const urlObj = new URL(url);
                        const newHost = urlObj.hostname;
                        const newPath = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
                        return `/api/video-proxy/${newHost}/${newPath}${urlObj.search}`;
                    } catch {
                        return url;
                    }
                }
                if (url.startsWith('/')) {
                    return `/api/video-proxy/${host}${url}`;
                }
                return `/api/video-proxy/${host}/${basePath}${url}`;
            };

            const lines = text.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return line;
                
                if (trimmed.startsWith('#')) {
                    if (trimmed.includes('URI="')) {
                        return trimmed.replace(/URI="([^"]+)"/, (match, url) => {
                            return `URI="${rewriteSingleUrl(url)}"`;
                        });
                    }
                    return line;
                }
                
                return rewriteSingleUrl(trimmed);
            });
            text = rewrittenLines.join('\n');

            return new NextResponse(text, {
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
