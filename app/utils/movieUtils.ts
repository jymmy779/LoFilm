import { Movie } from "@/app/types/movie";

const CATEGORY_MAPPING: Record<string, string> = {
    // Lỗi có chữ "phim-" ở đầu (thường do Nguonc/Ophim)
    "phim-hanh-dong": "hanh-dong",
    "phim-tinh-cam": "tinh-cam",
    "phim-hai": "hai-huoc",
    "phim-co-trang": "co-trang",
    "phim-kinh-di": "kinh-di",
    "phim-vien-tuong": "vien-tuong",
    "phim-vo-thuat": "vo-thuat",
    "phim-phieu-luu": "phieu-luu",
    "phim-tai-lieu": "tai-lieu",
    "phim-gia-dinh": "gia-dinh",
    "phim-tam-ly": "tam-ly",
    "phim-the-thao": "the-thao",
    "phim-am-nhac": "am-nhac",
    "phim-chinh-kich": "chinh-kich",
    "phim-bi-an": "bi-an",
    "phim-hoc-duong": "hoc-duong",
    "phim-kinh-dien": "kinh-dien",
    
    // Khác biệt cách gọi
    "hai": "hai-huoc",
    "khoa-hoc": "khoa-hoc-vien-tuong",
    "phim-khoa-hoc": "khoa-hoc-vien-tuong",
    "than-thoai": "than-thoai",
    "phim-than-thoai": "than-thoai",
    "huyen-huyen": "co-trang", // Có thể huyễn huyễn đưa tạm về cổ trang
    "dam-my": "tinh-cam",
    "bach-hop": "tinh-cam",
    "vo-hiep": "vo-thuat",
    
    // Thể loại tiếng Anh (thường do Ophim crawl từ TMDB)
    "action": "hanh-dong",
    "adventure": "phieu-luu",
    "action-adventure": "hanh-dong",
    "animation": "hoat-hinh",
    "comedy": "hai-huoc",
    "crime": "hinh-su",
    "documentary": "tai-lieu",
    "drama": "chinh-kich",
    "family": "gia-dinh",
    "fantasy": "vien-tuong",
    "history": "co-trang",
    "horror": "kinh-di",
    "music": "am-nhac",
    "mystery": "bi-an",
    "romance": "tinh-cam",
    "science-fiction": "khoa-hoc-vien-tuong",
    "sci-fi-fantasy": "khoa-hoc-vien-tuong",
    "thriller": "tam-ly",
    "war": "chien-tranh",
    "western": "vien-tay",
    "reality": "tv-shows", // TV Shows / Truyền hình thực tế
    "kids": "gia-dinh",
    "soap": "tam-ly",
    "talk": "tv-shows",
    "politics": "chinh-kich",
};

/**
 * Generate a consistent slug for categories/genres from various APIs.
 */
export function generateCategorySlug(slug: string | undefined | null, name: string | undefined | null): string {
    const raw = slug || name || "";
    const generatedSlug = raw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
        
    return CATEGORY_MAPPING[generatedSlug] || generatedSlug;
}

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

    // Phim lẻ thực sự: episode_total = 1 HOẶC (episode_total không xác định VÀ current là "Full" chính xác - dành cho Anime Movie trong catalog)
    const isSingleMovie = (movie.episode_total === 1 || String(movie.episode_total) === "1" || (!movie.episode_total && cur === "full")) && cur.includes("full");
    if (isSingleMovie) return "Full";


    const isSeries = movie.type === "series" || movie.type === "hoathinh" || movie.type === "tvshows" || (movie.episode_total && String(movie.episode_total) !== "1");

    // 1. Nếu có định dạng phân số dạng 12/12
    const matchSlash = movie.episode_current?.match(/(\d+)\/(\d+)/);
    if (matchSlash) {
        return `HT (${matchSlash[1]}/${matchSlash[2]})`;
    }

    const totalNumMatch = String(movie.episode_total || "").match(/\d+/);
    const totalNum = totalNumMatch ? totalNumMatch[0] : null;

    // 2. Nếu là phim bộ
    if (isSeries) {
        if (cur.includes("full") || cur.includes("hoàn tất") || movie.status === "completed") {
            if (totalNum) return `HT (${totalNum}/${totalNum})`;
            const matchNum = movie.episode_current?.match(/\d+/);
            if (matchNum) return `HT (${matchNum[0]}/${matchNum[0]})`;
            return "HT";
        }

        const matchNum = movie.episode_current?.match(/\d+/);
        if (matchNum) {
            if (totalNum && matchNum[0] === totalNum) {
                return `HT (${totalNum}/${totalNum})`;
            }
            return `Tập ${matchNum[0]}`;
        }
        return "HT";
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
 * Smart helper to select the best vertical poster URL for a movie object.
 * Handles OPhim/PhimAPI inverted poster/thumb naming conventions.
 */
export function getMoviePosterUrl(movie: Partial<Movie> | undefined): string {
    if (!movie) return TRANSPARENT_GIF;
    const poster = movie.poster_url || "";
    const thumb = movie.thumb_url || "";

    if (poster.includes("poster") && thumb.includes("thumb")) {
        return getImageUrl(thumb || poster);
    }

    return getImageUrl(poster || thumb);
}

export function getMovieRawPosterUrl(movie: Partial<Movie> | undefined): string {
    if (!movie) return TRANSPARENT_GIF;
    const poster = movie.poster_url || "";
    const thumb = movie.thumb_url || "";

    if (poster.includes("poster") && thumb.includes("thumb")) {
        return getRawImageUrl(thumb || poster);
    }

    return getRawImageUrl(poster || thumb);
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
