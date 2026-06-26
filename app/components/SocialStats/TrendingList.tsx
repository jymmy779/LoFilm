"use client";

import { useEffect, useState } from "react";
import { Flame, TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import { createPortal } from "react-dom";
import axios from "axios";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { globalCache } from "@/app/utils/globalCache";

interface TrendingMovie {
    slug: string;
    title: string;
    poster: string;
}

export default function TrendingList() {
    const [movies, setMovies] = useState<TrendingMovie[]>(() => globalCache.getRaw<TrendingMovie[]>("social-trending") || []);
    const [loading, setLoading] = useState(() => !globalCache.has("social-trending"));
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const controller = new AbortController();

        const fetchTrendingMovies = async () => {
            try {
                const res = await axios.get("/api/social/trending", { signal: controller.signal });
                if (res.data && Array.isArray(res.data)) {
                    if (res.data.length > 0) {
                        setMovies(res.data);
                        globalCache.set("social-trending", res.data);
                    } else if (!globalCache.has("social-trending")) {
                        setMovies([]);
                    }
                }
            } catch (err) {
                if (!axios.isCancel(err)) {
                    console.error("Error loading trending list:", err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTrendingMovies();

        return () => controller.abort();
    }, []);

    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);

    // Lock body scroll and delay unmounting when closing to play animation
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
            html.classList.add("no-scroll");
            body.classList.add("no-scroll");
        } else if (shouldRender) {
            setIsClosing(true);
            html.classList.remove("no-scroll");
            body.classList.remove("no-scroll");
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, 250);
            return () => {
                clearTimeout(timer);
                html.classList.remove("no-scroll");
                body.classList.remove("no-scroll");
            };
        }
        return () => {
            html.classList.remove("no-scroll");
            body.classList.remove("no-scroll");
        };
    }, [isOpen, shouldRender]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-4 md:mb-6">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 fill-orange-500" />
                <h3 className="font-bold uppercase text-xs sm:text-sm">Sôi nổi nhất</h3>
            </div>

            <div className="flex flex-col gap-2">
                {loading ? (
                    // Beautiful Skeleton Loader
                    Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-2.5 sm:gap-4 h-12 sm:h-14 animate-pulse">
                            <div className="w-6 h-6 bg-white/5 rounded shrink-0" />
                            <div className="w-3 h-3 bg-white/5 rounded shrink-0" />
                            <div className="w-8 h-11 sm:w-10 sm:h-14 bg-white/5 rounded-md shrink-0" />
                            <div className="h-4 bg-white/5 rounded w-32" />
                        </div>
                    ))
                ) : movies.length > 0 ? (
                    movies.slice(0, 5).map((movie, index) => (
                        <div
                            key={movie.slug}
                            className="flex items-center gap-2.5 sm:gap-4 group h-12 sm:h-14"
                        >
                            <div className="w-6 text-white/20 font-black text-base sm:text-lg shrink-0">
                                {index + 1}.
                            </div>
                            <div className="w-3 h-3 flex items-center justify-center shrink-0">
                                {((index + 1) % 4 === 0) ? (
                                    <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/20" />
                                ) : ((index + 1) % 2 !== 0) ? (
                                    <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />
                                ) : (
                                    <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                                )}
                            </div>
                            <TransitionLink
                                href={`/phim/${movie.slug}`}
                                className="w-8 h-11 sm:w-10 sm:h-14 rounded-md overflow-hidden flex-shrink-0 border border-white/10 cursor-pointer"
                            >
                                <img
                                    src={movie.poster}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </TransitionLink>
                            <TransitionLink
                                href={`/phim/${movie.slug}`}
                                className="text-xs sm:text-sm font-medium text-white/80 hover:text-amber-400 transition-colors line-clamp-1 cursor-pointer"
                            >
                                {movie.title}
                            </TransitionLink>
                        </div>
                    ))
                ) : (
                    <div className="text-xs text-white/30 py-4">Chưa có bình luận nào.</div>
                )}
            </div>

            <button
                onClick={() => setIsOpen(true)}
                className="mt-auto pt-4 sm:pt-6 text-[11px] cursor-pointer text-left text-white/30 hover:text-amber-400 transition-colors font-medium block border-none bg-transparent"
            >
                Xem thêm
            </button>

            {/* Portal-based Global Overlay Modal */}
            {shouldRender && mounted && createPortal(
                <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 ${isClosing ? 'pointer-events-none' : ''}`}>
                    {/* Backdrop matching CommonModal */}
                    <div
                        onClick={() => setIsOpen(false)}
                        className={`absolute inset-0 bg-black/60 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
                        style={{ animationDuration: '0.3s' }}
                    />

                    {/* Modal Content container matching CommonModal styling */}
                    <div
                        className={`relative w-[95%] max-w-[340px] sm:max-w-[380px] md:max-w-[420px] bg-[#111e31] border border-white/10 rounded-2xl p-3 sm:p-4 md:p-5 shadow-2xl z-10 overflow-y-hidden max-h-[95vh] ${isClosing ? 'animate-pop-out' : 'animate-pop-in'
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 fill-orange-500" />
                                </div>
                                <h3 className="font-extrabold uppercase tracking-wider text-xs sm:text-sm md:text-base text-white italic">
                                    Sôi nổi nhất
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer border-none"
                            >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        </div>

                        {/* Thin clean horizontal line */}
                        <div className="border-b border-white/5 mb-1.5" />

                        {/* 10 Movies List (No inner scrollbar as requested) */}
                        <div className="flex flex-col">
                            {movies.map((movie, index) => {
                                const rank = index + 1;

                                return (
                                    <div
                                        key={movie.slug}
                                        className={`flex items-center gap-3 sm:gap-4 group py-1 sm:py-1.5 ${rank !== movies.length ? "border-b border-white/5" : ""
                                            }`}
                                    >
                                        {/* Rank Number */}
                                        <div className="w-6 text-white/20 font-black text-[11px] sm:text-xs md:text-sm shrink-0 text-center">
                                            {rank}.
                                        </div>

                                        {/* Trend Indicator Icon */}
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0">
                                            {rank % 4 === 0 ? (
                                                <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/20" />
                                            ) : rank % 2 !== 0 ? (
                                                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />
                                            ) : (
                                                <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                                            )}
                                        </div>

                                        {/* Rectangular Movie Poster just like Sidebar & Screenshot */}
                                        <TransitionLink
                                            href={`/phim/${movie.slug}`}
                                            onClick={() => setIsOpen(false)}
                                            className="w-7 h-9 sm:w-8.5 sm:h-12 rounded-md overflow-hidden flex-shrink-0 border border-white/10 cursor-pointer"
                                        >
                                            <img
                                                src={movie.poster}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </TransitionLink>

                                        {/* Movie Title */}
                                        <TransitionLink
                                            href={`/phim/${movie.slug}`}
                                            onClick={() => setIsOpen(false)}
                                            className="text-[10px] sm:text-xs md:text-sm font-semibold text-white/80 hover:text-amber-400 transition-colors line-clamp-1 flex-1 leading-snug cursor-pointer"
                                        >
                                            {movie.title}
                                        </TransitionLink>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
