"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { filterDuplicateMovies, getImageUrl } from "@/app/utils/movieUtils";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";

interface FeaturedSliderProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    navId?: string;
}

export default function FeaturedSlider({ title, apiUrl, viewAllLink, navId = "featured-slider" }: FeaturedSliderProps) {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                // Lấy danh sách phim từ apiUrl được truyền vào thông qua proxy để tránh CORS
                const res = await axios.get(`/api/proxy?url=${encodeURIComponent(apiUrl)}`);
                if (res.data?.status === "success" || res.data?.status === true) {
                    const items: Movie[] = res.data.data.items || [];

                    const filtered = filterDuplicateMovies(items);

                    // Lấy chi tiết cho tối đa 10 phim sau khi đã lọc trùng
                    const detailed = await Promise.all(
                        filtered.slice(0, 10).map(async (movie: any) => {
                            try {
                                const detail = await axios.get(`/api/proxy?url=${encodeURIComponent(`https://phimapi.com/phim/${movie.slug}`)}`);
                                return { ...movie, ...detail.data.movie };
                            } catch (e) {
                                return movie;
                            }
                        })
                    );
                    setMovies(detailed);
                }
            } catch (error) {
                console.error("Lỗi tải featured slider:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeatured();
    }, [apiUrl, navId]);

    if (isLoading) {
        return (
            <section className="relative w-full max-w-[1900px] mx-auto px-5 lg:px-12 md:my-12 my-8 lg:my-16">
                <Skeleton width={300} height={35} className="mb-6 rounded" />
                <div className="relative aspect-[21/9] rounded-3xl overflow-hidden">
                    <Skeleton className="w-full h-full" />
                    <div className="absolute bottom-0 left-0 p-8 lg:p-12 w-full max-w-2xl">
                        <Skeleton height={40} width="80%" className="mb-4" />
                        <Skeleton count={3} className="mb-2" />
                    </div>
                </div>
            </section>
        );
    }

    if (movies.length === 0) return null;

    return (
        <section className="relative w-full max-w-[1900px] mx-auto px-5 lg:px-12 my-16">
            <div className="row-header flex items-center justify-between mb-6">
                <h2 className="text-[20px] lg:text-[28px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r from-green-200 via-green-100 to-white drop-shadow-sm flex items-center gap-4">
                    {title}
                    <Link
                        href="/"
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
                    </Link>
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
                                    <Image
                                        src={getImageUrl(movie.thumb_url)}
                                        alt={movie.name}
                                        fill
                                        priority={index === 0}
                                        sizes="100vw"
                                        className="object-cover object-top"
                                    />
                                </div>

                                {/* Separate Overlay to stay fixed while image moves */}
                                <div className="absolute inset-0 bg-gradient-to-t xl:bg-gradient-to-r from-[#14233E] via-[#14233E] via-[30%] to-transparent z-10 pointer-events-none" />

                                {/* Content Area */}
                                <div className="relative z-20 w-full xl:w-[60%] h-full flex items-end xl:items-center pt-30 xl:pt-0 px-5 md:px-10 lg:pb-30 xl:pb-0 text-left">
                                    <div className="lg:max-w-lg xl:max-w-2xl w-full space-y-4 lg:space-y-5">
                                        <div className="space-y-1">
                                            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white group-hover:text-[#f5a623] transition-colors line-clamp-1 [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)]">
                                                <Link href={`/`}>
                                                    {decodeHtml(movie.name)}
                                                </Link>
                                            </h3>
                                            <p className="text-sm md:text-base font-medium text-white/70 italic line-clamp-1 mt-1 [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)]">
                                                {decodeHtml(movie.origin_name)}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="md:px-2 px-1 py-0.5 flex items-center justify-center bg-[#f5a623] text-[#0a1628] text-[10px] md:text-xs font-bold rounded">
                                                ★ {(movie.tmdb?.vote_average || 8.0).toFixed(1)}
                                            </div>
                                            <div className="md:px-2 flex items-center justify-center px-1 py-0.5 bg-white/10 text-white/80 text-[10px] md:text-xs rounded">
                                                {movie.year || 2024}
                                            </div>
                                            <div className="md:px-2 flex items-center justify-center px-1 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] md:text-xs rounded border border-blue-500/20">
                                                {movie.episode_current || "Full HD"}
                                            </div>

                                            <div className="flex gap-2 ml-2 pl-4 border-l border-white/10">
                                                {movie.category?.slice(0, 3).map((cat: any) => (
                                                    <Link
                                                        key={cat.id}
                                                        href={`/`}
                                                        className="px-2 flex items-center justify-center py-0.5 text-[11px] text-white/40 border border-white/10 rounded hover:border-[#f5a623]/60 hover:text-[#f5a623] transition-colors"
                                                    >
                                                        {cat.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="xl:mb-auto mb-0 min-h-[40px] md:min-h-[48px] flex items-center">
                                            <p className="text-white/70 text-xs md:text-sm leading-relaxed line-clamp-2">
                                                {cleanContent(movie.content) || "Nội dung phim đang được cập nhật..."}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6 pt-4">
                                            <Link
                                                href={`/`}
                                                className="relative hidden lg:flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#f5a623] to-[#ffcc33] text-[#0a1628] shadow-[0_4px_15px_rgba(245,166,35,0.4)] ring-4 ring-[#f5a623]/20 hover:shadow-[0_0_30px_rgba(245,166,35,0.8)] hover:scale-110 active:scale-95 transition-all duration-300"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="20" height="20" fill="currentColor" className="ml-1 relative z-10">
                                                    <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
                                                </svg>
                                            </Link>

                                            <Link
                                                href={`/`}
                                                className="lg:block hidden px-8 py-3 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-colors duration-300 border border-white/10 shadow-xl"
                                            >
                                                Chi tiết phim
                                            </Link>
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
                                    <Image
                                        src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                        alt={movie.name}
                                        fill
                                        sizes="100px"
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
        </section>
    );
}
