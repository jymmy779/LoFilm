import { Movie } from "@/app/types/movie";

/**
 * Filter duplicate movies by root name (removes sequels like SS1, SS2, Phần 1, Phần 2...)
 */
export function filterDuplicateMovies(movies: Movie[]): Movie[] {
    const seen = new Set<string>();
    return movies.filter((movie) => {
        const rootName = movie.name
            .replace(/\s*\(?(Phần|P\.|Season|SS|Tập|ss)\s*(\d+|Cuối|Đặc Biệt)\)?.*$/i, "")
            .trim()
            .toLowerCase();

        if (seen.has(rootName)) return false;
        seen.add(rootName);
        return true;
    });
}

/**
 * Giống logic MoviePosterRow: lọc trùng → sort theo năm / modified → tối đa 20 phim
 */
export function sortAndSlicePosterRowMovies(items: Movie[]): Movie[] {
    const filtered = filterDuplicateMovies(items);
    return [...filtered].sort((a, b) => {
        if ((b.year || 0) !== (a.year || 0)) {
            return (b.year || 0) - (a.year || 0);
        }
        const timeA = a.modified?.time ? new Date(a.modified.time).getTime() : 0;
        const timeB = b.modified?.time ? new Date(b.modified.time).getTime() : 0;
        return timeB - timeA;
    }).slice(0, 20);
}

/**
 * Parse episode_current into display-friendly status text
 */
export function getEpisodeStatus(movie: Movie): string {
    const cur = (movie.episode_current || "").toLowerCase();
    if (cur.includes("trailer")) return "Trailer";

    const matchSlash = movie.episode_current?.match(/(\d+)\/(\d+)/);
    if (matchSlash) return `HT (${matchSlash[1]}/${matchSlash[2]})`;

    if (cur.includes("full") || cur.includes("hoàn tất")) return "Full";

    const matchNum = movie.episode_current?.match(/\d+/);
    if (matchNum) {
        const total = movie.episode_total || "??";
        return `HT (${matchNum[0]}/${total})`;
    }

    return "Full";
}

/**
 * Build full image URL from potentially relative path and wrap with high-performance WebP proxy (wsrv.nl)
 * Supports resizing and optimization.
 */
export function getImageUrl(url: string | undefined, options?: { width?: number; quality?: number; format?: string }): string {
    if (!url) return "";
    
    // 1. Chuẩn hóa URL gốc (Trim trắng tránh lỗi proxy)
    const trimmedUrl = url.trim();
    const fullUrl = trimmedUrl.startsWith("http") ? trimmedUrl : `https://phimimg.com/${trimmedUrl.startsWith('/') ? trimmedUrl.slice(1) : trimmedUrl}`;
    
    // 2. Sử dụng wsrv.nl làm proxy mặc định (nhanh, miễn phí, hỗ trợ xử lý ảnh tốt hơn)
    const { width, quality = 80, format = "webp" } = options || {};
    
    let proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&output=${format}&q=${quality}&af`;
    
    if (width) {
        proxyUrl += `&w=${width}&we`;
    }
    
    return proxyUrl;
}

/**
 * Get friendly episode slug for display and routing
 * Specifically handles 'full' -> 'tap-full' for single movies
 */
export function getFriendlyEpisodeSlug(slug: string): string {
    if (slug === "full") return "tap-full";
    return slug;
}
