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
        const total = movie.episode_total != null ? String(movie.episode_total) : "??";
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
    const totNumMatch = String(movie.episode_total ?? "").match(/\d+/);

    if (curNumMatch && totNumMatch) {
        const curNum = parseInt(curNumMatch[0]);
        const totNum = parseInt(totNumMatch[0]);
        if (curNum >= totNum && totNum > 0) return true;
    }

    return false;
}

export const TRANSPARENT_GIF = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

/**
 * Build full image URL from potentially relative path.
 * API kkphim có thể trả về relative path (vd: upload/vod/.../img.jpg)
 * hoặc full URL (https://img.phimapi.com/...) — hàm này normalize về full URL.
 * NOTE: `options` param is accepted for call-site readability but is IGNORED here.
 * Actual resizing/quality optimization is handled by the custom imageLoader (wsrv.nl proxy)
 * which is automatically invoked by Next.js <Image> component.
 */
export function normalizeImageUrl(url: string | undefined): string {
    if (!url) return TRANSPARENT_GIF;

    let trimmed = url.trim();
    if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "N/A" || trimmed === "none") {
        return TRANSPARENT_GIF;
    }

    // 1. Protocol-relative URL: //domain.com/path -> https://domain.com/path
    if (trimmed.startsWith("//")) {
        trimmed = `https:${trimmed}`;
    }

    // 2. Làm sạch các lỗi lặp domain do cào/lưu database
    if (trimmed.includes("https://phimimg.com/https://phimimg.com/")) {
        trimmed = trimmed.replace(/https:\/\/phimimg\.com\/https:\/\/phimimg\.com\//g, "https://phimimg.com/");
    }
    if (trimmed.includes("phimimg.com/public/images/")) {
        trimmed = trimmed.replace("phimimg.com/public/images/", "phim.nguonc.com/public/images/");
    }

    // 3. Thiếu protocol nhưng là domain name (vd: img.phimapi.com/..., occ-0-..., tmdb.org/...)
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+\//.test(trimmed)) {
            trimmed = `https://${trimmed}`;
        }
    }

    // 4. Nếu đã là URL đầy đủ (http:// hoặc https://) -> Giữ nguyên 100% cho mọi nguồn cào (Netflix, TMDB, KKPhim, NguonC, Cloudinary...)
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
    }

    // 5. Xử lý relative path từ các nguồn cào:
    // - Nguồn Ophim (chứa ophim):
    const ophimIndex = trimmed.indexOf("ophim");
    if (ophimIndex !== -1 && !trimmed.includes(".")) {
        return `https://img.ophim.live/${trimmed.slice(ophimIndex)}`;
    }

    // - Nguồn Netflix (chứa dnm/):
    const dnmIndex = trimmed.indexOf("dnm/");
    if (dnmIndex !== -1) {
        return `https://occ-0-8407-116.1.nflxso.net/${trimmed.slice(dnmIndex)}`;
    }

    // - Nguồn TMDB (chứa t/p/):
    const tmdbIndex = trimmed.indexOf("t/p/");
    if (tmdbIndex !== -1) {
        return `https://image.tmdb.org/${trimmed.slice(tmdbIndex)}`;
    }

    // - Nguồn NguonC (chứa public/images/):
    const publicIndex = trimmed.indexOf("public/images/");
    if (publicIndex !== -1) {
        return `https://phim.nguonc.com/${trimmed.slice(publicIndex)}`;
    }

    // - Nguồn KKPhim / PhimAPI (chứa upload/ hoặc uploads/):
    const uploadsIndex = trimmed.indexOf("uploads/");
    if (uploadsIndex !== -1) {
        return `https://phimimg.com/${trimmed.slice(uploadsIndex)}`;
    }
    const uploadIndex = trimmed.indexOf("upload/");
    if (uploadIndex !== -1) {
        return `https://phimimg.com/${trimmed.slice(uploadIndex)}`;
    }

    const cleanPath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    return `https://phimimg.com/${cleanPath}`;
}

export function getImageUrl(url: string | undefined, _options?: { width?: number; quality?: number }): string {
    return normalizeImageUrl(url);
}

/**
 * Get the raw image URL from the source without any proxy
 */
export function getRawImageUrl(url: string | undefined): string {
    return normalizeImageUrl(url);
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
