"use client";

import React, { useMemo, useState } from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { getImageUrl, getRawImageUrl, generateCategorySlug } from "@/app/utils/movieUtils";
import { getCategoryStyles } from "@/app/utils/uiUtils";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import { getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";
import { cleanContent } from "@/app/utils/textUtils";
import { ChevronRight } from "lucide-react";

interface MovieInfoProps {
  slug: string;
  movie: {
    name: string;
    origin_name: string;
    poster_url: string;
    thumb_url?: string;
    content: string;
    quality: string;
    year?: number | string;
    time?: string;
    director?: string[];
    country?: Array<{
      id?: string;
      name: string;
      slug: string;
    }>;
    category?: Array<{
      id?: string;
      name: string;
      slug: string;
    }>;
    episode_current?: string;
    status?: string;
    tmdb?: {
      id?: string;
      type?: string;
      vote_average?: number;
    };
  };
  episode: {
    name: string;
  };
}

const MovieInfo = ({ slug, movie, episode }: MovieInfoProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const rating = movie.tmdb?.vote_average && movie.tmdb.vote_average > 0
    ? movie.tmdb.vote_average.toFixed(1)
    : null;

  const categoryStyles = useMemo(() => {
    if (!movie.category || movie.category.length === 0) return [];
    return getCategoryStyles(movie.category.map((c) => c.slug));
  }, [movie.category]);

  const cleanedContent = cleanContent(movie.content);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header Info: Poster + Main Info */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
        {/* Poster Thumbnail */}
        <div className="flex-shrink-0 w-[90px] sm:w-[105px] md:w-[120px] aspect-[2/3] rounded-xl overflow-hidden border border-white/15 bg-[#111419] shadow-lg relative group">
          <SmartImage
            r2Src={getR2MoviePosterUrl(slug)}
            src={getImageUrl(movie.poster_url || movie.thumb_url, { width: 240, quality: 80 })}
            rawSrc={getRawImageUrl(movie.poster_url || movie.thumb_url)}
            alt={movie.name}
            fill
            sizes="(max-width: 768px) 105px, 120px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Main Metadata */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {rating && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-pink-500 to-rose-400 rounded-md text-white text-xs font-black shadow-sm leading-none">
                  <span className="text-[10px]">★</span>
                  <span>{rating}</span>
                </div>
              )}
              {movie.year && (
                <span className="px-2.5 py-1 bg-[#A7F3D0] text-emerald-950 text-xs font-bold rounded-md shadow-sm leading-none">
                  {movie.year}
                </span>
              )}
              {movie.quality && (
                <span className="px-2.5 py-1 bg-[#FAD078] text-amber-950 text-xs font-bold rounded-md shadow-sm leading-none">
                  {movie.quality}
                </span>
              )}
              <span className="px-2.5 py-1 bg-[#F5CAE3] text-pink-950 text-xs font-bold rounded-md shadow-sm leading-none">
                {episode.name || "Trailer"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 tracking-tight leading-snug">
              <TransitionLink href={`/phim/${slug}`} className="hover:text-[#D497FF] transition-colors">
                {movie.name}
              </TransitionLink>
            </h1>
            <p className="text-xs sm:text-sm text-white/40 font-medium italic mb-2.5">
              {movie.origin_name}
            </p>

            {/* Categories */}
            {movie.category && movie.category.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {movie.category.map((cat, idx) => {
                  const finalSlug = generateCategorySlug(cat.slug, cat.name);
                  return (
                    <TransitionLink
                      key={finalSlug || idx}
                      href={`/the-loai/${finalSlug}`}
                      className={`px-2.5 py-0.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 ${categoryStyles[idx]?.text || 'text-white/80'} rounded-md transition-all`}
                    >
                      {cat.name}
                    </TransitionLink>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unified Bento: Nội Dung & Thông Tin Chi Tiết */}
      <div className="border-t border-white/5 pt-4">
        {/* Toggle header on Mobile */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between cursor-pointer sm:cursor-default select-none pb-2 sm:pb-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 bg-[#D497FF] rounded-full shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Nội Dung & Chi Tiết
            </h3>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-[#D497FF] sm:hidden px-2.5 py-1 rounded-full bg-[#D497FF]/10 border border-[#D497FF]/20 shrink-0 whitespace-nowrap">
            <span>{isExpanded ? "Thu gọn" : "Chi tiết"}</span>
            <ChevronRight
              size={13}
              className={`transform transition-transform duration-300 ${isExpanded ? "-rotate-90" : "rotate-90"}`}
            />
          </div>
        </div>

        {/* Content Body: Toggleable on mobile, always visible on tablet/desktop */}
        <div className={`${isExpanded ? "block animate-fade-in" : "hidden sm:block"}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Synopsis */}
            <div className="md:col-span-2">
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
                {cleanedContent || "Bộ phim hấp dẫn đang được phát sóng với chất lượng cao trên LoFilm..."}
              </p>
            </div>

            {/* Quick Details */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-2 text-xs">
              {movie.time && (
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Thời lượng:</span>
                  <span className="text-white font-medium">{movie.time}</span>
                </div>
              )}
              {movie.country && movie.country.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Quốc gia:</span>
                  <span className="text-[#D497FF] font-medium">{movie.country.map(c => c.name).join(", ")}</span>
                </div>
              )}
              {movie.director && movie.director.length > 0 && movie.director[0] !== "" && (
                <div className="flex items-start justify-between gap-2 pt-1 border-t border-white/5">
                  <span className="text-white/40 whitespace-nowrap">Đạo diễn:</span>
                  <span className="text-white/80 font-medium text-right">{movie.director.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MovieInfo);
