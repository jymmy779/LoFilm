import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { useFavorites } from "@/app/(pages)/phim/[slug]/[episodeSlug]/hooks/useFavorites";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { getCategoryColors } from "@/app/utils/uiUtils";
import { getEpisodeStatus, getImageUrl, getFriendlyEpisodeSlug, getRawImageUrl } from "@/app/utils/movieUtils";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import { getR2MovieThumbUrl, getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";

export interface MoviePreviewPopupProps {
    movie: Movie;
    user?: any;
    cardRect: DOMRect;
    isFirst?: boolean;
    isLast?: boolean;
    isClosing?: boolean;
    adZone?: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export default function MoviePreviewPopup({
    movie,
    user,
    cardRect,
    isFirst = false,
    isLast = false,
    isClosing = false,
    adZone,
    onMouseEnter,
    onMouseLeave
}: MoviePreviewPopupProps) {


    // Default fallback logic before fetching exact slug
    const isMultiEp =
        ["series", "hoathinh", "tvshows"].includes(movie.type || "") ||
        (movie.episode_current && (
            movie.episode_current.toLowerCase().includes("tập") ||
            movie.episode_current.includes("/")
        )) ||
        (movie.episode_total && parseInt(String(movie.episode_total)) > 1);

    const fetcher = (url: string) => fetch(url).then(res => res.json());
    const { data: swrData, isLoading: isLoadingPlayUrl } = useSWR(
        `/api/proxy?url=${encodeURIComponent(`https://phimapi.com/phim/${movie.slug}`)}&revalidate=60`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 60000,
        }
    );

    const updatedMetadata = swrData?.movie ? {
        episode_current: swrData.movie.episode_current,
        episode_total: swrData.movie.episode_total
    } : null;

    const firstEpSlug = swrData?.episodes?.[0]?.server_data?.[0]?.slug;
    const playUrl = firstEpSlug 
        ? `/phim/${movie.slug}/${getFriendlyEpisodeSlug(firstEpSlug)}` 
        : `/phim/${movie.slug}/${isMultiEp ? 'tap-01' : 'tap-full'}`;

    const detailUrl = `/phim/${movie.slug}`;

    const { isFavorited, toggleFavorite } = useFavorites(
        movie.slug,
        movie.name,
        movie.poster_url,
        movie.thumb_url
    );

    const voteAvg = swrData?.movie?.tmdb?.vote_average || movie.tmdb?.vote_average;
    const imdbRating = voteAvg ? Number(voteAvg).toFixed(1) : "N/A";

    const [position] = useState(() => {
        let top = 0;
        let left = 0;
        if (typeof window !== 'undefined') {
            const popupWidth = 420;
            top = cardRect.top + window.scrollY - 10; // Nhích lên 10px để cân đối hơn
            const idealLeft = cardRect.left + window.scrollX + (cardRect.width / 2) - (popupWidth / 2);
            const minLeft = window.scrollX + 24;
            const maxLeft = window.scrollX + document.documentElement.clientWidth - popupWidth - 24;
            left = Math.max(minLeft, Math.min(idealLeft, maxLeft));
        }
        return { top, left };
    });

    const [isThumbLoaded, setIsThumbLoaded] = useState(false);
    const thumbUrl = movie.thumb_url ? getImageUrl(movie.thumb_url, { width: 380, quality: 75 }) : null;
    const posterUrl = movie.poster_url ? getImageUrl(movie.poster_url, { width: 100, quality: 40 }) : null;

    return (
        <div
            className={`absolute z-[9999] w-[420px] pointer-events-auto hidden xl:block select-none transform-gpu origin-center ${isClosing ? 'animate-pop-out' : 'animate-pop-in'}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                top: position.top,
                left: position.left
            }}
        >
            <div className="bg-[#12151C]/98 rounded-2xl overflow-hidden border border-white/5">
                {/* Image Container with CSS Masking & Angled Gradient matching Rophim */}
                <div className="relative aspect-video w-full bg-[#12151C] overflow-hidden [mask-image:linear-gradient(to_top,transparent_0,black_30px)] [-webkit-mask-image:linear-gradient(to_top,transparent_0,black_30px)]">
                    {/* Layer 1: Blurred Poster Placeholder (Instant) */}
                    {posterUrl && (
                        <Image
                            src={posterUrl}
                            alt=""
                            fill
                            className="object-cover blur-md opacity-50 scale-110"
                            sizes="100px"
                            priority
                            unoptimized={posterUrl.startsWith('data:')}
                        />
                    )}

                    {/* Layer 2: Main Thumbnail (Fade-in) */}
                    {(thumbUrl || posterUrl) && (
                        <SmartImage
                            r2Src={movie.thumb_url ? getR2MovieThumbUrl(movie.slug) : getR2MoviePosterUrl(movie.slug)}
                            src={thumbUrl || (movie.poster_url ? getImageUrl(movie.poster_url, { width: 380, quality: 75 }) : "")}
                            rawSrc={movie.thumb_url ? getRawImageUrl(movie.thumb_url) : getRawImageUrl(movie.poster_url)}
                            fallbackSrc={movie.poster_url ? getRawImageUrl(movie.poster_url) : undefined}
                            alt={movie.name}
                            fill
                            priority
                            sizes="420px"
                            onLoad={() => setIsThumbLoaded(true)}
                            className={`object-cover transition-opacity duration-300 ease-in-out ${isThumbLoaded ? 'opacity-100' : 'opacity-0'}`}
                        />
                    )}

                    {/* Overlay chéo (Angled Gradient) 20 độ theo màu của LoFilm (#0F1115) */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(20deg,rgba(17,19,25,0.6)_0%,rgba(17,19,25,0)_100%)]" />
                </div>

                <div className="px-5 pb-5 pt-2 -mt-2 relative z-10 space-y-3">
                    {/* Title Group */}
                    <div className="space-y-1">
                        <h3 className="text-white font-bold text-base leading-tight line-clamp-2">
                            {decodeHtml(movie.name)}
                        </h3>
                        <p className="text-[#D497FF] text-xs font-medium line-clamp-1">
                            {decodeHtml(movie.origin_name)}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <TransitionLink
                            href={playUrl}
                            className="flex-[1.5] h-10 bg-[#D497FF] hover:opacity-90 text-black rounded-full flex items-center justify-center gap-2 font-bold text-xs transition-all pointer-events-auto cursor-pointer shadow-[0_0_15px_rgba(212,151,255,0.4)]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="10" height="10" fill="currentColor">
                                <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
                            </svg>
                            Xem ngay
                        </TransitionLink>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleFavorite();
                            }}
                            className={`flex-1 h-10 rounded-full flex items-center justify-center gap-1.5 font-bold text-[11px] transition-all pointer-events-auto cursor-pointer ${isFavorited ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="12" height="12" fill={isFavorited ? "white" : "currentColor"}>
                                <path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path>
                            </svg>
                            {isFavorited ? 'Đã thích' : 'Thích'}
                        </button>

                        <TransitionLink
                            href={detailUrl}
                            className="flex-1 h-10 bg-white/10 hover:bg-white/15 text-white rounded-full flex items-center justify-center gap-1.5 font-bold text-[11px] transition-all pointer-events-auto cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="12" height="12" fill="currentColor">
                                <path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"></path>
                            </svg>
                            Chi tiết
                        </TransitionLink>
                    </div>

                    {/* Metadata Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="px-2.5 py-1 bg-amber-400/20 text-amber-400 rounded-lg text-[10px] font-bold">
                            ★ {imdbRating}
                        </div>
                        <div className="px-2.5 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold">
                            {movie.year}
                        </div>
                        <div className="px-2.5 py-1 bg-[#D497FF]/20 text-[#D497FF] rounded-lg text-[10px] font-bold">
                            {updatedMetadata
                                ? getEpisodeStatus({ ...movie, ...updatedMetadata })
                                : getEpisodeStatus(movie)}
                        </div>
                    </div>

                    {/* Genres Row */}
                    {movie.category && movie.category.length > 0 && (() => {
                        const genres = movie.category.slice(0, 3);
                        const colors = getCategoryColors(genres.map((g) => g.slug));
                        return (
                            <div className="text-[11px] font-medium flex flex-wrap gap-x-2 gap-y-1">
                                {genres.map((cat, idx) => (
                                    <span key={cat.slug} className="flex items-center gap-2">
                                        <span
                                            className={`text-md ${colors[idx]} hover:translate-x-1 transition-all duration-150 whitespace-nowrap block`}
                                        >
                                            {cat.name}
                                        </span>
                                        {idx < Math.min(movie.category!.slice(0, 3).length - 1, 2) && <span className="text-white/60">•</span>}
                                    </span>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
