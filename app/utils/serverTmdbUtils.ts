import { fetchWithRedis } from "@/app/lib/fetch-with-redis";
import { TMDBActor } from "./tmdbUtils";

const TMDB_KEYS = [
    'fb7bb23f03b6994dafc674c074d01761',
    'e55425032d3d0f371fc776f302e7c09b',
    '8301a21598f8b45668d5711a814f01f6',
    '8cf43ad9c085135b9479ad5cf6bbcbda',
    'da63548086e399ffc910fbc08526df05',
    '13e53ff644a8bd4ba37b3e1044ad24f3',
    '269890f657dddf4635473cf4cf456576',
    'a2f888b27315e62e471b2d587048f32e',
    '8476a7ab80ad76f0936744df0430e67c',
    '5622cafbfe8f8cfe358a29c53e19bba0',
    'ae4bd1b6fce2a5648671bfc171d15ba4',
    '257654f35e3dff105574f97fb4b97035',
    '2f4038e83265214a0dcd6ec2eb3276f5',
    '9e43f45f94705cc8e1d5a0400d19a7b7',
    'af6887753365e14160254ac7f4345dd2',
    '06f10fc8741a672af455421c239a1ffc',
    '09ad8ace66eec34302943272db0e8d2c'
];

const getRandomKey = () => TMDB_KEYS[Math.floor(Math.random() * TMDB_KEYS.length)];
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * Server-side version to fetch actors from TMDB and cache permanently
 * Safe to use in SSR contexts like page.tsx without breaking Client Components.
 */
export async function getServerActorsFromTMDB(tmdbId: string, type: "movie" | "tv" = "movie"): Promise<TMDBActor[]> {
    if (!tmdbId) return [];

    try {
        const endpoint = `${TMDB_BASE_URL}/${type}/${tmdbId}/credits?api_key=${getRandomKey()}&language=vi-VN`;
        
        const response = await fetchWithRedis(endpoint, { revalidate: 2592000 }); // Cache 30 ngày
        
        if (response && response.cast) {
            return response.cast
                .filter((actor: any) => actor.profile_path)
                .map((actor: any) => ({
                    id: actor.id,
                    name: actor.name,
                    profile_path: actor.profile_path,
                    character: actor.character
                }))
                .slice(0, 18);
        }
        return [];
    } catch (error) {
        console.error("Error fetching actors from TMDB server-side:", error);
        return [];
    }
}

async function isLogoBright(path: string): Promise<boolean> {
    try {
        const url = `https://image.tmdb.org/t/p/w92${path}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return true;
        const arrayBuffer = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        const sharp = (await import("sharp")).default;
        const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
        let totalL = 0, count = 0;
        for (let j = 0; j < data.length; j += info.channels) {
            const a = info.channels === 4 ? data[j + 3] : 255;
            if (a > 40) {
                totalL += 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
                count++;
            }
        }
        return count ? (totalL / count) > 80 : true;
    } catch {
        return true;
    }
}

/**
 * Lấy logo trong suốt của phim từ TMDB (Movie ClearLogo)
 * Hỗ trợ: TMDB ID hoặc Tên phim (origin_name / name)
 * Tự động nén WebP qua wsrv.nl và ưu tiên logo trắng/sáng
 */
export async function getServerLogoFromTMDB(
    tmdbIdOrTitle: string | number | null | undefined,
    type: "movie" | "tv" = "movie",
    titleFallback?: string,
    year?: number
): Promise<string | null> {
    let finalId = tmdbIdOrTitle;
    let finalType = type;

    // Nếu không có TMDB ID (hoặc id là text tiêu đề) -> tự động tìm kiếm theo tên phim trên TMDB
    if (!finalId || isNaN(Number(finalId))) {
        const query = titleFallback || (typeof finalId === "string" ? finalId : "");
        if (!query || query.trim().length === 0) return null;

        try {
            const searchEndpoint = `${TMDB_BASE_URL}/search/multi?api_key=${getRandomKey()}&query=${encodeURIComponent(query.trim())}${year ? `&year=${year}` : ""}`;
            const searchRes = await fetchWithRedis(searchEndpoint, { revalidate: 2592000 });
            const firstResult = searchRes?.results?.[0];
            if (firstResult?.id) {
                finalId = firstResult.id;
                finalType = firstResult.media_type === "tv" ? "tv" : "movie";
            } else {
                return null;
            }
        } catch {
            return null;
        }
    }

    try {
        const endpoint = `${TMDB_BASE_URL}/${finalType}/${finalId}/images?api_key=${getRandomKey()}&include_image_language=vi,en,null`;
        const response = await fetchWithRedis(endpoint, { revalidate: 2592000 }); // Cache 30 ngày

        if (response && Array.isArray(response.logos) && response.logos.length > 0) {
            // 1. Phân nhóm ưu tiên: Tiếng Việt (vi) -> Tiếng Anh (en) -> Không xác định (null) -> Toàn bộ
            const viLogos = response.logos.filter((l: any) => l.iso_639_1 === 'vi');
            const enLogos = response.logos.filter((l: any) => l.iso_639_1 === 'en');
            const nullLogos = response.logos.filter((l: any) => !l.iso_639_1);
            
            const targetLogos = viLogos.length > 0 ? viLogos : (enLogos.length > 0 ? enLogos : (nullLogos.length > 0 ? nullLogos : response.logos));

            // 2. Tìm logo sáng / trắng trong nhóm targetLogos:
            let chosen = targetLogos[0];
            if (targetLogos.length > 1) {
                for (const candidate of targetLogos) {
                    const isBright = await isLogoBright(candidate.file_path);
                    if (isBright) {
                        chosen = candidate;
                        break;
                    }
                }
            }

            if (chosen?.file_path) {
                const rawUrl = `https://image.tmdb.org/t/p/w500${chosen.file_path}`;
                // Tự động nén qua wsrv.nl sang WebP chất lượng cao
                return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=600&q=85&output=webp`;
            }
        }
        return null;
    } catch {
        return null;
    }
}
