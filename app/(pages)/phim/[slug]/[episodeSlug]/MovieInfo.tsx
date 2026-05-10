"use client";

import React from "react";

import TransitionLink from "@/app/components/Transition/TransitionLink";
import { ChevronRight } from "lucide-react";
import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import SmartImage from "@/app/components/Common/SmartImage";

interface MovieInfoProps {
  slug: string;
  movie: {
    name: string;
    origin_name: string;
    poster_url: string;
    content: string;
    quality: string;
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
    : "N/A";

  return (
    <div className="flex md:flex-row gap-6 pb-10 border-b border-b-white/10">
      <div className="v-thumb-l flex justify-center flex-shrink-0">
        <div className="v-thumbnail relative w-[100px] h-[150px] rounded-xl overflow-hidden transform-gpu">
          <SmartImage
            src={getImageUrl(movie.poster_url, { width: 200, quality: 75 })}
            rawSrc={getRawImageUrl(movie.poster_url)}
            alt={movie.name}
            fill
            sizes="100px"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-lg md:text-xl font-bold text-white mb-1 font-montserrat tracking-tight leading-tight">
          <TransitionLink href={`/phim/${slug}`} className="hover:text-amber-400 transition-colors">
            {movie.name}
          </TransitionLink>
        </h1>
        <div className="text-[12px] text-white/40 mb-3 font-medium italic leading-none">{movie.origin_name}</div>

        <div className="flex flex-wrap items-center gap-3 md:gap-5 mb-5 md:mb-6">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-[#f5c518] rounded text-black text-[9px] font-bold">
              <span className="text-[8px]">★</span>
              <span>{rating}</span>
            </div>
            <div className="px-1.5 py-0.5 bg-white/10 rounded flex items-center justify-center text-white/70 text-[9px] font-medium  tracking-wider">{movie.quality}</div>
            <div className="px-1.5 py-0.5 bg-amber-500/10 flex items-center justify-center rounded text-amber-400 text-[9px] tracking-tight font-medium ">{episode.name}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:block hidden min-w-0 md:pl-6 md:border-l border-white/5 flex flex-col justify-start">
        <div className="text-[13.5px] text-white/40 leading-relaxed line-clamp-4 font-light">
          <div dangerouslySetInnerHTML={{ __html: movie.content }} />
        </div>
        <TransitionLink
          href={`/phim/${slug}`}
          className="inline-flex items-center gap-1 mt-8 text-amber-400 hover:text-amber-300 text-[13px] transition-colors group"
        >
          Thông tin phim
          <ChevronRight size={10} className="mt-[3px] group-hover:translate-x-0.5 transition-transform" />
        </TransitionLink>
      </div>
    </div>
  );
};

export default MovieInfo;
