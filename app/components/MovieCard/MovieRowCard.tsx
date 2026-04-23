"use client";

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

export default function MovieRowCard({ movie, priority = false, adZone = "movie_row", onClick }: MovieRowCardProps) {
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
                <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 mb-3">
                    <SmartImage
                        src={imgUrl}
                        rawSrc={getRawImageUrl(movie.thumb_url)}
                        alt={movie.name}
                        fill
                        priority={priority}
                        loading={priority ? "eager" : "lazy"}
                        sizes="(max-width: 768px) 160px, (max-width: 1024px) 240px, 280px"
                        className="object-cover transition-transform duration-500 group-hover/item:scale-110 transform-gpu"
                    />
                    <div className="absolute inset-x-0 bottom-[-1] h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                    {movie.episode_current && (
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-white/30 rounded border border-white/20">
                            <span className="text-[8px] md:text-xs md:font-semibold text-white truncate max-w-[120px] block">
                                {movie.episode_current}
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="text-white md:text-left text-center font-medium text-xs md:text-sm line-clamp-1 group-hover/item:text-pink-300 transition-colors">
                        {decodeHtml(movie.name)}
                    </h3>
                    <p className="text-white/50 text-[10px] md:text-left text-center md:text-xs line-clamp-1">
                        {decodeHtml(movie.origin_name)}
                    </p>
                </div>
            </MoviePreviewWrapper>
        </TransitionLink>
    );
}
