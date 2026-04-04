import WatchClient from "./WatchClient";
import { Movie } from "@/app/types/movie";

const API_BASE = "https://phimapi.com";

async function getSuggestedMovies(movie: any): Promise<any[]> {
    try {
        const firstCategory = movie.category?.[0]?.slug;
        if (!firstCategory) return [];

        const res = await fetch(`${API_BASE}/v1/api/the-loai/${firstCategory}?page=1&limit=10`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        const items = data.data?.items || [];
        return items.filter((m: any) => m.slug !== movie.slug).slice(0, 10);
    } catch {
        return [];
    }
}

interface Props {
    params: Promise<{
        slug: string;
        episodeSlug: string;
    }>;
}

export default async function WatchPage({ params }: Props) {
    const { slug, episodeSlug } = await params;

    const res = await fetch(`https://phimapi.com/phim/${slug}`);
    const data = await res.json();

    const movie = data.movie;
    const episodes = data.episodes;

    // Tìm tập phim hiện tại - Tìm trong tất cả các server
    let currentEpisode = null;
    let serverIndex = 0;

    if (episodes && episodes.length > 0) {
        // Trường hợp phim lẻ (Single movie)
        if (movie.type === "single" || movie.episode_total === "1") {
            currentEpisode = episodes[0].server_data[0];
            serverIndex = 0;
        } else {
            // Tìm chính xác tập phim
            for (let i = 0; i < episodes.length; i++) {
                const server = episodes[i];
                const found = server.server_data.find((ep: any) => 
                    ep.slug === episodeSlug || 
                    ep.slug === `tap-${episodeSlug}` ||
                    ep.name.toLowerCase() === `tập ${episodeSlug}` ||
                    ep.name.toLowerCase() === `tập ${episodeSlug.padStart(2, '0')}`
                );
                if (found) {
                    currentEpisode = found;
                    serverIndex = i;
                    break;
                }
            }
        }
    }

    if (!movie || !currentEpisode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a1628] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Không tìm thấy phim hoặc tập phim</h1>
                    <a href="/" className="text-amber-400 hover:underline">Về trang chủ</a>
                </div>
            </div>
        );
    }

    // Fetch suggested movies in parallel
    const suggestedMovies = await getSuggestedMovies(movie);

    return (
        <WatchClient 
            key={episodeSlug}
            slug={slug} 
            episodeSlug={episodeSlug} 
            movie={{
                name: movie.name,
                origin_name: movie.origin_name,
                thumb_url: movie.thumb_url,
                poster_url: movie.poster_url,
                content: movie.content,
                quality: movie.quality,
                episode_current: movie.episode_current,
                actors: movie.actor,
            }}
            episode={{
                name: currentEpisode.name,
                link_m3u8: currentEpisode.link_m3u8,
            }}
            episodes={episodes}
            suggestedMovies={suggestedMovies}
        />
    );
}