import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: [
        "swiper",
        "lucide-react",
        "plyr-react",
        "plyr",
        "react-icons",
        "axios",
        "react-loading-skeleton",
        "zod",
        "@supabase/supabase-js",
        "@supabase/ssr",
        "hls.js",
        "nprogress"
    ],
    experimental: {
        scrollRestoration: true,
        optimizePackageImports: ["swiper", "lucide-react"],
        // Disable Next.js Router Cache: ensures every navigation fetches fresh server data
        // Without this, clicking a link shows stale cached data until hard refresh
        staleTimes: {
            dynamic: 30, // Hạn chế gọi server khi điều hướng qua lại giữa các trang trong 30s
            static: 180, // Tăng thời gian cache cho trang tĩnh
        },
    },
    images: {
        loader: 'custom',
        loaderFile: './app/utils/imageLoader.ts',
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            { protocol: "https", hostname: "phimimg.com" },
            { protocol: "https", hostname: "phimapi.com" },
            { protocol: "https", hostname: "img.phimapi.com" },
            { protocol: "https", hostname: "images.unsplash.com" },
        ],
    },
    async headers() {
        return [
            {
                // Bảo browser không cache HTML — tránh lỗi giao diện sau khi deploy mới
                // Static assets (/_next/static/) vẫn cache tốt vì đã có content hash trong tên file
                source: '/((?!_next/static|_next/image|favicon.ico).*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                ],
            },
            {
                // Movie detail, watch, and catalog pages: force CDN to revalidate frequently
                source: '/phim/:path*',
                headers: [
                    { key: 'CDN-Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=10' },
                    { key: 'Cloudflare-CDN-Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=10' },
                ],
            },
            {
                // Homepage and list pages: also keep fresh
                source: '/',
                headers: [
                    { key: 'CDN-Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=10' },
                    { key: 'Cloudflare-CDN-Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=10' },
                ],
            },
            {
                source: '/danh-sach/:path*',
                headers: [
                    { key: 'CDN-Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=10' },
                    { key: 'Cloudflare-CDN-Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=10' },
                ],
            },
            {
                source: '/the-loai/:path*',
                headers: [
                    { key: 'CDN-Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=10' },
                    { key: 'Cloudflare-CDN-Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=10' },
                ],
            },
            {
                source: '/quoc-gia/:path*',
                headers: [
                    { key: 'CDN-Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=10' },
                    { key: 'Cloudflare-CDN-Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=10' },
                ],
            },
        ];
    },
};

export default nextConfig;
