"use client";

import TransitionLink from "@/app/components/Transition/TransitionLink";
import React, { useState, useEffect, memo } from "react";
import { Dices, Play } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import Container from "../Container";
import SmartImage from "../Common/SmartImage";
import axios from "axios";
import { filterDuplicateMovies, getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import Skeleton from "../Skeleton/Skeleton";

const MOODS = [
    { id: 'hanh-dong', title: 'Combat cháy máy', sub: 'Đánh đấm mãn nhãn', bgColor: 'bg-[#818cf8]' },
    { id: 'tinh-cam', title: 'Cẩu lương ngập mặt', sub: 'Ngọt hơn đường phèn', bgColor: 'bg-[#f472b6]' },
    { id: 'tam-ly', title: 'Thao túng tâm lý', sub: 'Xoắn não đêm khuya', bgColor: 'bg-[#60a5fa]' },
    { id: 'vo-thuat', title: 'Cước pháp phi phàm', sub: 'Đấm không trượt phát nào', bgColor: 'bg-[#4ade80]' },
    { id: 'gia-dinh', title: 'Trạm sạc chữa lành', sub: 'Khóc trôi muộn phiền', bgColor: 'bg-[#fb923c]' },
    { id: 'kinh-di', title: 'Đóng bỉm cày đêm', sub: 'Yếu tim xin tự trọng', bgColor: 'bg-[#38bdf8]' },
    { id: 'hai-huoc', title: 'Hệ tư tưởng tấu hài', sub: 'Cười văng cả hàm', bgColor: 'bg-[#fbbf24]' },
    { id: 'phieu-luu', title: 'Chạy trốn thực tại', sub: 'Đi vào dĩ vãng', bgColor: 'bg-[#22d3ee]' },
];

import RandomMovieRowSkeleton from "./RandomMovieRowSkeleton";

// Global cache for RandomMovieRow
let cachedRandomMovies: any[] = [];
let cachedMood: any = MOODS[0];
let hasFetchedOnce = false;

function RandomMovieRow() {
    const [selectedMood, setSelectedMood] = useState(cachedMood);
    const [movies, setMovies] = useState<any[]>(cachedRandomMovies);
    const [isLoading, setIsLoading] = useState(!hasFetchedOnce);
    const [moodSwiper, setMoodSwiper] = useState<any>(null);

    const fetchMoviesByMood = async (moodId: string) => {
        setIsLoading(true);
        try {
            const p1 = Math.floor(Math.random() * 10) + 1;
            const p2 = Math.floor(Math.random() * 10) + 1;
            const p3 = Math.floor(Math.random() * 10) + 1;
            const p4 = Math.floor(Math.random() * 10) + 1;

            const urls = [
                `/api/proxy?url=${encodeURIComponent(`https://phimapi.com/v1/api/the-loai/${moodId}?page=${p1}`)}&revalidate=30`,
                `/api/proxy?url=${encodeURIComponent(`https://phimapi.com/v1/api/the-loai/${moodId}?page=${p2}`)}&revalidate=30`,
                `/api/proxy?url=${encodeURIComponent(`https://phimapi.com/v1/api/the-loai/${moodId}?page=${p3}`)}&revalidate=30`,
                `/api/proxy?url=${encodeURIComponent(`https://phimapi.com/v1/api/the-loai/${moodId}?page=${p4}`)}&revalidate=30`
            ];

            const pageResponses = await Promise.allSettled(urls.map(url => axios.get(url)));
            const allMovies = pageResponses
                .filter((res): res is PromiseFulfilledResult<any> => res.status === 'fulfilled')
                .flatMap(res => res.value.data?.data?.items || []);

            if (allMovies.length === 0) {
                setMovies([]);
                return;
            }

            const uniqueMovies = filterDuplicateMovies(allMovies);
            for (let i = uniqueMovies.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [uniqueMovies[i], uniqueMovies[j]] = [uniqueMovies[j], uniqueMovies[i]];
            }

            const finalMovies = uniqueMovies.slice(0, 24);
            
            // Update cache
            cachedRandomMovies = finalMovies;
            cachedMood = MOODS.find(m => m.id === moodId) || MOODS[0];
            hasFetchedOnce = true;
            
            setMovies(finalMovies);
        } catch (error) {
            console.error("Lỗi fetch movies theo mood:", error);
            setMovies([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if we haven't fetched yet OR if the mood changed manually
        if (!hasFetchedOnce || selectedMood.id !== cachedMood.id) {
            fetchMoviesByMood(selectedMood.id);
        }
        
        if (moodSwiper) {
            const index = MOODS.findIndex(m => m.id === selectedMood.id);
            moodSwiper.slideTo(index);
        }
    }, [selectedMood, moodSwiper]);

    const handleRandomMood = () => {
        const otherMoods = MOODS.filter(m => m.id !== selectedMood.id);
        const random = otherMoods[Math.floor(Math.random() * otherMoods.length)];
        setSelectedMood(random);
    };

    if (isLoading && movies.length === 0) {
        return <RandomMovieRowSkeleton />;
    }

    return (
        <Container as="section" className="relative z-30 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-5">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold md:text-xl tracking-widest uppercase relative italic text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-100 to-white drop-shadow-sm">
                        Tâm Trạng Của Bạn
                        <div className="absolute -bottom-[21px] left-0 w-full h-0.5 bg-gradient-to-r from-purple-200 to-transparent opacity-70" />
                    </h3>
                </div>
                <button
                    onClick={handleRandomMood}
                    className="w-10 h-10 flex cursor-pointer items-center justify-center bg-gradient-to-br from-[#C6ADE8] to-[#9474cc] text-white rounded-full transition-all duration-500 group shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[#C6ADE8]/50 z-10"
                    title="Ngẫu nhiên tâm trạng"
                >
                    <Dices size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
            </div>

            {/* Mood Tabs Swiper */}
            <div className="mb-6">
                <Swiper
                    onSwiper={setMoodSwiper}
                    spaceBetween={10}
                    slidesPerView={2.5}
                    slidesOffsetBefore={4}
                    slidesOffsetAfter={4}
                    breakpoints={{
                        640: { slidesPerView: 3.3, spaceBetween: 12 },
                        768: { slidesPerView: 4.2, spaceBetween: 14 },
                        1280: { slidesPerView: 5.2, spaceBetween: 16 },
                        1480: { slidesPerView: 6.2, spaceBetween: 16 },
                    }}
                    className="rounded-xl overflow-visible"
                >
                    {MOODS.map((mood) => (
                        <SwiperSlide key={mood.id} className="pt-2 pb-2">
                            <button
                                onClick={() => setSelectedMood(mood)}
                                className={`w-full group relative rounded-xl p-3 md:p-5 text-left transition-all duration-300 border-2 cursor-pointer hover:-translate-y-2 min-h-[95px] md:min-h-[115px] flex flex-col justify-between ${selectedMood.id === mood.id
                                    ? `${mood.bgColor} border-white shadow-[0_10px_25px_rgba(0,0,0,0.3)] scale-[1.02] z-20`
                                    : `border-white/10 ${mood.bgColor} hover:scale-[1.01] shadow-md opacity-90 hover:opacity-100 z-10`
                                    }`}
                            >
                                <h3 className="text-sm lg:text-lg font-bold text-white leading-tight uppercase tracking-wide drop-shadow-sm">
                                    {mood.title}
                                </h3>
                                <p className="text-[10px] lg:text-[12px] text-white/90 font-semibold italic line-clamp-1">
                                    {mood.sub}
                                </p>
                            </button>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* Movies Swiper */}
            <div className="relative ">
                {isLoading ? (
                    <div key="loading" className="w-full animate-fade-in">
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={2.5}
                            breakpoints={{
                                640: { slidesPerView: 3.5, spaceBetween: 12 },
                                768: { slidesPerView: 4.5, spaceBetween: 14 },
                                1024: { slidesPerView: 6.5, spaceBetween: 14 },
                                1280: { slidesPerView: 8.5, spaceBetween: 16 },
                                1536: { slidesPerView: 10.5, spaceBetween: 16 },
                            }}
                        >
                            {[...Array(12)].map((_, i) => (
                                <SwiperSlide key={i}>
                                    <Skeleton className="aspect-[2/3]" rounded="lg" />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                ) : movies.length > 0 ? (
                    <div key={selectedMood.id} className="animate-scale-in">
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={2.5}
                            breakpoints={{
                                640: { slidesPerView: 3.5, spaceBetween: 12 },
                                768: { slidesPerView: 4.5, spaceBetween: 14 },
                                1024: { slidesPerView: 6.5, spaceBetween: 14 },
                                1280: { slidesPerView: 8.5, spaceBetween: 16 },
                                1536: { slidesPerView: 10.5, spaceBetween: 16 },
                            }}
                            className="rounded-xl overflow-visible"
                        >
                            {movies.map((movie, index) => {
                                const imgUrl = getImageUrl(movie.poster_url || movie.thumb_url, { width: 180, quality: 70 });
                                const isPriority = index < 10;

                                return (
                                    <SwiperSlide key={movie._id}>
                                        <TransitionLink
                                            href={`/phim/${movie.slug}`}
                                            className="group relative block cursor-pointer rounded-lg overflow-hidden bg-[#0a1628] active:scale-95 transition-all"
                                        >
                                            <div className="relative aspect-[2/3]">
                                                <SmartImage
                                                    src={imgUrl}
                                                    rawSrc={getRawImageUrl(movie.poster_url || movie.thumb_url)}
                                                    alt={movie.name}
                                                    fill
                                                    priority={isPriority}
                                                    loading={isPriority ? "eager" : "lazy"}
                                                    sizes="(max-width: 640px) 120px, (max-width: 1024px) 180px, 220px"
                                                    className="object-cover transition-opacity duration-300 group-hover:opacity-60"
                                                />

                                                <div className="absolute inset-x-0 bottom-0 h-1/2 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                                                    <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent absolute inset-0 pointer-events-none" />

                                                    <div className="relative z-10">
                                                        <h5 className="text-white text-[11px] font-bold mb-0.5 line-clamp-1 uppercase tracking-tight leading-tight">{movie.name}</h5>
                                                        <p className="text-[9px] text-white/50 mb-2 line-clamp-1 italic">{movie.origin_name}</p>

                                                        <div className="inline-flex items-center gap-1 bg-amber-500 text-[#0a1628] text-[8px] font-black py-1 px-2 rounded-sm uppercase tracking-tighter translate-y-2 group-hover:translate-y-0 transition-transform duration-500 border border-amber-600/30">
                                                            <Play size={8} fill="currentColor" /> Xem
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TransitionLink>
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    </div>
                ) : (
                    <div key="empty" className="flex flex-col items-center justify-center py-20 text-white/40 animate-fade-in">
                        <p className="italic text-sm">Hiện chưa có phim nào cho tâm trạng này, hãy thử cái khác nhé!</p>
                    </div>
                )}
            </div>
        </Container>
    );
}

export default memo(RandomMovieRow);
