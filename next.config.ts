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
            dynamic: 60,  // Router cache cho dynamic pages: 60s (tăng từ 30s)
            static: 300,  // Router cache cho static pages: 5 phút (tăng từ 3 phút)
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
            { protocol: "https", hostname: "image.tmdb.org" },
            { protocol: "https", hostname: "img.ophim.live" },
            { protocol: "https", hostname: "*.ophim.live" },
            { protocol: "https", hostname: "*.ophim1.com" },
            { protocol: "https", hostname: "*.nflxso.net" },
            // Cloudflare R2 – self-hosted images
            { protocol: "https", hostname: "pub-2a7f4f3fc8d74800bc2deccab434bd65.r2.dev" },
        ],
    },
    async headers() {
        return [
            {
                // Security headers cho toàn bộ pages (trừ static assets)
                // no-cache: browser phải revalidate, nhưng không cache được lâu → safe khi deploy mới
                source: '/((?!_next/static|_next/image|favicon.ico).*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
                    // Cho phép Next.js router cache hoạt động (staleTimes config)
                    // Không dùng no-store vì sẽ block Next.js router cache → chuyển trang chậm
                    { key: 'Cache-Control', value: 'no-cache' },
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
