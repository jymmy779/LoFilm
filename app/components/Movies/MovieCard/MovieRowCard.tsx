"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { getImageUrl, getRawImageUrl, getEpisodeStatus } from "@/app/utils/movieUtils";
import { getR2MovieThumbUrl } from "@/app/utils/r2ImageUrl";
import MoviePreviewWrapper from "./MoviePreviewWrapper";
import { Play } from "lucide-react";

interface MovieRowCardProps {
    movie: Movie;
    priority?: boolean;
    adZone?: string;
    onClick?: () => void;
}

function MovieRowCard({ movie, priority = false, adZone = "movie_row", onClick }: MovieRowCardProps) {
    const imgUrl = getImageUrl(movie.thumb_url || movie.poster_url, { width: 400, quality: 75 });

    return (
        <MoviePreviewWrapper
            movie={movie}
            adZone={adZone}
            className="block group/item cursor-pointer transform-gpu h-full"
        >
            <TransitionLink
                href={`/phim/${movie.slug}`}
                onClick={onClick}
                className="block w-full h-full flex flex-col justify-between"
            >
                {/* 16:10 Cinematic Landscape Proportion */}
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2.5 bg-[#0F1115] border border-white/10 group-hover/item:border-[#D497FF]/50 transition-all duration-300">
                    <SmartImage
                        r2Src={getR2MovieThumbUrl(movie.slug)}
                        src={imgUrl}
                        rawSrc={getRawImageUrl(movie.thumb_url || movie.poster_url)}
                        alt={movie.name}
                        fill
                        priority={priority}
                        loading={priority ? "eager" : "lazy"}
                        sizes="(max-width: 640px) 180px, (max-width: 1024px) 260px, 300px"
                        className="object-cover transition-transform duration-500 group-hover/item:scale-105 transform-gpu"
                    />



                    {/* Solid Badges (High Contrast, Zero Blur) */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none z-10">
                        {movie.quality ? (
                            <span className="h-4.5 px-1.5 bg-[#FAD078] rounded text-amber-950 shadow-sm text-[9px] font-bold flex items-center justify-center leading-none">
                                {movie.quality}
                            </span>
                        ) : <div />}
                        {movie.episode_current && (
                            <span className="h-4.5 px-1.5 bg-[#A7F3D0] rounded text-emerald-950 shadow-sm text-[9px] font-bold flex items-center justify-center leading-none truncate max-w-[70%]">
                                {getEpisodeStatus(movie)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Movie Info (Fixed Height to prevent any layout shift) */}
                <div className="space-y-0.5 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-white text-xs sm:text-sm font-bold line-clamp-2 group-hover/item:text-[#D497FF] transition-colors leading-snug h-[32px] sm:h-[36px]">
                            <span title={movie.name}>{decodeHtml(movie.name)}</span>
                        </h3>
                        <p className="text-white/40 text-[10.5px] sm:text-[11px] line-clamp-1 font-medium italic mt-0.5 h-[16px] truncate">
                            <span title={movie.origin_name}>{decodeHtml(movie.origin_name)}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-white/50 pt-1 h-[16px]">
                        {movie.year && <span>{movie.year}</span>}
                        {movie.year && <span>•</span>}
                        <span className="text-[#D497FF]/80 font-semibold truncate">
                            {((movie as any).lang_tag || movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                        </span>
                    </div>
                </div>
            </TransitionLink>
        </MoviePreviewWrapper>
    );
}

export default memo(MovieRowCard);
