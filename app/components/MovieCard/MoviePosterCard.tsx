"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { useAdTrigger } from "@/app/hooks/useAdTrigger";
import SmartImage from "@/app/components/Common/SmartImage";
import { Movie } from "@/app/types/movie";
import { decodeHtml, cleanContent } from "@/app/utils/textUtils";
import { getEpisodeStatus, getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import MoviePreviewWrapper from "./MoviePreviewWrapper";

interface MoviePosterCardProps {
    movie: Movie;
    /** Ưu tiên tải poster cho các ô đầu (trong viewport) */
    priority?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    user?: any;
    adZone?: string;
}

function MoviePosterCard({ movie, priority = false, isFirst, isLast, user, adZone }: MoviePosterCardProps) {
    const { openAdOnly } = useAdTrigger();
    const moviePath = `/phim/${movie.slug}`;

    const handleAdClick = () => {
        openAdOnly(adZone || "movie_poster_row");
    };

    // Chuẩn bị dữ liệu hiển thị cho Popup
    const description = movie.content ? cleanContent(decodeHtml(movie.content)) : "Đang cập nhật nội dung cho bộ phim này...";
    const genres = movie.category?.slice(0, 3).map(c => c.name).join(", ");
    const imdbRating = (movie.tmdb?.vote_count && movie.tmdb.vote_count > 0)
        ? movie.tmdb.vote_average.toFixed(1)
        : "N/A";

    return (
        <TransitionLink
            href={moviePath}
            onClick={handleAdClick}
            className="block h-full"
        >
            <MoviePreviewWrapper
                movie={movie}
                user={user}
                isFirst={isFirst}
                isLast={isLast}
                adZone={adZone}
                className="sw-item group/item cursor-pointer relative [contain:layout] h-full flex flex-col"
            >
                <div className="v-thumbnail relative block aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-white/5 border border-white/10 group-hover/item:border-white/20 transition-all duration-500 shadow-lg group-hover/item:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    {/* Poster Image */}
                    <SmartImage
                        src={getImageUrl(movie.poster_url, { width: 400, quality: 80 })}
                        rawSrc={getRawImageUrl(movie.poster_url)}
                        alt={movie.name}
                        fill
                        priority={priority}
                        loading={priority ? "eager" : "lazy"}
                        sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
                        className="object-cover transition-transform duration-700 ease-out group-hover/item:scale-110 transform-gpu"
                    />

                    {/* Masked Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent opacity-60 group-hover/item:opacity-40 transition-opacity pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-[-1px] h-1/3 bg-gradient-to-t from-[#0A1628] to-transparent pointer-events-none" />

                    {/* Glassmorphism Badges */}
                    <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center flex-wrap gap-1 px-2 z-10 translate-y-1 group-hover/item:translate-y-0 transition-transform duration-300">
                        <div className="h-5 px-1.5 bg-white/10 backdrop-blur-md rounded-md text-white text-[9px] font-bold border border-white/20 flex items-center justify-center whitespace-nowrap shadow-sm tracking-tighter leading-none">
                            {movie.quality || "HD"}
                        </div>
                        <div className="h-5 px-1.5 bg-blue-500/20 backdrop-blur-md rounded-md text-blue-200 text-[9px] font-bold border border-blue-400/30 flex items-center justify-center whitespace-nowrap shadow-sm tracking-tighter leading-none">
                            {(movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                        </div>
                        <div className="h-5 px-1.5 bg-amber-500/20 backdrop-blur-md rounded-md text-amber-200 text-[9px] font-bold border border-amber-400/30 flex items-center justify-center whitespace-nowrap shadow-sm tracking-tighter leading-none">
                            {getEpisodeStatus(movie)}
                        </div>
                    </div>
                </div>

                <div className="info text-center space-y-0.5 mt-auto">
                    <h4 className="item-title text-white text-xs lg:text-sm font-bold line-clamp-1 group-hover/item:text-[#f5a623] transition-colors duration-300">
                        <span title={movie.name}>{decodeHtml(movie.name)}</span>
                    </h4>
                    <h4 className="alias-title text-white/40 text-[10px] md:text-[11px] line-clamp-1 font-medium transition-colors group-hover/item:text-white/60">
                        <span>{decodeHtml(movie.origin_name)}</span>
                    </h4>
                </div>
            </MoviePreviewWrapper>
        </TransitionLink>
    );
}

export default memo(MoviePosterCard);
