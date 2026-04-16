import axios from "axios";

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
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w200";

export interface TMDBActor {
    id: number;
    name: string;
    profile_path: string | null;
    character?: string;
}

/**
 * Fetch actors for a movie or TV show using its TMDB ID
 */
export async function fetchActorsFromTMDB(tmdbId: string, type: "movie" | "tv" = "movie"): Promise<TMDBActor[]> {
    if (!tmdbId) return [];

    try {
        const endpoint = `${TMDB_BASE_URL}/${type}/${tmdbId}/credits?api_key=${getRandomKey()}&language=vi-VN`;
        
        // Use proxy to avoid CORS if needed, but client-side call to TMDB is usually fine with public keys
        // However, using the existing proxy is safer
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(endpoint)}&revalidate=86400`;
        const response = await axios.get(proxyUrl);
        
        if (response.data && response.data.cast) {
            return response.data.cast
                .filter((actor: any) => actor.profile_path) // Only keep actors with photos for better UI
                .map((actor: any) => ({
                    id: actor.id,
                    name: actor.name,
                    profile_path: actor.profile_path, // Keep raw path for getImageUrl optimization
                    character: actor.character
                }))
                .slice(0, 18); // Limiting to top 18 actors
        }
        return [];
    } catch (error) {
        console.error("Error fetching actors from TMDB:", error);
        return [];
    }
}

/**
 * Fetch total episodes count from TMDB for a TV show
 */
export async function fetchTotalEpisodesFromTMDB(tmdbId: string): Promise<number | null> {
    if (!tmdbId) return null;

    try {
        const endpoint = `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${getRandomKey()}&language=vi-VN`;
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(endpoint)}&revalidate=86400`;
        const response = await axios.get(proxyUrl);
        
        if (response.data && response.data.number_of_episodes) {
            return response.data.number_of_episodes;
        }
        return null;
    } catch (error) {
        console.error("Error fetching total episodes from TMDB:", error);
        return null;
    }
}
