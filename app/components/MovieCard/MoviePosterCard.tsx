"use client";

import { useAdTrigger } from "@/app/hooks/useAdTrigger";
import Image from "next/image";
import { Movie } from "@/app/types/movie";
import { decodeHtml, cleanContent } from "@/app/utils/textUtils";
import { getEpisodeStatus } from "@/app/utils/movieUtils";
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

export default function MoviePosterCard({ movie, priority = false, isFirst, isLast, user, adZone }: MoviePosterCardProps) {
    const { triggerAd } = useAdTrigger();
    const moviePath = `/phim/${movie.slug}`;

    const handleMovieClick = (e: React.MouseEvent) => {
        // Nếu click bằng chuột giữa hoặc giữ Ctrl/Cmd, để trình duyệt mở tab mới tự nhiên
        if (e.metaKey || e.ctrlKey || (e.button && e.button === 1)) return;

        e.preventDefault();
        triggerAd(moviePath, adZone || "movie_card");
    };

    // Chuẩn bị dữ liệu hiển thị cho Popup
    const description = movie.content ? cleanContent(decodeHtml(movie.content)) : "Đang cập nhật nội dung cho bộ phim này...";
    const genres = movie.category?.slice(0, 3).map(c => c.name).join(", ");
    const imdbRating = movie.tmdb?.vote_average ? movie.tmdb.vote_average.toFixed(1) : "N/A";

    return (
        <MoviePreviewWrapper 
            movie={movie}
            user={user}
            isFirst={isFirst}
            isLast={isLast}
            adZone={adZone}
            className="sw-item group/item cursor-pointer relative [contain:layout]" 
            onClick={handleMovieClick}
        >
            <div className="v-thumbnail relative block aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-white/5">
                {/* Poster Image */}
                <Image
                    src={movie.poster_url || ""}
                    alt={movie.name}
                    fill
                    priority={priority}
                    loading={priority ? "eager" : "lazy"}
                    sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
                    className="object-cover transition-transform duration-500 group-hover/item:scale-110 transform-gpu"
                />

                {/* Bottom Gradient overlay */}
                <div className="absolute inset-x-0 bottom-[-1px] h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                {/* Badges: Quality, Language, Status */}
                <div className="pin-new absolute bottom-2 left-0 right-0 flex items-center justify-center flex-wrap gap-x-1 gap-y-1 px-2">
                    <div className="h-5 px-1 bg-gray-600 rounded-full text-white text-[10px]  border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                        {movie.quality || "HD"}
                    </div>
                    <div className="h-5 px-1 bg-green-600 rounded-full text-white text-[10px]  border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                        {(movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                    </div>
                    <div className="h-5 px-1 bg-orange-600 rounded-full text-white text-[10px]  border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                        {getEpisodeStatus(movie)}
                    </div>
                </div>
            </div>

            <div className="info text-center space-y-1">
                <h4 className="item-title text-white text-sm lg:text-base line-clamp-1 group-hover/item:text-blue-300 transition-colors">
                    <span title={movie.name}>{decodeHtml(movie.name)}</span>
                </h4>
                <h4 className="alias-title text-white/40 text-xs line-clamp-1 font-medium">
                    <span>{decodeHtml(movie.origin_name)}</span>
                </h4>
            </div>
        </MoviePreviewWrapper>
    );
}
