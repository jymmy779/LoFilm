"use client";

import React, { useMemo } from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { getImageUrl, getRawImageUrl, generateCategorySlug } from "@/app/utils/movieUtils";
import { getCategoryStyles } from "@/app/utils/uiUtils";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import { getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";

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
    category?: Array<{
      id?: string;
      name: string;
      slug: string;
    }>;
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

  const categoryStyles = useMemo(() => {
    if (!movie.category || movie.category.length === 0) return [];
    return getCategoryStyles(movie.category.map((c) => c.slug));
  }, [movie.category]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
      {/* Poster Thumbnail */}
      <div className="flex-shrink-0 w-[90px] sm:w-[105px] md:w-[120px] aspect-[2/3] rounded-xl overflow-hidden border border-white/15 bg-[#12151C] shadow-lg relative group">
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

      {/* Main Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
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
        </div>

        {/* Synopsis content */}
        {movie.content && (
          <div
            className="text-xs sm:text-sm text-white/70 leading-relaxed font-light mt-1"
            dangerouslySetInnerHTML={{ __html: movie.content }}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(MovieInfo);
