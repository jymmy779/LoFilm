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
    const thumbUrl = movie.thumb_url ? getImageUrl(movie.thumb_url, { width: 800, quality: 80 }) : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    return (
        <MoviePreviewWrapper
            movie={movie}
            adZone={adZone}
            className="block group cursor-pointer relative"
        >
            <TransitionLink
                href={`/phim/${movie.slug}`}
                className="block w-full h-full"
            >
                {/* Background Thumbnail (Horizontal) - aspect 21/9 */}
                <div className="v-thumbnail v-thumbnail-hoz relative aspect-[21/9] overflow-hidden transform-gpu bg-white/5">
                    <SmartImage
                        src={thumbUrl}
                        rawSrc={getRawImageUrl(movie.thumb_url)}
                        alt={movie.name}
                        fill
                        priority={priority}
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 30vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105 transform-gpu"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent z-10" />
                </div>

                {/* Overlaid Content Info */}
                <div className="h-item absolute bottom-0 left-0 right-0 p-3 md:p-4 flex flex-col justify-end z-20 transition-transform duration-300 group-hover:translate-y-[-2px] transform-gpu">
                    <div className="info min-w-0">
                        <h4 className="item-title text-[12px] md:text-[15px] font-bold text-white truncate group-hover:text-yellow-400 transition-colors drop-shadow-md mb-0.5">
                            {decodeHtml(movie.name)}
                        </h4>
                        <div className="info-line flex items-center gap-2">
                            <span className="text-[10px] md:text-xs text-white/40 truncate font-medium max-w-[150px]">
                                {decodeHtml(movie.origin_name)}
                            </span>
                            <div className="flex gap-1.5 ml-auto">
                                <div className="tag-small px-1.5 py-0.5 bg-[#1a2035]/80 rounded text-[9px] md:text-[10px] text-white/70 border border-white/20 font-medium leading-none flex items-center justify-center">
                                    {movie.year}
                                </div>
                                <div className="tag-small px-1.5 py-0.5 bg-[#3a2a10]/80 rounded text-[9px] md:text-[10px] text-[#f5a623] font-bold border border-[#f5a623]/20 leading-none flex items-center justify-center">
                                    {getEpisodeStatus(movie)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </TransitionLink>
        </MoviePreviewWrapper>
    );
}
