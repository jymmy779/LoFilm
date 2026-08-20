"use client";

import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import React, { useState, useEffect, memo, useRef } from "react";
import { Dices, Play, Sparkles } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Virtual, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import Container from "../../UI/Container";
import SmartImage from "../../UI/Common/SmartImage";
import axios from "axios";
import { filterDuplicateMovies, getEpisodeStatus, getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import { getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";
import { decodeHtml } from "@/app/utils/textUtils";
import RandomMovieRowSkeleton from "./RandomMovieRowSkeleton";
import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

const MOODS = [
    { id: 'hanh-dong', emoji: '💥', title: 'Combat cháy máy', sub: 'Đánh đấm mãn nhãn', gradient: 'from-[#4338CA] to-[#312E81]' },
    { id: 'tinh-cam', emoji: '💖', title: 'Cẩu lương ngập mặt', sub: 'Ngọt hơn đường phèn', gradient: 'from-[#BE185D] to-[#831843]' },
    { id: 'tam-ly', emoji: '🧠', title: 'Thao túng tâm lý', sub: 'Xoắn não đêm khuya', gradient: 'from-[#1D4ED8] to-[#1E3A8A]' },
    { id: 'vo-thuat', emoji: '🥋', title: 'Cước pháp phi phàm', sub: 'Đấm không trượt phát nào', gradient: 'from-[#047857] to-[#064E3B]' },
    { id: 'gia-dinh', emoji: '🍃', title: 'Trạm sạc chữa lành', sub: 'Khóc trôi muộn phiền', gradient: 'from-[#C2410C] to-[#7C2D12]' },
    { id: 'kinh-di', emoji: '👻', title: 'Đóng bỉm cày đêm', sub: 'Yếu tim xin tự trọng', gradient: 'from-[#0E7490] to-[#164E63]' },
    { id: 'hai-huoc', emoji: '😂', title: 'Hệ tư tưởng tấu hài', sub: 'Cười văng cả hàm', gradient: 'from-[#B45309] to-[#78350F]' },
    { id: 'phieu-luu', emoji: '🚀', title: 'Chạy trốn thực tại', sub: 'Đi vào dĩ vãng', gradient: 'from-[#7E22CE] to-[#581C87]' },
];

const moodCache: Record<string, any[]> = {};

function RandomMovieRow() {
    const [selectedMood, setSelectedMood] = useState(MOODS[0]);
    const [moodSwiper, setMoodSwiper] = useState<any>(null);
    const [displayMovies, setDisplayMovies] = useState<any[]>(moodCache[MOODS[0].id] || []);
    const [isFetching, setIsFetching] = useState(!moodCache[MOODS[0].id]);
    const [isInitialLoad, setIsInitialLoad] = useState(!moodCache[MOODS[0].id]);
    const [isRolling, setIsRolling] = useState(false);

    const fetchMoodMovies = async (moodId: string, shuffle: boolean = true) => {
        if (moodCache[moodId] && moodCache[moodId].length > 0) {
            const list = [...moodCache[moodId]];
            if (shuffle) {
                for (let i = list.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [list[i], list[j]] = [list[j], list[i]];
                }
            }
            return list;
        }

        try {
            const url = `/api/proxy?url=${encodeURIComponent(`${INTERNAL_API_URL}/the-loai/${moodId}?page=1&limit=40`)}&revalidate=86400`;
            const res = await axios.get(url);
            const items = res.data?.data?.items || res.data?.items || [];
            const unique = filterDuplicateMovies(items);
            moodCache[moodId] = unique;

            const list = [...unique];
            if (shuffle) {
                for (let i = list.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [list[i], list[j]] = [list[j], list[i]];
                }
            }
            return list.slice(0, 32);
        } catch {
            return [];
        }
    };

    useEffect(() => {
        let isMounted = true;

        if (moodCache[selectedMood.id] && moodCache[selectedMood.id].length > 0) {
            const list = [...moodCache[selectedMood.id]];
            for (let i = list.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [list[i], list[j]] = [list[j], list[i]];
            }
            setDisplayMovies(list);
            setIsFetching(false);
            setIsInitialLoad(false);
            return;
        }

        setIsFetching(true);
        fetchMoodMovies(selectedMood.id).then((movies) => {
            if (isMounted) {
                setDisplayMovies(movies);
                setIsFetching(false);
                setIsInitialLoad(false);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [selectedMood.id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            MOODS.forEach((m) => {
                if (!moodCache[m.id]) {
                    fetchMoodMovies(m.id, false).catch(() => {});
                }
            });
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (moodSwiper) {
            const index = MOODS.findIndex((m) => m.id === selectedMood.id);
            moodSwiper.slideTo(index);
        }
    }, [selectedMood, moodSwiper]);

    const handleRandomMood = () => {
        setIsRolling(true);
        const otherMoods = MOODS.filter((m) => m.id !== selectedMood.id);
        const random = otherMoods[Math.floor(Math.random() * otherMoods.length)];
        setSelectedMood(random);
        setTimeout(() => setIsRolling(false), 600);
    };

    if (isInitialLoad && displayMovies.length === 0) {
        return <RandomMovieRowSkeleton />;
    }

    return (
        <Container as="section" className="relative z-30">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-[20px] lg:text-[28px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-200 to-pink-400 drop-shadow-sm flex items-center gap-2.5">
                        Mood Nào Phim Nấy
                        <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/10 hidden sm:inline-flex items-center gap-1.5 shadow-sm">
                            <span>{selectedMood.emoji}</span>
                            <span>{selectedMood.title}</span>
                        </span>
                    </h2>
                </div>

                {/* Dice Button */}
                <button
                    onClick={handleRandomMood}
                    className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-[#D497FF] text-white hover:text-black font-bold text-xs transition-all duration-300 border border-white/10 hover:border-transparent cursor-pointer shadow-sm active:scale-95 group"
                    title="Đổi tâm trạng ngẫu nhiên"
                >
                    <Dices
                        size={16}
                        className={`transition-transform duration-500 ${isRolling ? "rotate-[360deg] scale-110" : "group-hover:rotate-180"}`}
                    />
                    <span className="hidden sm:inline">Đổi Mood</span>
                </button>
            </div>

            {/* Mood Selector Tabs */}
            <div className="mb-6">
                <Swiper
                    modules={[FreeMode]}
                    onSwiper={setMoodSwiper}
                    freeMode={true}
                    spaceBetween={8}
                    slidesPerView="auto"
                    breakpoints={{
                        640: { spaceBetween: 10 },
                        1024: { spaceBetween: 12 },
                    }}
                    className="w-full"
                >
                    {MOODS.map((mood) => {
                        const isSelected = selectedMood.id === mood.id;
                        return (
                            <SwiperSlide key={mood.id} className="!w-auto py-1">
                                <button
                                    onClick={() => setSelectedMood(mood)}
                                    className={`relative flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-left bg-gradient-to-br ${mood.gradient} transition-all duration-300 cursor-pointer min-w-[190px] sm:min-w-[220px] select-none border ${
                                        isSelected
                                            ? "border-white/60"
                                            : "border-white/10 hover:border-white/30"
                                    }`}
                                >
                                    {/* Emoji Container */}
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/25 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                                        {mood.emoji}
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-xs sm:text-sm font-extrabold leading-tight text-white truncate">
                                            {mood.title}
                                        </span>
                                        <span className="text-[10.5px] sm:text-xs text-white/80 font-medium italic truncate mt-0.5">
                                            {mood.sub}
                                        </span>
                                    </div>
                                </button>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>

            {/* Movies Carousel */}
            <div className="relative">
                {isFetching && displayMovies.length === 0 ? (
                    <div className="w-full">
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={2.3}
                            breakpoints={{
                                480: { slidesPerView: 2.8, spaceBetween: 10 },
                                640: { slidesPerView: 3.5, spaceBetween: 12 },
                                768: { slidesPerView: 4.5, spaceBetween: 12 },
                                1024: { slidesPerView: 5.5, spaceBetween: 14 },
                                1280: { slidesPerView: 6.5, spaceBetween: 14 },
                                1536: { slidesPerView: 7.5, spaceBetween: 16 },
                            }}
                        >
                            {[...Array(8)].map((_, i) => (
                                <SwiperSlide key={i}>
                                    <div className="space-y-2">
                                        <div className="aspect-[2/3] w-full bg-white/5 rounded-xl animate-pulse" />
                                        <div className="w-full h-4 bg-white/5 rounded animate-pulse" />
                                        <div className="w-2/3 h-3 bg-white/5 rounded animate-pulse" />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                ) : displayMovies.length > 0 ? (
                    <div className={`transition-opacity duration-300 ${isFetching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                        <Swiper
                            modules={[Virtual]}
                            virtual={{ enabled: true }}
                            spaceBetween={10}
                            slidesPerView={2.3}
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
                            {displayMovies.map((movie, index) => {
                                const imgUrl = getImageUrl(movie.poster_url || movie.thumb_url, { width: 220, quality: 75 });
                                const isPriority = index < 8;

                                return (
                                    <SwiperSlide key={movie._id} virtualIndex={index}>
                                        <div className="group flex flex-col h-full cursor-pointer">
                                            {/* Poster Thumbnail */}
                                            <TransitionLink
                                                href={`/phim/${movie.slug}`}
                                                className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#0F1115] border border-white/5 group-hover:border-[#D497FF]/50 transition-all duration-300 block"
                                            >
                                                <SmartImage
                                                    r2Src={getR2MoviePosterUrl(movie.slug)}
                                                    src={imgUrl}
                                                    rawSrc={getRawImageUrl(movie.poster_url || movie.thumb_url)}
                                                    alt={movie.name}
                                                    fill
                                                    priority={isPriority}
                                                    loading={isPriority ? "eager" : "lazy"}
                                                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 180px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500 transform-gpu"
                                                />



                                                {/* Solid Badges (High Contrast, Zero Blur) */}
                                                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none z-10">
                                                    <span className="h-4.5 px-1.5 bg-[#FAD078] rounded text-amber-950 shadow-sm text-[9px] font-bold flex items-center justify-center leading-none">
                                                        {movie.quality || "HD"}
                                                    </span>
                                                    <span className="h-4.5 px-1.5 bg-[#A7F3D0] rounded text-emerald-950 shadow-sm text-[9px] font-bold flex items-center justify-center leading-none truncate max-w-[65%]">
                                                        {getEpisodeStatus(movie)}
                                                    </span>
                                                </div>
                                            </TransitionLink>

                                            {/* Movie Info (Fixed Height to prevent layout shift) */}
                                            <div className="pt-2 space-y-1 flex flex-col justify-between">
                                                <div>
                                                    <TransitionLink
                                                        href={`/phim/${movie.slug}`}
                                                        className="text-white text-xs sm:text-sm font-bold line-clamp-2 group-hover:text-[#D497FF] transition-colors leading-tight block h-[32px] sm:h-[36px]"
                                                        title={movie.name}
                                                    >
                                                        {decodeHtml(movie.name)}
                                                    </TransitionLink>
                                                    <p
                                                        className="text-white/40 text-[10px] sm:text-[11px] line-clamp-1 font-medium italic mt-0.5 h-[16px]"
                                                        title={movie.origin_name}
                                                    >
                                                        {decodeHtml(movie.origin_name)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-white/50 pt-0.5 h-[16px]">
                                                    {movie.year && <span>{movie.year}</span>}
                                                    {movie.year && <span>•</span>}
                                                    <span className="text-[#D497FF]/80 font-semibold truncate">
                                                        {((movie as any).lang_tag || movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-white/40">
                        <p className="italic text-sm">Hiện chưa có phim nào cho tâm trạng này, hãy thử tâm trạng khác nhé!</p>
                    </div>
                )}
            </div>
        </Container>
    );
}

export default memo(RandomMovieRow);
