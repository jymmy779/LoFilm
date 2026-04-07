"use client";

import { useEffect, useState } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { filterDuplicateMovies, getImageUrl } from "@/app/utils/movieUtils";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import Container from "@/app/components/Container";

interface MovieRowProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    initialMovies?: Movie[];
}

import { useAdTrigger } from "@/app/hooks/useAdTrigger";

export default function MovieRow({ title, apiUrl, viewAllLink, initialMovies }: MovieRowProps) {
    const { triggerAd } = useAdTrigger();
    const seeded = !!(initialMovies && initialMovies.length > 0);
    const [movies, setMovies] = useState<Movie[]>(() => initialMovies ?? []);
    const [isLoading, setIsLoading] = useState(!seeded);

    const handleMovieRowClick = (e: React.MouseEvent, movieSlug: string) => {
        if (e.metaKey || e.ctrlKey || (e.button && e.button === 1)) return;
        e.preventDefault();
        triggerAd(`/phim/${movieSlug}`, "movie_row");
    };

    useEffect(() => {
        if (seeded) return;

        const fetchMovies = async () => {
            try {
                const response = await axios.get(`/api/proxy?url=${encodeURIComponent(apiUrl)}`);
                if (response.data?.status === "success" && response.data?.data?.items) {
                    const items: Movie[] = response.data.data.items;

                    const filtered = filterDuplicateMovies(items);
                    setMovies(filtered);
                }
            } catch (error) {
                console.error("Lỗi khi tải phim:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMovies();
    }, [apiUrl, title, seeded]);

    if (isLoading) {
        return (
            <Container as="section" className="relative z-30 mb-16 mt-8">
                <div className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-black/30 p-4 md:p-6 lg:p-8 rounded-2xl border border-white/5 overflow-hidden">
                    {/* Left title area skeleton */}
                    <div className="w-full xl:w-[260px] xl:flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                        <Skeleton height={40} width={200} />
                        <Skeleton height={20} width={100} />
                    </div>

                    {/* Right slide area skeleton */}
                    <div className="flex gap-2 sm:gap-3 md:gap-3.5 lg:gap-4 overflow-hidden">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex-none w-[160px] sm:w-[200px] md:w-[240px] lg:w-[280px]">
                                <Skeleton className="aspect-video rounded-lg mb-3" />
                                <Skeleton height={18} className="mb-2" />
                                <Skeleton height={12} width="60%" />
                            </div>
                        ))}
                    </div>
                </div>
            </Container>
        );
    }

    if (movies.length === 0) return null;

    // Tự động phân tách tiêu đề thành 2 dòng cho đẹp giống bản thiết kế mẫu (nếu tiêu đề dài)
    const splitTitle = () => {
        const words = title.split(" ");
        if (words.length > 2) {
            const mid = Math.ceil(words.length / 2);
            return (
                <>
                    {words.slice(0, mid).join(" ")}
                    {/* Chỉ xuống dòng khi màn hình từ xl trở lên (khi title nằm ở cột bên trái) */}
                    <span className="hidden xl:inline"><br /></span>
                    {" "}{words.slice(mid).join(" ")}
                </>
            );
        }
        return title;
    };

    return (
        <Container as="section" className="relative z-30 mb-8 md:mb-12 lg:mb-16 mt-8">
            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-black/30 p-4 md:p-6 lg:p-8 rounded-2xl border border-white/5">

                {/* === LEFT SIDE: TITLE & LINK === */}
                <div className="w-full xl:w-[260px] xl:flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                    <h2 className="text-[20px] lg:text-[28px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-pink-100 to-white drop-shadow-sm">
                        {splitTitle()}
                    </h2>

                    <TransitionLink
                        href={viewAllLink}
                        className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm tracking-wider w-max md:mt-2"
                    >
                        <span className="md:block hidden">Xem toàn bộ</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="12" height="12" fill="currentColor">
                            <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                        </svg>
                    </TransitionLink>
                </div>

                {/* === RIGHT SIDE: SWIPER === */}
                <div className="w-full xl:w-[calc(100%-292px)] relative group/slider">
                    <Swiper
                        modules={[Navigation]}
                        slidesPerView={"auto"}
                        spaceBetween={8}
                        breakpoints={
                            {
                                1280: { spaceBetween: 16 },
                                767: { spaceBetween: 14 },
                                576: { spaceBetween: 12 },
                            }
                        }
                        navigation={{
                            nextEl: `.btn-next-${title.replace(/\s+/g, '-').toLowerCase()}`,
                            prevEl: `.btn-prev-${title.replace(/\s+/g, '-').toLowerCase()}`,
                        }}
                        className="swiper-carousel"
                    >
                        {movies.map((movie, index) => {
                            const imgUrl = getImageUrl(movie.thumb_url, { width: 300, quality: 75 });
                            // Chỉ load trước 3 ảnh đầu để đảm bảo Speed Index tốt (nhất là mobile chỉ thấy 1.5-2 card)
                            const eager = index < 3;

                            return (
                                <SwiperSlide key={movie._id} className="!w-[160px] sm:!w-[200px] md:!w-[240px] lg:!w-[280px]">
                                    <div 
                                        onClick={(e) => handleMovieRowClick(e, movie.slug)} 
                                        className="block group/item cursor-pointer"
                                    >
                                        <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 mb-3">
                                            <Image
                                                src={imgUrl}
                                                alt={movie.name}
                                                fill
                                                priority={eager}
                                                loading={eager ? "eager" : "lazy"}
                                                sizes="(max-width: 768px) 160px, (max-width: 1024px) 240px, 280px"
                                                className="object-cover transition-transform duration-500 group-hover/item:scale-110"
                                            />
                                            <div className="absolute inset-x-0 bottom-[-1] h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                                            {movie.episode_current && (
                                                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-white/30 rounded border border-white/20">
                                                    <span className="text-[8px] md:text-xs md:font-semibold text-white truncate max-w-[120px] block">
                                                        {movie.episode_current}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-white md:text-left text-center font-medium text-xs md:text-sm line-clamp-1 group-hover/item:text-pink-300 transition-colors">
                                                {decodeHtml(movie.name)}
                                            </h3>
                                            <p className="text-white/50 text-[10px] md:text-left text-center md:text-xs line-clamp-1">
                                                {decodeHtml(movie.origin_name)}
                                            </p>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    {/* Mũi tên Custom Navigation */}
                    <button className={`btn-prev-${title.replace(/\s+/g, '-').toLowerCase()} absolute left-0 md:-left-4 top-1/2 -translate-y-[calc(50%+24px)] z-10 w-10 h-10 rounded-full bg-white cursor-pointer text-black shadow-lg hidden lg:flex items-center justify-center opacity-100 transition-opacity disabled:opacity-0 disabled:pointer-events-none`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="16" height="16" fill="currentColor">
                            <path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"></path>
                        </svg>
                    </button>
                    <button className={`btn-next-${title.replace(/\s+/g, '-').toLowerCase()} absolute right-0 md:-right-4 top-1/2 -translate-y-[calc(50%+24px)] z-10 w-10 h-10 rounded-full bg-white cursor-pointer text-black shadow-lg hidden lg:flex items-center justify-center opacity-100 transition-opacity disabled:opacity-0 disabled:pointer-events-none`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="16" height="16" fill="currentColor">
                            <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                        </svg>
                    </button>

                </div>
            </div>
        </Container>
    );
}
