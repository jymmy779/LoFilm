import WatchClient from "./WatchClient";
import { Movie } from "@/app/types/movie";
import { AlertTriangle } from "lucide-react";
import { Metadata } from "next";
import { fetchWithRedis } from "@/app/lib/fetch-with-redis";

export const revalidate = 3600; // Cache 1 tiếng trên toàn hệ thống

const API_BASE = "https://phimapi.com";

async function getSuggestedMovies(movie: any): Promise<any[]> {
    try {
        const firstCategory = movie.category?.[0]?.slug;
        if (!firstCategory) return [];

        const data = await fetchWithRedis(`${API_BASE}/v1/api/the-loai/${firstCategory}?page=1&limit=10`, {
            next: { revalidate: 3600 },
        });
        
        const items = data?.data?.items || [];
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

// Reuse fetch logic for metadata
async function getMovieDetail(slug: string) {
    return await fetchWithRedis(`${API_BASE}/phim/${slug}`, {
        next: { revalidate: 3600 }
    });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, episodeSlug } = await params;
    const data = await getMovieDetail(slug);

    if (!data || !data.movie) {
        return { title: "Xem phim - LoFilm" };
    }

    const { movie, episodes } = data;
    
    // Tìm tập phim hiện tại
    let currentEpisodeName = "";
    if (episodes && episodes.length > 0) {
        // Lấy slug thực tế (tap-full -> full)
        const realEpisodeSlug = episodeSlug === "tap-full" ? "full" : episodeSlug;
        
        const allEpisodes = episodes.flatMap((server: any) => server.server_data);
        const episode = allEpisodes.find((ep: any) => ep.slug === realEpisodeSlug);
        
        if (episode) {
            currentEpisodeName = ` - Tập ${episode.name}`;
        }
    }

    const title = `Xem phim ${movie.name}${currentEpisodeName} | LoFilm`;
    const description = `Xem phim ${movie.name} (${movie.origin_name}) ${currentEpisodeName} chất lượng cao, thuyết minh vietsub cực hay tại LoFilm.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [movie.poster_url],
        },
    };
}

export default async function WatchPage({ params }: Props) {
    const { slug, episodeSlug } = await params;

    let data: any = null;
    try {
        data = await fetchWithRedis(`${API_BASE}/phim/${slug}`, {
            next: { revalidate: 3600 } // Cache 1 tiếng
        });
    } catch (error) {
        console.error("Fetch movie error:", error);
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a1628] text-white p-6 relative overflow-hidden">
                {/* Minimal Background Decor - No Blur for Performance */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full pointer-events-none" />

                <div className="max-w-md w-full text-center relative z-10">
                    <div className="bg-[#111e35] border border-white/5 p-10 md:p-14 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]">
                        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-12 hover:rotate-0 transition-transform duration-500">
                            <AlertTriangle size={48} className="text-amber-500" />
                        </div>
                        
                        <h1 className="text-2xl md:text-3xl font-black mb-4 uppercase tracking-[0.2em] font-montserrat">
                            Mất Kết Nối
                        </h1>
                        
                        <p className="text-white/40 text-sm md:text-base mb-10 leading-relaxed font-medium">
                            Đường truyền đang gặp sự cố hoặc máy chủ phim không phản hồi. Hãy thử tải lại hoặc quay về trang chủ nhé!
                        </p>

                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full py-4 bg-amber-500 text-[#0a1628] font-black rounded-2xl hover:bg-amber-400 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg shadow-amber-500/10"
                            >
                                THỬ LẠI NGAY
                            </button>
                            <a 
                                href="/" 
                                className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all duration-300 uppercase tracking-widest text-xs"
                            >
                                Về trang chủ
                            </a>
                        </div>
                    </div>

                    <p className="mt-8 text-white/20 text-[10px] uppercase tracking-[0.4em] font-bold">LoFilm Lightweight Experience</p>
                </div>
            </div>
        );
    }

    if (!data || !data.movie) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a1628] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 uppercase tracking-wider italic">PHIM KHÔNG TỒN TẠI</h1>
                    <a href="/" className="text-amber-400 hover:underline">Về trang chủ</a>
                </div>
            </div>
        );
    }

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
                    (episodeSlug === "tap-full" && ep.slug === "full") ||
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