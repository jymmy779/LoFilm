"use client";

import { useEffect, useState, memo } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import "swiper/css/thumbs";

import { Movie } from "@/app/types/movie";
import { decodeHtml, cleanContent } from "@/app/utils/textUtils";
import { filterDuplicateMovies, getImageUrl, getRawImageUrl, getEpisodeStatus } from "@/app/utils/movieUtils";

import SmartImage from "@/app/components/Common/SmartImage";
import FavoriteButton from "@/app/components/Common/FavoriteButton";
import Container from "@/app/components/Container";
import { enrichMoviesMetadata } from "@/app/utils/enrichmentUtils";

interface FeaturedSliderProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    navId?: string;
    initialMovies?: Movie[];
}



import FeaturedSliderSkeleton from "./FeaturedSliderSkeleton";

function FeaturedSlider({ title, apiUrl, viewAllLink, navId = "featured-slider", initialMovies }: FeaturedSliderProps) {

    const seeded = !!(initialMovies && initialMovies.length > 0);
    const [movies, setMovies] = useState<Movie[]>(() => initialMovies ?? []);
    const [isLoading, setIsLoading] = useState(!seeded);
    const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

    const enrichDetails = (slice: Movie[]) => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        void enrichMoviesMetadata({
            items: slice,
            setItems: setMovies,
            isMounted: () => true, // FeaturedSlider wraps with memo, safe enough
            chunkSize: isMobile ? 2 : 5,
            delay: isMobile ? 300 : 50
        });
    };

    useEffect(() => {
        if (seeded) {
            setIsLoading(false);
            enrichDetails(initialMovies!);
            return;
        }

        const fetchFeatured = async () => {
            try {
                const res = await axios.get(`/api/proxy?url=${encodeURIComponent(apiUrl)}`);
                if (res.data?.status === "success" || res.data?.status === true) {
                    const items: Movie[] = res.data.data.items || [];

                    const filtered = filterDuplicateMovies(items);
                    const slice = filtered.slice(0, 10);

                    setMovies(slice);
                    setIsLoading(false);
                    enrichDetails(slice);
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Lỗi tải featured slider:", error);
                setIsLoading(false);
            }
        };

        fetchFeatured();
    }, [apiUrl, navId, seeded]);

    if (isLoading) {
        return <FeaturedSliderSkeleton />;
    }

    if (movies.length === 0) return null;

    return (
        <Container as="section" className="relative mb-8 md:mb-12 lg:mb-16 mt-8 animate-fade-in">
            <div className="row-header flex items-center justify-between mb-6">
                <h2 className="text-[20px] lg:text-[28px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r from-green-200 via-green-100 to-white drop-shadow-sm flex items-center gap-4">
                    {title}
                    <TransitionLink
                        href={viewAllLink || "/"}
                        className="group/more flex items-center justify-center bg-[#1a1c23] border border-white/10 rounded-full h-8 w-8 lg:h-10 lg:w-10 transition-all duration-500 hover:border-[#f1c40f]/50 hover:w-[110px] lg:hover:w-[130px] overflow-hidden"
                    >
                        <span className="max-w-0 overflow-hidden whitespace-nowrap text-[#f1c40f] text-[10px] lg:text-xs font-medium transition-all duration-500 group-hover/more:max-w-[80px] group-hover/more:mr-2 leading-none opacity-0 group-hover/more:opacity-100">
                            Xem thêm
                        </span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 320 512"
                            width="10"
                            height="10"
                            fill="currentColor"
                            className="text-[#f1c40f] transform transition-transform duration-300 group-hover/more:translate-x-0.5 flex-shrink-0"
                        >
                            <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                        </svg>
                    </TransitionLink>
                </h2>
            </div>

            <div className="relative mb-42 group">
                <Swiper
                    modules={[Autoplay, Navigation, Pagination, EffectFade, Thumbs]}
                    effect="fade"
                    fadeEffect={{ crossFade: true }}
                    loop={true}
                    autoplay={{ delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: false }}
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                    className="featured-section-slider rounded-[30px] overflow-hidden shadow-2xl"
                >
                    {movies.map((movie, index) => (
                        <SwiperSlide key={movie._id}>
                            <div className="relative w-full aspect-[21/9] md:aspect-[21/7] lg:aspect-[21/6] xl:aspect-[21/5] min-h-[500px] bg-[#14233E]">

                                {/* Background Image Area */}
                                <div className="absolute top-0 right-0 w-full xl:w-[75%] h-full z-0 select-none pointer-events-none">
                                    <SmartImage
                                        src={getImageUrl(movie.thumb_url, { width: 1920, quality: index === 0 ? 80 : 75 })}
                                        rawSrc={getRawImageUrl(movie.thumb_url)}
                                        alt={movie.name}
                                        fill
                                        priority={index === 0}
                                        loading={index === 0 ? "eager" : "lazy"}
                                        fetchPriority={index === 0 ? "high" : "auto"}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                                        className="object-cover object-top"
                                    />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.35)_0.8px,transparent_0.8px)] [background-size:3px_3px] opacity-30 z-10 pointer-events-none" />
                                </div>

                                {/* Separate Overlay to stay fixed while image moves */}
                                <div className="absolute inset-0 bg-gradient-to-t xl:bg-gradient-to-r from-[#14233E] via-[#14233E] via-[30%] to-transparent z-10 pointer-events-none" />

                                {/* Content Area */}
                                <div className="relative z-20 w-full xl:w-[60%] h-full flex items-end xl:items-center pt-30 xl:pt-0 px-5 md:px-10 lg:pb-30 xl:pb-0 text-left">
                                    <div className=" lg:max-w-lg xl:max-w-2xl xl:mb-0 mb-[20px] w-full space-y-4 lg:space-y-5">
                                        <div className="space-y-1">
                                            <TransitionLink
                                                href={`/phim/${movie.slug}`}
                                                className="text-xl md:text-2xl lg:text-3xl font-bold text-white group-hover:text-[#f5a623] transition-colors line-clamp-1 [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)] cursor-pointer"
                                            >
                                                {movie.name}
                                            </TransitionLink>
                                            <p className="text-sm md:text-base font-medium text-white/70 italic line-clamp-1 mt-1 [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)]">
                                                {movie.origin_name}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="md:px-2 px-1.5 py-0.5 flex items-center justify-center bg-[#f5a623] text-[#0a1628] text-[10px] md:text-xs font-bold rounded shadow-[0_2px_10px_rgba(245,166,35,0.3)]">
                                                ★ {(movie.tmdb?.vote_average || 8.0).toFixed(1)}
                                            </div>
                                            <div className="md:px-2 px-1.5 py-0.5 flex items-center justify-center bg-white/10 backdrop-blur-md text-white/90 text-[10px] md:text-xs font-bold rounded border border-white/20 leading-none">
                                                {movie.year || 2024}
                                            </div>
                                            <div className="md:px-2 px-1.5 py-0.5 flex items-center justify-center bg-blue-500/20 backdrop-blur-md text-blue-200 text-[10px] md:text-xs font-bold rounded border border-blue-400/30 leading-none">
                                                {getEpisodeStatus(movie)}
                                            </div>

                                            <div className="flex flex-wrap gap-2 w-full pt-1">
                                                {movie.category?.slice(0, 3).map((cat: any) => (
                                                    <TransitionLink
                                                        key={cat.id || cat.slug}
                                                        href={`/the-loai/${cat.slug}`}
                                                        className="px-2.5 py-1 text-[10px] lg:text-xs font-medium flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10 hover:border-[#f5a623]/50 hover:text-[#f5a623] rounded-md transition-all"
                                                    >
                                                        {cat.name}
                                                    </TransitionLink>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="xl:mb-auto mb-0 min-h-[40px] md:min-h-[48px] flex items-center">
                                            <p className="text-white/70 text-xs md:text-sm leading-relaxed line-clamp-2">
                                                {cleanContent(movie.content) || "Nội dung phim đang được cập nhật..."}
                                            </p>
                                        </div>

                                        <div className="hidden lg:flex items-center gap-8 pt-4">
                                            <TransitionLink
                                                href={`/phim/${movie.slug}`}
                                                className="relative hidden lg:flex items-center justify-center w-10 h-10 md:w-12 md:h-12 lg:w-15 lg:h-15 rounded-full bg-gradient-to-tr from-[#f5a623] to-[#ffcc33] text-[#0a1628] ring-4 ring-[#f5a623]/20 shadow-[0_4px_15px_rgba(245,166,35,0.4)] hover:shadow-[0_0_30px_rgba(245,166,35,0.8)] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="20" height="20" fill="currentColor" className="ml-1 relative z-10">
                                                    <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
                                                </svg>
                                            </TransitionLink>

                                            <div className="flex items-center bg-white/10 hover:bg-white/20 rounded-full border border-white/10 overflow-hidden transition-all duration-300">
                                                <FavoriteButton
                                                    movie={movie}
                                                    iconSize={18}
                                                    className="p-3 px-5 h-full border-r border-white/10 hover:bg-white/5 transition-colors"
                                                />
                                                <TransitionLink
                                                    href={`/phim/${movie.slug}`}
                                                    className="p-3 px-7 h-full flex items-center justify-center text-white cursor-pointer hover:text-[#f5a623] transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="18" height="18" fill="currentColor">
                                                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
                                                    </svg>
                                                </TransitionLink>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Thumbnail Slider Overlapping */}
                <div className="featured-thumbs-container absolute -bottom-10 lg:bottom-15 xl:bottom-0 left-1/2 lg:left-[390px] xl:left-1/2 -translate-x-1/2 translate-y-1/2 z-40 w-full lg:max-w-3xl xl:max-w-7xl px-4 pointer-events-auto">
                    <Swiper
                        onSwiper={setThumbsSwiper}
                        loop={false}
                        spaceBetween={20}
                        slidesPerView={"auto"}
                        watchSlidesProgress={true}
                        breakpoints={{
                            1024: { slidesPerView: 10, spaceBetween: 20 }
                        }}
                        freeMode={false}
                        modules={[Navigation, Thumbs]}
                        className="featured-thumbs-slider !px-1"
                    >
                        {movies.map((movie) => (
                            <SwiperSlide key={`thumb-${movie._id}`} className="cursor-pointer flex items-center justify-center lg:block">
                                <div className="thumb-item flex-shrink-0 transition-[width,height,background-color,border-color] duration-300 relative w-2.5 h-2.5 lg:w-full lg:h-auto aspect-square xl:aspect-[2/3] rounded-full xl:rounded-lg overflow-hidden lg:border-2 border-transparent lg:shadow-md bg-white/70 lg:bg-transparent">
                                    <SmartImage
                                        src={getImageUrl(movie.poster_url || movie.thumb_url, { width: 120, quality: 70 })}
                                        rawSrc={getRawImageUrl(movie.poster_url || movie.thumb_url)}
                                        alt={movie.name}
                                        fill
                                        sizes="100px"
                                        loading="lazy"
                                        className="hidden lg:block object-cover"
                                    />
                                    <div className="thumb-overlay absolute inset-0 bg-black/40 lg:bg-black/30 transition-opacity duration-300"></div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>

            <style jsx global>{`
                /* Dưới 1024px: Swiper Slide chỉ rộng bằng dấu chấm */
                @media (max-width: 1023px) {
                    .featured-thumbs-slider .swiper-slide {
                        width: auto !important;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    /* Điều chỉnh container (.swiper-wrapper) tập trung các chấm vào giữa */
                    .featured-thumbs-slider .swiper-wrapper {
                        justify-content: center;
                        align-items: center;
                    }
                    /* Chấm active trên mobile to ra một xíu mà không bị méo */
                    .featured-thumbs-slider .swiper-slide-thumb-active .thumb-item {
                        width: 12px !important;
                        height: 12px !important;
                        background-color: #f5a623;
                        transform: none !important;
                    }
                }

                /* Dưới 1024px: Active biến thành chấm phát sáng (Dự phòng) */
                /* Dot color for inactive state - brighter white/gray */
                .featured-thumbs-slider .thumb-item {
                    opacity: 1 !important;
                    background-color: rgba(255, 255, 255, 1);
                }

                /* Active dot color - must be below to override */
                .featured-thumbs-slider .swiper-slide-thumb-active .thumb-item {
                    background-color: #f5a623 !important;
                    transform: scale(1.1);
                }
                
                /* Overlay mặc định mờ mờ, khi Active hoặc Hover mới biến mất */
                .featured-thumbs-slider .thumb-overlay {
                    opacity: 1;
                    transition: opacity 0.3s ease;
                }

                .featured-thumbs-slider .swiper-slide-thumb-active .thumb-overlay,
                .featured-thumbs-slider .swiper-slide:hover .thumb-overlay {
                    opacity: 0 !important;
                }
                
                /* Từ 1024px trở lên: Giữ nguyên y hệt code của bạn */
                @media (min-width: 1024px) {
                    .featured-thumbs-slider .thumb-item:hover {
                        border-color: rgba(255, 255, 255, 0.4);
                    }
                    .featured-thumbs-slider .swiper-slide-thumb-active .thumb-item {
                        border-color: #f5a623;
                        background-color: transparent;
                        transform: none;
                        z-index: 10;
                    }
                    .featured-thumbs-slider .swiper-slide-thumb-active .thumb-overlay {
                        opacity: 0;
                    }
                }
            `}</style>
        </Container>
    );
}

export default memo(FeaturedSlider);
