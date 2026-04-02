"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";

interface MoviePosterRowProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
}

export default function MoviePosterRow({ title, apiUrl, viewAllLink }: MoviePosterRowProps) {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navId = title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

    useEffect(() => {
        let isMounted = true;
        const fetchMovies = async (retryCount = 0) => {
            if (!isMounted) return;
            try {
                const response = await axios.get(`/api/proxy?url=${encodeURIComponent(apiUrl)}`);
                if (isMounted && (response.data?.status === "success" || response.data?.status === true) && response.data?.data?.items) {
                    const items: Movie[] = response.data.data.items;

                    // Lọc trùng theo Root Name (loại bỏ SS1, SS2, Phần 1, Phần 2...)
                    const filterSequels = (list: Movie[]) => {
                        const seen = new Set<string>();
                        return list.filter((movie) => {
                            const rootName = movie.name
                                .replace(/\s*\(?(Phần|P\.|Season|SS|Tập|Season|ss)\s*(\d+|Cuối|Đặc Biệt)\)?.*$/i, "")
                                .trim()
                                .toLowerCase();

                            if (seen.has(rootName)) return false;
                            seen.add(rootName);
                            return true;
                        });
                    };

                    const filtered = filterSequels(items);

                    // Sắp xếp và lấy 20 phim đầu tiên sau khi đã lọc trùng
                    const sortedItems = filtered.sort((a, b) => {
                        if ((b.year || 0) !== (a.year || 0)) {
                            return (b.year || 0) - (a.year || 0);
                        }
                        const timeA = a.modified?.time ? new Date(a.modified.time).getTime() : 0;
                        const timeB = b.modified?.time ? new Date(b.modified.time).getTime() : 0;
                        return timeB - timeA;
                    }).slice(0, 20);

                    setMovies(sortedItems);
                    setIsLoading(false);

                    // Làm giàu dữ liệu: Fetch theo đợt (chunks) để lấy episode_total - không chặn render
                    const enriched = [...sortedItems];
                    const chunkSize = 5;

                    for (let i = 0; i < sortedItems.length; i += chunkSize) {
                        const chunk = sortedItems.slice(i, i + chunkSize);
                        await Promise.all(
                            chunk.map(async (movie: Movie, chunkIdx: number) => {
                                const isMultiEpisode = ["series", "hoathinh", "tvshows"].includes(movie.type || "");
                                if (isMultiEpisode && !movie.episode_current?.includes("/")) {
                                    try {
                                        const detailRes = await axios.get(`/api/proxy?url=${encodeURIComponent(`https://phimapi.com/phim/${movie.slug}`)}`);
                                        if (detailRes.data?.movie?.episode_total) {
                                            const globalIdx = i + chunkIdx;
                                            enriched[globalIdx] = { ...enriched[globalIdx], episode_total: detailRes.data.movie.episode_total };
                                        }
                                    } catch (e) {
                                        console.error(`Lỗi tải detail cho ${movie.slug}:`, e);
                                    }
                                }
                            })
                        );
                        // Cập nhật state sau mỗi chunk
                        setMovies([...enriched]);
                        if (i + chunkSize < sortedItems.length) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                    return;
                } else if (isMounted) {
                    console.warn("MoviePosterRow: API returned invalid status or structure", response.data);
                }
            } catch (error: any) {
                if (isMounted) {
                    if (retryCount < 3 && (error.code === "ERR_NETWORK" || !error.response)) {
                        console.warn(`Thử lại MoviePosterRow lần ${retryCount + 1}...`);
                        setTimeout(() => fetchMovies(retryCount + 1), 1000 * (retryCount + 1));
                        return;
                    }
                    console.error("Lỗi khi tải phim:", error);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        fetchMovies();
        return () => { isMounted = false; };
    }, [apiUrl, navId]);

    if (isLoading) {
        return (
            <section className="relative z-30 w-full max-w-[1900px] mx-auto px-5 lg:px-12 mb-16 mt-8">
                <Skeleton width={200} height={32} className="mb-6 rounded" />
                <div className="flex gap-2.5 md:gap-4 lg:gap-[15px] overflow-hidden">
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-none w-[calc((100%-10px)/2)] sm:w-[calc((100%-13px*2)/3)] md:w-[calc((100%-13px*3)/4)] xl:w-[calc((100%-13px*5)/6)] 2xl:w-[calc((100%-15px*7)/8)]"
                        >
                            <Skeleton className="aspect-[2/3] rounded-2xl" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (movies.length === 0) return null;

    return (
        <section className="movie-row-section relative z-30 w-full max-w-[1900px] mx-auto px-5 lg:px-12 mb-8 md:mb-12 lg:mb-16 mt-8 [content-visibility:auto] [contain-intrinsic-size:500px]">
            <div className="row-header flex items-center justify-between mb-6">
                <h2 className="text-[20px] lg:text-[28px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-blue-100 to-white drop-shadow-sm flex items-center gap-4">
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

            <div className="row-content relative group/slider">
                <div className="cards-slide-wrapper">
                    <Swiper

                        navigation={{
                            nextEl: `.sw-next-${navId}`,
                            prevEl: `.sw-prev-${navId}`,
                        }}
                        modules={[Navigation]}
                        spaceBetween={10}
                        slidesPerView={2}
                        // slidesPerGroup={2} // Vuốt một lần 2 cái cũng được, hoặc để 1 cho mượt
                        breakpoints={{
                            576: { slidesPerView: 3, spaceBetween: 13 },
                            767: { slidesPerView: 4, spaceBetween: 13 },
                            // Laptop: Hiện 6 cái...
                            1200: { slidesPerView: 6, spaceBetween: 13 },
                            // Desktop: Hiện 7 cái...
                            1400: { slidesPerView: 7, spaceBetween: 15 },
                            // Màn hình lớn nhất: Hiện 8 cái... 
                            1536: { slidesPerView: 8, spaceBetween: 15 }
                        }}
                        className="swiper-carousel"
                    >
                        {movies.map((movie) => {
                            const posterImg = movie.poster_url?.startsWith("http")
                                ? movie.poster_url
                                : `https://phimimg.com/${movie.poster_url}`;

                            return (
                                <SwiperSlide key={movie._id}>
                                    <div className="sw-item group/item cursor-pointer [contain:layout]">
                                        <Link href="/" className="v-thumbnail relative block aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-white/5">
                                            {/* Poster Image */}
                                            <Image
                                                src={posterImg}
                                                alt={movie.name}
                                                fill
                                                sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
                                                className="object-cover transition-transform duration-500 group-hover/item:scale-110 transform-gpu will-change-transform"
                                            />

                                            {/* Bottom Gradient overlay */}
                                            <div className="absolute inset-x-0 bottom-[-1px] h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                                            {/* Badges: Quality, Language, Status */}
                                            <div className="pin-new absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5 px-2">
                                                {/* Badge Quality - Xám */}
                                                <div className="h-5 px-1 md:px-2 bg-white/30 backdrop-blur-md rounded-full text-white text-[8px] md:text-[9px] lg:text-[10px] lg:font-bold border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                                                    {movie.quality || "HD"}
                                                </div>

                                                {/* Badge Language - Xanh (Vietsub, LT, TM) */}
                                                <div className="h-5 px-1 md:px-2 bg-green-500/40 backdrop-blur-md rounded-full text-white text-[8px] md:text-[9px] lg:text-[10px] lg:font-bold border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                                                    {(movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                                                </div>

                                                {/* Badge Status - Cam (Full, Trailer, HT) */}
                                                <div className="h-5 px-1 md:px-2 bg-orange-500/60 backdrop-blur-md rounded-full text-white text-[8px] md:text-[9px] lg:text-[10px] lg:font-bold border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                                                    {(() => {
                                                        const cur = (movie.episode_current || "").toLowerCase();
                                                        if (cur.includes("trailer")) return "Trailer";

                                                        // Ưu tiên lấy dạng x/y (ví dụ 12/12) từ chuỗi (Hoàn Tất (12/12))
                                                        const matchSlash = movie.episode_current?.match(/(\d+)\/(\d+)/);
                                                        if (matchSlash) return `HT (${matchSlash[1]}/${matchSlash[2]})`;

                                                        if (cur.includes("full") || cur.includes("hoàn tất")) return "Full";

                                                        // Nếu chỉ có số (Tập 5)
                                                        const matchNum = movie.episode_current?.match(/\d+/);
                                                        if (matchNum) {
                                                            const num = matchNum[0];
                                                            // Sử dụng dữ liệu đã enriched từ detail API
                                                            const total = movie.episode_total || "??";
                                                            return `HT (${num}/${total})`;
                                                        }

                                                        return "Full";
                                                    })()}
                                                </div>
                                            </div>
                                        </Link>

                                        <div className="info text-center space-y-1">
                                            <h4 className="item-title text-white text-sm lg:text-base line-clamp-1 group-hover/item:text-blue-300 transition-colors">
                                                <Link href="/" title={movie.name}>{decodeHtml(movie.name)}</Link>
                                            </h4>
                                            <h4 className="alias-title text-white/40 text-xs line-clamp-1 font-medium">
                                                <Link href="/">{decodeHtml(movie.origin_name)}</Link>
                                            </h4>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    {/* Navigation Buttons */}
                    <button className={`hidden xl:block sw-button sw-prev sw-prev-${navId} absolute -left-6 lg:-left-12 top-[40%] -translate-y-1/2 z-40 text-white/50 hover:text-white transition-all disabled:opacity-0 cursor-pointer`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="47" height="47" fill="currentColor">
                            <path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s-12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"></path>
                        </svg>
                    </button>
                    <button className={`hidden xl:block sw-button sw-next sw-next-${navId} absolute -right-6 lg:-right-12 top-[40%] -translate-y-1/2 z-40 text-white/50 hover:text-white transition-all disabled:opacity-0 cursor-pointer`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="47" height="47" fill="currentColor">
                            <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .swiper-carousel .swiper-wrapper {
                    padding-bottom: 20px;
                    padding-top: 5px;
                }
            `}</style>
        </section>
    );
}
