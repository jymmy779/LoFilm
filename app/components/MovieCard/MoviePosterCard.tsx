"use client";

import TransitionLink from "@/app/components/Transition/TransitionLink";
import Image from "next/image";
import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { getEpisodeStatus, getImageUrl } from "@/app/utils/movieUtils";

interface MoviePosterCardProps {
    movie: Movie;
    /** Ưu tiên tải poster cho các ô đầu (trong viewport) */
    priority?: boolean;
}

export default function MoviePosterCard({ movie, priority = false }: MoviePosterCardProps) {
    const posterImg = getImageUrl(movie.poster_url, { width: 250, quality: 75 });

    return (
        <div className="sw-item group/item cursor-pointer [contain:layout]">
            <TransitionLink href={`/phim/${movie.slug}`} className="v-thumbnail relative block aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-white/5">
                {/* Poster Image */}
                <Image
                    src={posterImg}
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
                    {/* Badge Quality - Xám */}
                    <div className="h-5 px-1 bg-gray-600 rounded-full text-white text-[10px]  border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                        {movie.quality || "HD"}
                    </div>

                    {/* Badge Language - Xanh (Vietsub, LT, TM) */}
                    <div className="h-5 px-1 bg-green-600 rounded-full text-white text-[10px]  border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                        {(movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                    </div>

                    {/* Badge Status - Cam (Full, Trailer, HT) */}
                    <div className="h-5 px-1 bg-orange-600 rounded-full text-white text-[10px]  border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                        {getEpisodeStatus(movie)}
                    </div>
                </div>
            </TransitionLink>

            <div className="info text-center space-y-1">
                <h4 className="item-title text-white text-sm lg:text-base line-clamp-1 group-hover/item:text-blue-300 transition-colors">
                    <TransitionLink href={`/phim/${movie.slug}`} title={movie.name}>{decodeHtml(movie.name)}</TransitionLink>
                </h4>
                <h4 className="alias-title text-white/40 text-xs line-clamp-1 font-medium">
                    <TransitionLink href={`/phim/${movie.slug}`}>{decodeHtml(movie.origin_name)}</TransitionLink>
                </h4>
            </div>
        </div>
    );
}
