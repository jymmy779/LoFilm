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

        // Trả về stream trực tiếp không lưu bộ nhớ đệm
        return new NextResponse(response.body, {
            status: response.status,
            headers: {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (error: any) {
        console.error(`[Video Proxy Error] ${targetUrl}:`, error.message || error);
        return new NextResponse("Failed to proxy video resource", { status: 502 });
    }
}
