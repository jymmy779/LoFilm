import { Movie } from "@/app/types/movie";

/**
 * Filter duplicate movies by root name (removes sequels like SS1, SS2, Phần 1, Phần 2...)
 */
export function filterDuplicateMovies(movies: Movie[]): Movie[] {
    const seen = new Set<string>();
    return movies.filter((movie) => {
        // Normalize name: remove all common sequel/part/season indicators
        const rootName = movie.name
            .replace(/\s*[:\-–—]\s*/g, " ") // Replace separators with space
            .replace(/\s*\(?(Phần|P\.|Part|Section|Vol|Volume|Season|SS|Tập|ss|S|Ep|Episode|Chapter|Ch|Book)\s*(\d+|Cuối|Đặc Biệt|I+|IV|V|VI|VII|VIII|IX|X)\)?.*$/i, "")
            .replace(/\s+\d+\s*$/i, "") // Remove trailing numbers (e.g., Movie Name 2)
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
        // Nếu số tập hiện tại khớp với tổng số tập thì coi như Full
        if (total !== "??" && matchNum[0] === total.match(/\d+/)?.[0]) {
            return "Full";
        }
        return `Tập ${matchNum[0]}`;
    }

    return "Full";
}

/**
 * Check if a movie is considered completed (Full/Hoàn tất)
 */
export function isMovieCompleted(movie: Movie): boolean {
    if (movie.status === 'completed') return true;

    const cur = (movie.episode_current || "").toLowerCase();
    if (cur.includes("full") || cur.includes("hoàn tất")) return true;

    const matchSlash = cur.match(/(\d+)\/(\d+)/);
    if (matchSlash && matchSlash[1] === matchSlash[2]) return true;

    // Check if numeric current >= total
    const curNumMatch = cur.match(/\d+/);
    const totNumMatch = (movie.episode_total || "").match(/\d+/);

    if (curNumMatch && totNumMatch) {
        const curNum = parseInt(curNumMatch[0]);
        const totNum = parseInt(totNumMatch[0]);
        if (curNum >= totNum && totNum > 0) return true;
    }

    return false;
}

export const TRANSPARENT_GIF = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

/**
 * Build full image URL from potentially relative path and wrap with high-performance WebP proxy (wsrv.nl)
 * Supports resizing and optimization.
 */
export function getImageUrl(url: string | undefined, options?: { width?: number; quality?: number; format?: string }): string {
    if (!url) return TRANSPARENT_GIF;

    // 1. Chuẩn hóa URL gốc (Trim trắng tránh lỗi proxy)
    const trimmedUrl = url.trim();
    const fullUrl = trimmedUrl.startsWith("http") ? trimmedUrl : `https://phimimg.com/${trimmedUrl.startsWith('/') ? trimmedUrl.slice(1) : trimmedUrl}`;

    // 2. Sử dụng wsrv.nl làm proxy mặc định (nhanh, miễn phí, hỗ trợ xử lý ảnh tốt hơn)
    // Thêm tham số &n=5 để trình duyệt cache ảnh tối ưu trong 5 ngày, cải thiện tốc độ load đáng kể
    const { width, quality = 80, format = "webp" } = options || {};

    let proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&output=${format}&q=${quality}&af&il&n=5`;

    if (width) {
        proxyUrl += `&w=${width}&we`;
    }

    return proxyUrl;
}

/**
 * Get the raw image URL from the source without any proxy
 */
export function getRawImageUrl(url: string | undefined): string {
    if (!url) return TRANSPARENT_GIF;
    const trimmedUrl = url.trim();
    return trimmedUrl.startsWith("http") ? trimmedUrl : `https://phimimg.com/${trimmedUrl.startsWith('/') ? trimmedUrl.slice(1) : trimmedUrl}`;
}

/**
 * Get friendly episode slug for display and routing
 * Specifically handles 'full' -> 'tap-full' for single movies
 */
export function getFriendlyEpisodeSlug(slug: string): string {
    if (slug === "full") return "tap-full";

    // Nếu slug có dạng 'tap-X' với X là 1 chữ số, đổi thành 'tap-0X'
    // Hoặc nếu slug chỉ là số '1', '2'... (đôi khi API trả về vậy)
    const tapMatch = slug.match(/^tap-(\d)$/i);
    if (tapMatch) return `tap-0${tapMatch[1]}`;

    const numMatch = slug.match(/^(\d)$/);
    if (numMatch) return `tap-0${numMatch[0]}`;

    return slug;
}

/**
 * Loại bỏ dấu tiếng Việt để so sánh chuỗi
 */
export function removeAccents(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

/**
 * Sắp xếp phim theo độ liên quan với từ khóa tìm kiếm (Relevance Ranking)
 * Hỗ trợ tìm kiếm không dấu (accent-insensitive)
 */
export function sortMoviesByRelevance(movies: Movie[], query: string): Movie[] {
    if (!query.trim()) return movies;

    const normalizedQuery = query.trim().toLowerCase();
    const queryNoAccent = removeAccents(normalizedQuery);

    return [...movies].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        const nameNoAccentA = removeAccents(nameA);
        const nameNoAccentB = removeAccents(nameB);

        const originA = (a.origin_name || "").toLowerCase();
        const originB = (b.origin_name || "").toLowerCase();
        const originNoAccentA = removeAccents(originA);
        const originNoAccentB = removeAccents(originB);

        // 1. Khớp hoàn toàn (Có dấu hoặc Không dấu)
        if (nameA === normalizedQuery || nameNoAccentA === queryNoAccent) {
            if (nameB !== normalizedQuery && nameNoAccentB !== queryNoAccent) return -1;
            // Nếu cả 2 đều khớp, ưu tiên cái có dấu giống hệt query
            if (nameA === normalizedQuery && nameB !== normalizedQuery) return -1;
            if (nameB === normalizedQuery && nameA !== normalizedQuery) return 1;
        } else if (nameB === normalizedQuery || nameNoAccentB === queryNoAccent) {
            return 1;
        }

        // 2. Bắt đầu bằng từ khóa (Không dấu)
        const startsA = nameNoAccentA.startsWith(queryNoAccent) ? 1 : 0;
        const startsB = nameNoAccentB.startsWith(queryNoAccent) ? 1 : 0;
        if (startsA !== startsB) return startsB - startsA;

        // 3. Khớp hoàn toàn tên gốc
        if (originA === normalizedQuery || originNoAccentA === queryNoAccent) {
            if (originB !== normalizedQuery && originNoAccentB !== queryNoAccent) return -1;
        } else if (originB === normalizedQuery || originNoAccentB === queryNoAccent) {
            return 1;
        }

        // 4. Chứa từ khóa (Không dấu)
        const containsA = nameNoAccentA.includes(queryNoAccent) ? 1 : 0;
        const containsB = nameNoAccentB.includes(queryNoAccent) ? 1 : 0;
        if (containsA !== containsB) return containsB - containsA;

        return 0;
    });
}

/**
 * Parse episode number from string (e.g. "Tập 01" -> 1)
 */
export function parseEpNumber(name: string): number | string {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0]) : name;
}

/**
 * Convert YouTube URL to embed URL
 */
export function getYoutubeEmbedUrl(url?: string): string {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : '';
}
