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
 * Build full image URL from potentially relative path
 */
export function getImageUrl(url: string | undefined): string {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://phimimg.com/${url}`;
}
