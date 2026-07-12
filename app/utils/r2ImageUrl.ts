/**
 * R2 Image URL helpers
 *
 * Cấu trúc bucket:
 *   images/movies/{slug}-poster.webp   (400px, dùng cho card)
 *   images/movies/{slug}-thumb.webp    (800px, dùng cho slider/hero)
 *   images/actors/{tmdb_person_id}.webp (200px, dùng cho sidebar)
 */

const R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

/**
 * Poster phim từ R2 (400px WebP)
 */
export function getR2MoviePosterUrl(slug: string): string {
    if (!slug || !R2_URL) return "";
    return `${R2_URL}/images/movies/${slug}-poster.webp`;
}

/**
 * Thumbnail phim từ R2 (800px WebP – dùng cho Hero / Featured Slider)
 */
export function getR2MovieThumbUrl(slug: string): string {
    if (!slug || !R2_URL) return "";
    return `${R2_URL}/images/movies/${slug}-thumb.webp`;
}

/**
 * Ảnh diễn viên từ R2 (200px WebP)
 * @param tmdbPersonId  ID người dùng trên TMDB
 */
export function getR2ActorUrl(tmdbPersonId: number | string): string {
    if (!tmdbPersonId || !R2_URL) return "";
    return `${R2_URL}/images/actors/${tmdbPersonId}.webp`;
}
