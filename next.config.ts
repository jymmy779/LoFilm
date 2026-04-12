import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        scrollRestoration: true,
        optimizePackageImports: ["swiper", "lucide-react", "framer-motion"],
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
                source: '/(.*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
                ],
            },
        ];
    },
};

export default nextConfig;
