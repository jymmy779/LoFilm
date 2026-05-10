import TransitionLink from "@/app/components/Transition/TransitionLink";
import MoviePreviewWrapper from "./MoviePreviewWrapper";
import SmartImage from "@/app/components/Common/SmartImage";
import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { getEpisodeStatus, getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";

interface WideMovieCardProps {
    movie: Movie;
    priority?: boolean;
    adZone?: string;
}

export default function WideMovieCard({ movie, priority = false, adZone = "wide_movie" }: WideMovieCardProps) {
    const thumbUrl = movie.thumb_url ? getImageUrl(movie.thumb_url, { width: 600, quality: 75 }) : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    const posterUrl = movie.poster_url ? getImageUrl(movie.poster_url, { width: 200, quality: 75 }) : thumbUrl;

    return (
        <MoviePreviewWrapper
            movie={movie}
            adZone={adZone}
            className="block h-full"
        >
            <TransitionLink
                href={`/phim/${movie.slug}`}
                className="block w-full h-full flex flex-col group/link"
            >
                {/* Top Thumbnail (aspect 21/9) */}
                <div className="relative w-full aspect-[21/9] overflow-hidden rounded-xl bg-[#0a1628]">
                    <SmartImage
                        src={thumbUrl}
                        rawSrc={getRawImageUrl(movie.thumb_url)}
                        alt={movie.name}
                        fill
                        priority={priority}
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 30vw"
                        className="object-cover transition-transform duration-700 group-hover/link:scale-105"
                    />
                </div>

                {/* Bottom Info Section */}
                <div className="px-3 md:px-4 pb-3 md:pb-4 flex gap-3 relative z-20">
                    {/* Poster overlapping the thumbnail (-mt-6 for mobile, -mt-8 for desktop which is ~20% of the poster height) */}
                    <div className="w-16 md:w-20 shrink-0 aspect-[2/3] rounded-lg overflow-hidden border-2 border-[#1a2035] bg-[#0a1628] -mt-6 md:-mt-8 relative z-30 transition-transform duration-300 group-hover/link:-translate-y-1">
                        <SmartImage
                            src={posterUrl}
                            rawSrc={getRawImageUrl(movie.poster_url)}
                            alt={movie.name}
                            fill
                            priority={priority}
                            sizes="(max-width: 640px) 64px, 80px"
                            className="object-cover"
                        />
                    </div>

                    {/* Text Info */}
                    <div className="flex-1 min-w-0 flex gap-1 flex-col pt-1.5 md:pt-3">
                        <h4 className="text-[13px] md:text-[15px] font-bold text-white truncate group-hover/link:text-yellow-400 transition-colors drop-shadow-sm mb-0.5">
                            {decodeHtml(movie.name)}
                        </h4>
                        <span className="text-[10px] md:text-xs text-white/40 truncate font-medium mb-1.5">
                            {decodeHtml(movie.origin_name)}
                        </span>

                        {/* Badges: year, episode, quality */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                            <div className="tag-small px-1.5 py-0.5 bg-[#1a2035]/80 rounded text-[9px] md:text-[10px] text-white/50 font-medium leading-none flex items-center justify-center">
                                {movie.year || "2024"}
                            </div>
                            <div className="tag-small px-1.5 py-0.5 bg-[#1a2035]/80 rounded text-[9px] md:text-[10px] text-white/50 font-medium leading-none flex items-center justify-center">
                                {getEpisodeStatus(movie)}
                            </div>
                            <div className="tag-small px-1.5 py-0.5 bg-[#1a2035]/80 rounded text-[9px] md:text-[10px] text-white/50 font-medium leading-none flex items-center justify-center">
                                {movie.quality || "HD"}
                            </div>
                        </div>
                    </div>
                </div>
            </TransitionLink>
        </MoviePreviewWrapper>
    );
}
