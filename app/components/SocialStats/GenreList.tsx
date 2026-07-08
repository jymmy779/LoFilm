"use client";

import { useEffect, useState } from "react";
import { Folder, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { createPortal } from "react-dom";
import { HOT_GENRES } from "@/app/data/social-stats";
import TransitionLink from "@/app/components/Transition/TransitionLink";

export default function GenreList() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
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
                <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 fill-blue-500" />
                <h3 className="font-bold uppercase text-xs sm:text-sm">Thể loại Hot</h3>
            </div>

            <div className="flex flex-col gap-2">
                {HOT_GENRES.slice(0, 5).map((genre, index) => (
                    <div
                        key={genre.id}
                        className="flex items-center gap-2.5 sm:gap-4 group h-12 sm:h-14"
                    >
                        <div className="w-6 text-white/20 font-black text-base sm:text-lg shrink-0">
                            {index + 1}.
                        </div>
                        <div className="w-3 h-3 flex items-center justify-center shrink-0">
                            {genre.trend === 'up' ? (
                                <span className="text-green-400 text-[8px]">▲</span>
                            ) : genre.trend === 'down' ? (
                                <span className="text-red-400 text-[8px]">▼</span>
                            ) : (
                                <span className="text-white/20 text-[8px]">-</span>
                            )}
                        </div>
                        <TransitionLink
                            href={`/the-loai/${genre.slug}`}
                            className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold transition-all duration-300 cursor-pointer"
                            style={{
                                backgroundColor: genre.color + '22',
                                color: genre.color,
                                border: `1px solid ${genre.color}44`,
                            }}
                        >
                            {genre.name}
                        </TransitionLink>
                    </div>
                ))}
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
                        className={`relative w-[95%] max-w-[340px] sm:max-w-[400px] md:max-w-[440px] lg:max-w-[480px] bg-[#0F1115] border border-white/10 rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl z-10 overflow-y-auto max-h-[90vh] custom-scrollbar ${
                            isClosing ? 'animate-pop-out' : 'animate-pop-in'
                        }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center animate-pulse">
                                    <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 fill-blue-500" />
                                </div>
                                <h3 className="font-bold uppercase text-xs sm:text-sm md:text-base text-white italic">
                                    Thể loại Hot
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
                        <div className="border-b border-white/5 mb-2" />

                        {/* 10 Genres List (No inner scrollbar as requested) */}
                        <div className="flex flex-col">
                            {HOT_GENRES.map((genre, index) => {
                                return (
                                    <div
                                        key={genre.id}
                                        className={`flex items-center gap-3 sm:gap-4 group py-2.5 sm:py-3.5 ${index !== HOT_GENRES.length - 1 ? "border-b border-white/5" : ""
                                            }`}
                                    >
                                        {/* Rank Number */}
                                        <div className="w-6 text-white/20 font-black text-xs sm:text-sm md:text-base shrink-0 text-center">
                                            {index + 1}.
                                        </div>

                                        {/* Trend Indicator Icon */}
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0">
                                            {genre.trend === 'up' ? (
                                                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />
                                            ) : genre.trend === 'down' ? (
                                                <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                                            ) : (
                                                <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/20" />
                                            )}
                                        </div>

                                        {/* Genre Pill shape matching design system */}
                                        <TransitionLink
                                            href={`/the-loai/${genre.slug}`}
                                            onClick={() => setIsOpen(false)}
                                            className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all duration-300 cursor-pointer"
                                            style={{
                                                backgroundColor: genre.color + '22',
                                                color: genre.color,
                                                border: `1px solid ${genre.color}44`,
                                            }}
                                        >
                                            {genre.name}
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
