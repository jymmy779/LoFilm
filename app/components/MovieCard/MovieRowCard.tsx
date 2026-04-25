"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import SmartImage from "@/app/components/Common/SmartImage";
import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import MoviePreviewWrapper from "./MoviePreviewWrapper";

interface MovieRowCardProps {
    movie: Movie;
    priority?: boolean;
    adZone?: string;
    onClick?: () => void;
}

function MovieRowCard({ movie, priority = false, adZone = "movie_row", onClick }: MovieRowCardProps) {
    const imgUrl = getImageUrl(movie.thumb_url, { width: 300, quality: 75 });

    return (
        <TransitionLink
            href={`/phim/${movie.slug}`}
            onClick={onClick}
            className="block group/item cursor-pointer optimize-render transform-gpu"
        >
            <MoviePreviewWrapper
                movie={movie}
                adZone={adZone}
            >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 mb-3 border border-white/10 group-hover/item:border-white/20 transition-all shadow-lg">
                    <SmartImage
                        src={imgUrl}
                        rawSrc={getRawImageUrl(movie.thumb_url)}
                        alt={movie.name}
                        fill
                        priority={priority}
                        loading={priority ? "eager" : "lazy"}
                        sizes="(max-width: 768px) 160px, (max-width: 1024px) 240px, 280px"
                        className="object-cover transition-transform duration-700 group-hover/item:scale-110 transform-gpu"
                    />

                    {/* Play Icon Highlight */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                        <div className="w-10 h-10 rounded-full bg-[#f5a623] text-[#0a1628] flex items-center justify-center shadow-lg transform scale-90 group-hover/item:scale-100 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.54-2.33 2.77-1.613l11.74 6.813a1.614 1.614 0 010 2.825L7.27 20.493c-1.23.717-2.77-.187-2.77-1.613V5.653z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-[-1] h-1/2 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/40 to-transparent pointer-events-none" />

                    {movie.episode_current && (
                        <div className="absolute bottom-2 left-2 h-5 flex items-center justify-center px-1.5 bg-black/40 backdrop-blur-md rounded border border-white/10 shadow-sm z-10">
                            <span className="text-[9px] md:text-xs font-bold text-white tracking-tighter leading-none">
                                {movie.episode_current}
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-0.5">
                    <h3 className="text-white md:text-left text-center font-bold text-xs md:text-sm line-clamp-1 group-hover/item:text-[#f5a623] transition-colors duration-300">
                        {decodeHtml(movie.name)}
                    </h3>
                    <p className="text-white/40 text-[10px] md:text-left text-center md:text-[11px] line-clamp-1 font-medium group-hover/item:text-white/60 transition-colors">
                        {decodeHtml(movie.origin_name)}
                    </p>
                </div>
            </MoviePreviewWrapper>
        </TransitionLink>
    );
}

export default memo(MovieRowCard);
