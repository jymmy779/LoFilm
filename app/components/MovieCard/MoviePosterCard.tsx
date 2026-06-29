"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
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
    const moviePath = `/phim/${movie.slug}`;

    const getExclusiveBadgeStyle = (tag: string) => {
        if (tag?.includes("Song Ngữ")) return "bg-fuchsia-600/90 border-fuchsia-500/30";
        if (tag?.includes("Thuyết Minh")) return "bg-blue-600/90 border-blue-500/30";
        if (tag?.includes("Lồng Tiếng")) return "bg-emerald-600/90 border-emerald-500/30";
        if (tag?.includes("RAW")) return "bg-orange-600/90 border-orange-500/30";
        return "bg-red-600/90 border-red-500/30"; // Mặc định Vietsub là Đỏ
    };

    // Chuẩn bị dữ liệu hiển thị cho Popup
    const description = movie.content ? cleanContent(decodeHtml(movie.content)) : "Đang cập nhật nội dung cho bộ phim này...";
    const genres = movie.category?.slice(0, 3).map(c => c.name).join(", ");
    const imdbRating = (movie.tmdb?.vote_count && movie.tmdb.vote_count > 0)
        ? movie.tmdb.vote_average.toFixed(1)
        : "N/A";

    return (
        <MoviePreviewWrapper
            movie={movie}
            user={user}
            isFirst={isFirst}
            isLast={isLast}
            adZone={adZone}
            className="sw-item group/item cursor-pointer relative h-full flex flex-col"
        >
            <TransitionLink
                href={moviePath}
                className="block h-full"
            >
                <div className="v-thumbnail relative block aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-[#0a1628]">
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

                    {/* Exclusive Badge */}
                    {(movie as any).is_exclusive || movie.sub_docquyen ? (
                        <div className="absolute top-2 right-2 z-20">
                            <div className={`${getExclusiveBadgeStyle(movie.lang || "")} backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-md border tracking-wide uppercase flex items-center gap-1`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                {movie.lang || "Vietsub Độc Quyền"}
                            </div>
                        </div>
                    ) : null}

                    {/* Solid Badges (No Glassmorphism) */}
                    <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center flex-wrap gap-1 px-2 z-20 translate-y-1 group-hover/item:translate-y-0 transition-transform duration-300 transform-gpu">
                        <div className="h-5 px-1.5 bg-gray-500 rounded-md text-white text-[9px] font-bold flex items-center justify-center whitespace-nowrap tracking-tighter leading-none">
                            {movie.quality || "HD"}
                        </div>
                        <div className="h-5 px-1.5 bg-green-600 rounded-md text-white text-[9px] font-bold flex items-center justify-center whitespace-nowrap tracking-tighter leading-none">
                            {(movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM").replace(" Độc Quyền", "")}
                        </div>
                        <div className="h-5 px-1.5 bg-amber-600 rounded-md text-white text-[9px] font-bold flex items-center justify-center whitespace-nowrap tracking-tighter leading-none">
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
            </TransitionLink>
        </MoviePreviewWrapper>
    );
}

export default memo(MoviePosterCard);
