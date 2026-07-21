import WatchClient from "./WatchClient";
import { Movie } from "@/app/types/movie";
import { AlertTriangle } from "lucide-react";
import { Metadata } from "next";
import { fetchWithRedis } from "@/app/lib/fetch-with-redis";
import { Suspense } from "react";
import WatchLoading from "./loading";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

const API_BASE = "https://phimapi.com";

async function getSuggestedMovies(movie: any): Promise<any[]> {
    try {
        const firstCategory = movie.category?.[0]?.slug;
        if (!firstCategory) return [];

        const data = await fetchWithRedis(`${API_BASE}/v1/api/the-loai/${firstCategory}?page=1&limit=10`, {
            next: { revalidate: 30 },
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
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

import { getMovieDetail } from "@/app/utils/movieFetcher";

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
        const cleanTargetSlug = episodeSlug.replace(/^tap-/, "").toLowerCase();
        const allEpisodes = episodes.flatMap((server: any) => server.server_data);

        const episode = allEpisodes.find((ep: any) => {
            const epSlug = ep.slug.toLowerCase();
            const epCleanSlug = epSlug.replace(/^tap-/, "");
            return (
                epSlug === episodeSlug ||
                epSlug === cleanTargetSlug ||
                epCleanSlug === cleanTargetSlug ||
                (episodeSlug === "tap-full" && epSlug === "full") ||
                ep.name.toLowerCase() === `tập ${cleanTargetSlug}` ||
                ep.name.toLowerCase() === `tập ${cleanTargetSlug.replace(/^0+/, "")}` ||
                ep.name.toLowerCase() === cleanTargetSlug ||
                epCleanSlug.replace(/^0+/, "") === cleanTargetSlug.replace(/^0+/, "")
            );
        });

        if (episode) {
            currentEpisodeName = ` - Tập ${episode.name}`;
        }
    }

    const title = `Xem phim ${movie.name}${currentEpisodeName} Vietsub | LoFilm`;
    const cleanDescription = (movie.content || "").replace(/<[^>]*>/g, '').substring(0, 155);
    const description = cleanDescription
        ? `${cleanDescription}...`
        : `Xem phim ${movie.name} (${movie.origin_name})${currentEpisodeName} vietsub, thuyết minh chất lượng HD tại LoFilm. Miễn phí, không quảng cáo.`;

    const keywords = [
        movie.name,
        movie.origin_name,
        `xem phim ${movie.name}`,
        `${movie.name} vietsub`,
        `${movie.name} thuyet minh`,
        `${movie.name} full hd`,
        `xem ${movie.name} lofilm`,
        ...(movie.category?.map((c: any) => c.name) || []),
        ...(movie.actor?.slice(0, 5) || []),
        "lofilm", "xem phim online mien phi", "phim hay 2026"
    ].filter(Boolean);

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical: `https://www.munos.store/phim/${slug}/${episodeSlug}`,
        },
        openGraph: {
            title,
            description,
            url: `https://www.munos.store/phim/${slug}/${episodeSlug}`,
            siteName: 'LoFilm',
            locale: 'vi_VN',
            type: 'video.movie',
            images: [{
                url: movie.poster_url || movie.thumb_url,
                width: 1200,
                height: 675,
                alt: `${movie.name} - LoFilm`,
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [movie.poster_url || movie.thumb_url],
        },
    };
}

import { cookies } from "next/headers";

export default async function WatchPage({ params, searchParams }: Props) {
    const { slug, episodeSlug } = await params;
    const resolvedParams = await searchParams;
    const preview = resolvedParams.preview;

    return (
        <Suspense fallback={<WatchLoading />}>
            <WatchData slug={slug} episodeSlug={episodeSlug} preview={preview} />
        </Suspense>
    );
}

async function WatchData({
    slug,
    episodeSlug,
    preview,
}: {
    slug: string;
    episodeSlug: string;
    preview: string | string[] | undefined;
}) {
    let isPreview = false;

    if (preview === "true") {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get("lofilm_admin_token")?.value;
        if (adminToken === process.env.ADMIN_PASSWORD) {
            isPreview = true;
        }
    }

    let data: any = null;
    try {
        data = await getMovieDetail(slug, isPreview);
    } catch (error) {
        console.error("Fetch movie error:", error);
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F1115] text-white p-6 relative overflow-hidden">
                {/* Minimal Background Decor - No Blur for Performance */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full pointer-events-none" />

                <div className="max-w-md w-full text-center relative z-10">
                    <div className="bg-[#111e35] border border-white/5 p-10 md:p-14 rounded-[40px]">
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
                            <a
                                href=""
                                className="w-full py-4 bg-amber-500 text-[#0F1115] font-black rounded-2xl hover:bg-amber-400 active:scale-95 transition-all duration-300 text-center"
                            >
                                THỬ TẢI LẠI TRANG
                            </a>
                            <a
                                href="/"
                                className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all duration-300 uppercase tracking-widest text-xs text-center"
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
            <div className="min-h-screen flex items-center justify-center bg-[#0F1115] text-white">
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
            const cleanTargetSlug = episodeSlug.replace(/^tap-/, "").toLowerCase();

            for (let i = 0; i < episodes.length; i++) {
                const server = episodes[i];
                const found = server.server_data.find((ep: any) => {
                    const epSlug = ep.slug.toLowerCase();
                    const epCleanSlug = epSlug.replace(/^tap-/, "");

                    return (
                        epSlug === episodeSlug ||
                        epSlug === cleanTargetSlug ||
                        epCleanSlug === cleanTargetSlug ||
                        (episodeSlug === "tap-full" && epSlug === "full") ||
                        ep.name.toLowerCase() === `tập ${cleanTargetSlug}` ||
                        ep.name.toLowerCase() === `tập ${cleanTargetSlug.replace(/^0+/, "")}` ||
                        ep.name.toLowerCase() === cleanTargetSlug ||
                        // So sánh số nguyên (ví dụ 01 khớp với 1)
                        epCleanSlug.replace(/^0+/, "") === cleanTargetSlug.replace(/^0+/, "")
                    );
                });
                if (found) {
                    currentEpisode = found;
                    serverIndex = i;
                    break;
                }
            }
        }
    }

    // Fallback 2: Nếu hoàn toàn không có tập phim nào từ API, nhưng có trailer_url
    if (!currentEpisode && movie.trailer_url) {
        currentEpisode = {
            name: "Trailer",
            link_m3u8: "",
            link_vtt: "",
            subtitles: []
        };
    }

    if (!movie || !currentEpisode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F1115] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Không tìm thấy phim hoặc tập phim</h1>
                    <a href="/" className="text-amber-400 hover:underline">Về trang chủ</a>
                </div>
            </div>
        );
    }

    // Fetch suggested movies in parallel
    const suggestedMovies = await getSuggestedMovies(movie);

    // VideoObject schema for Google rich results
    const videoJsonLd = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": `${movie.name} - ${currentEpisode.name}`,
        "description": (movie.content || "").replace(/<[^>]*>/g, '').substring(0, 300) ||
            `Xem phim ${movie.name} (${movie.origin_name}) - ${currentEpisode.name} vietsub chất lượng cao tại LoFilm`,
        "thumbnailUrl": movie.poster_url || movie.thumb_url,
        "uploadDate": movie.modified?.time || new Date().toISOString(),
        "contentUrl": `https://www.munos.store/phim/${slug}/${episodeSlug}`,
        "embedUrl": `https://www.munos.store/phim/${slug}/${episodeSlug}`,
        "duration": movie.time ? `PT${movie.time.replace(/[^0-9]/g, '')}M` : undefined,
        "inLanguage": "vi",
        "actor": (movie.actor || []).slice(0, 5).map((name: string) => ({
            "@type": "Person",
            "name": name
        })),
        "director": (movie.director || []).map((name: string) => ({
            "@type": "Person",
            "name": name
        })),
        "genre": movie.category?.map((c: any) => c.name),
        "publisher": {
            "@type": "Organization",
            "name": "LoFilm",
            "url": "https://www.munos.store",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.munos.store/images/lofilm_logo.webp"
            }
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
            />
            <WatchClient
                key={slug}
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
                    actors: movie.actor || [],
                    tmdb: movie.tmdb,
                    trailer_url: movie.trailer_url || '',
                }}
                episode={{
                    name: currentEpisode.name,
                    link_m3u8: currentEpisode.link_m3u8,
                    link_vtt: currentEpisode.link_vtt,
                    subtitles: currentEpisode.subtitles || [],
                }}
                episodes={episodes}
                suggestedMovies={suggestedMovies}
            />
        </>
    );
}