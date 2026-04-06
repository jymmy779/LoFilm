import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        scrollRestoration: true,
        optimizePackageImports: ["swiper", "lucide-react", "framer-motion"],
    },
    images: {
        unoptimized: true,
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            { protocol: "https", hostname: "phimimg.com" },
            { protocol: "https", hostname: "phimapi.com" },
            { protocol: "https", hostname: "img.phimapi.com" },
            { protocol: "https", hostname: "images.unsplash.com" },
        ],
    },
};

export default nextConfig;
