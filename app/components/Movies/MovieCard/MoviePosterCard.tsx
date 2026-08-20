"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { getImageUrl, getRawImageUrl, getEpisodeStatus } from "@/app/utils/movieUtils";
import { getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";
import MoviePreviewWrapper from "./MoviePreviewWrapper";
import { useBaitStore } from "@/app/store/useBaitStore";
import { Play } from "lucide-react";

interface MoviePosterCardProps {
    movie: Movie;
    priority?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    user?: any;
    adZone?: string;
}

function MoviePosterCard({ movie, priority = false, isFirst, isLast, user, adZone }: MoviePosterCardProps) {
    const moviePath = `/phim/${movie.slug}`;
    const setBaitMovie = useBaitStore(state => state.setBaitMovie);
    const imgUrl = getImageUrl(movie.poster_url || movie.thumb_url, { width: 340, quality: 75 });

    return (
        <MoviePreviewWrapper
            movie={movie}
            user={user}
            isFirst={isFirst}
            isLast={isLast}
            adZone={adZone}
            className="group flex flex-col h-full cursor-pointer w-full"
        >
            {/* Poster Thumbnail */}
            <TransitionLink
                href={moviePath}
                onClick={() => setBaitMovie(movie)}
                onMouseEnter={() => setBaitMovie(movie)}
                className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#0F1115] border border-white/5 group-hover:border-[#D497FF]/50 transition-all duration-300 block w-full flex-shrink-0"
            >
                <SmartImage
                    r2Src={getR2MoviePosterUrl(movie.slug)}
                    src={imgUrl}
                    rawSrc={getRawImageUrl(movie.poster_url || movie.thumb_url)}
                    alt={movie.name}
                    fill
                    priority={priority}
                    loading={priority ? "eager" : "lazy"}
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 240px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 transform-gpu"
                />

                {/* Bottom Gradient Scrim */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10" />



                {/* Solid Badges (High Contrast, Zero Blur) */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none z-10">
                    <span className="h-4.5 px-1.5 bg-[#FAD078] rounded text-amber-950 shadow-sm text-[9px] font-bold flex items-center justify-center leading-none">
                        {movie.quality || "HD"}
                    </span>
                    {movie.episode_current && (
                        <span className="h-4.5 px-1.5 bg-[#A7F3D0] rounded text-emerald-950 shadow-sm text-[9px] font-bold flex items-center justify-center leading-none truncate max-w-[65%]">
                            {getEpisodeStatus(movie)}
                        </span>
                    )}
                </div>
            </TransitionLink>

            {/* Movie Info (Fixed Height to prevent layout shift) */}
            <div className="pt-2 space-y-1 flex flex-col justify-between">
                <div>
                    <TransitionLink
                        href={moviePath}
                        className="text-white text-xs sm:text-sm font-bold line-clamp-2 group-hover:text-[#D497FF] transition-colors leading-tight block h-[32px] sm:h-[36px]"
                        title={movie.name}
                    >
                        {decodeHtml(movie.name)}
                    </TransitionLink>
                    <p
                        className="text-white/40 text-[10px] sm:text-[11px] line-clamp-1 font-medium italic mt-0.5 h-[16px]"
                        title={movie.origin_name}
                    >
                        {decodeHtml(movie.origin_name)}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/50 pt-0.5 h-[16px]">
                    {movie.year && <span>{movie.year}</span>}
                    {movie.year && <span>•</span>}
                    <span className="text-[#D497FF]/80 font-semibold truncate">
                        {((movie as any).lang_tag || movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                    </span>
                </div>
            </div>
        </MoviePreviewWrapper>
    );
}

export default memo(MoviePosterCard);
