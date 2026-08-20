"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Virtual } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { getImageUrl, getRawImageUrl, getEpisodeStatus } from "@/app/utils/movieUtils";
import { getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import Container from "@/app/components/UI/Container";
import MoviePreviewWrapper from "@/app/components/Movies/MovieCard/MoviePreviewWrapper";
import { Award, ChevronRight, Play, Sparkles } from "lucide-react";
import SwiperNavButtons from "@/app/components/UI/Common/SwiperNavButtons";

interface EditorChoiceRowProps {
    title?: string;
    apiUrl?: string;
    viewAllLink?: string;
    initialMovies?: Movie[];
    titleGradient?: string;
}

const CURATOR_TAGS = [
    "🌿 Staff Pick",
    "✨ Kiệt tác kịch bản",
    "🎬 Đỉnh cao thị giác",
    "⭐ Diễn xuất xuất thần",
    "🏆 Phim của năm",
    "🔥 Đề cử đặc biệt",
];

function EditorChoiceRow({
    title = "Editor's Choice",
    viewAllLink = "/danh-sach/phim-moi",
    initialMovies,
    titleGradient = "from-amber-200 via-yellow-100 to-white"
}: EditorChoiceRowProps) {
    const movies = initialMovies || [];
    const navId = "editor-choice-row";

    if (!movies || movies.length === 0) return null;

    return (
        <Container as="section" className="relative z-30">
            {/* Row Header */}
            <div className="row-header flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-sm flex-shrink-0">
                            <Award size={18} />
                        </div>
                        <div>
                            <h2 className={`text-xl sm:text-2xl lg:text-[28px] font-black !leading-tight text-transparent bg-clip-text bg-gradient-to-r ${titleGradient} drop-shadow-sm font-montserrat tracking-tight`}>
                                {title}
                            </h2>
                        </div>
                    </div>

                    <TransitionLink
                        href={viewAllLink || "/"}
                        className="group/more flex items-center justify-center bg-[#0F1115] border border-amber-500/20 rounded-full h-8 w-8 lg:h-9 lg:w-9 transition-[width,border-color] duration-300 hover:border-amber-400/60 hover:w-[110px] lg:hover:w-[125px] overflow-hidden"
                    >
                        <span className="max-w-0 overflow-hidden whitespace-nowrap text-amber-300 text-[10px] lg:text-xs font-bold transition-[max-width,margin,opacity] duration-300 group-hover/more:max-w-[75px] group-hover/more:mr-1.5 leading-none opacity-0 group-hover/more:opacity-100">
                            Xem thêm
                        </span>
                        <ChevronRight size={14} className="text-amber-300 transform transition-transform duration-300 group-hover/more:translate-x-0.5 flex-shrink-0" />
                    </TransitionLink>
                </div>
            </div>

            {/* Carousel Content (Standard 1-Row Height) */}
            <div className="row-content">
                <div className="relative group/slider">
                    <Swiper
                        modules={[Navigation, Virtual]}
                        virtual={{ enabled: true }}
                        spaceBetween={10}
                        slidesPerView={2.3}
                        navigation={{
                            nextEl: `.sw-next-${navId}`,
                            prevEl: `.sw-prev-${navId}`,
                        }}
                        breakpoints={{
                            480: { slidesPerView: 2.8, spaceBetween: 10 },
                            640: { slidesPerView: 3.5, spaceBetween: 12 },
                            768: { slidesPerView: 4.5, spaceBetween: 12 },
                            1024: { slidesPerView: 5.5, spaceBetween: 14 },
                            1280: { slidesPerView: 6.5, spaceBetween: 14 },
                            1536: { slidesPerView: 7.5, spaceBetween: 16 },
                        }}
                        className="w-full"
                    >
                        {movies.map((movie, index) => {
                            const curatorBadge = CURATOR_TAGS[index % CURATOR_TAGS.length];

                            return (
                                <SwiperSlide key={movie._id || index} virtualIndex={index}>
                                    <MoviePreviewWrapper
                                        movie={movie}
                                        adZone="editor_choice"
                                        className="group flex flex-col h-full cursor-pointer w-full"
                                    >
                                        {/* Poster Thumbnail */}
                                        <TransitionLink
                                            href={`/phim/${movie.slug}`}
                                            className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#0F1115] border border-amber-500/20 group-hover:border-amber-400/60 transition-all duration-300 block w-full flex-shrink-0"
                                        >
                                            <SmartImage
                                                r2Src={getR2MoviePosterUrl(movie.slug)}
                                                src={getImageUrl(movie.poster_url, { width: 340, quality: 75 })}
                                                rawSrc={getRawImageUrl(movie.poster_url)}
                                                alt={movie.name}
                                                fill
                                                priority={index < 3}
                                                loading={index < 3 ? "eager" : "lazy"}
                                                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 240px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500 transform-gpu"
                                            />

                                            {/* Bottom Gradient Scrim */}
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none z-10" />

                                            {/* Top Laurel / Curator Badge (Solid Zero-Blur) */}
                                            <div className="absolute top-2 left-2 z-20 pointer-events-none">
                                                <span className="h-5 px-2 bg-[#0F1115] border border-amber-400/60 rounded-lg text-amber-300 text-[9.5px] font-extrabold flex items-center justify-center shadow-sm">
                                                    {curatorBadge}
                                                </span>
                                            </div>



                                            {/* Solid Badges at Bottom */}
                                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 z-20 pointer-events-none">
                                                {movie.quality ? (
                                                    <span className="h-4.5 px-1.5 bg-[#FAD078] rounded text-amber-950 shadow-sm text-[9px] font-bold flex items-center justify-center leading-none">
                                                        {movie.quality}
                                                    </span>
                                                ) : <div />}
                                                {movie.episode_current && (
                                                    <span className="h-4.5 px-1.5 bg-[#A7F3D0] rounded text-emerald-950 shadow-sm text-[9px] font-bold flex items-center justify-center leading-none truncate max-w-[65%]">
                                                        {getEpisodeStatus(movie)}
                                                    </span>
                                                )}
                                            </div>
                                        </TransitionLink>

                                        {/* Movie Info (Fixed Height for zero layout shift) */}
                                        <div className="pt-2 space-y-1 flex flex-col justify-between">
                                            <div>
                                                <TransitionLink
                                                    href={`/phim/${movie.slug}`}
                                                    className="text-white text-xs sm:text-sm font-bold line-clamp-2 group-hover:text-amber-300 transition-colors leading-tight block h-[32px] sm:h-[36px]"
                                                    title={movie.name}
                                                >
                                                    {decodeHtml(movie.name)}
                                                </TransitionLink>
                                                <p className="text-white/40 text-[10px] sm:text-[11px] line-clamp-1 font-medium italic mt-0.5 h-[16px]">
                                                    <span title={movie.origin_name}>{decodeHtml(movie.origin_name)}</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-white/50 pt-0.5 h-[16px]">
                                                {movie.year && <span>{movie.year}</span>}
                                                {movie.year && <span>•</span>}
                                                <span className="text-amber-400/90 font-semibold truncate">
                                                    {((movie as any).lang_tag || movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                                                </span>
                                            </div>
                                        </div>
                                    </MoviePreviewWrapper>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    <SwiperNavButtons
                        prevClassName={`sw-prev-${navId}`}
                        nextClassName={`sw-next-${navId}`}
                    />
                </div>
            </div>
        </Container>
    );
}

export default memo(EditorChoiceRow);
