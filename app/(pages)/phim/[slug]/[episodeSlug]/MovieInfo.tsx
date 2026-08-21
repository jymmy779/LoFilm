"use client";

import React from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import { getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";
import { cleanContent } from "@/app/utils/textUtils";

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
  const rating = movie.tmdb?.vote_average && movie.tmdb.vote_average > 0
    ? movie.tmdb.vote_average.toFixed(1)
    : null;

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
            <p className="text-xs sm:text-sm text-white/40 font-medium italic">
              {movie.origin_name}
            </p>
          </div>
        </div>
      </div>

      {/* Nội Dung Phim - Full Width & Luôn hiển thị */}
      <div className="border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
          <div className="w-1.5 h-3.5 bg-[#D497FF] rounded-full shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            Nội Dung Phim
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
          {cleanedContent || "Bộ phim hấp dẫn đang được phát sóng với chất lượng cao trên LoFilm..."}
        </p>
      </div>
    </div>
  );
};

export default React.memo(MovieInfo);
