"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Container from "@/app/components/Container";
import { Movie } from "@/app/types/movie";
import { getImageUrl } from "@/app/utils/movieUtils";
import { decodeHtml } from "@/app/utils/textUtils";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { motion } from "framer-motion";
import ReunificationEventSkeleton from "./SpecialSections/ReunificationEventSkeleton";

export default function ReunificationEvent() {
    const [isMounted, setIsMounted] = useState(false);
    const [showEvent, setShowEvent] = useState(false);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        const today = new Date();
        const month = today.getMonth() + 1;
        const date = today.getDate();
        const isEventPeriod = (month === 4 && date >= 25) || (month === 5 && date <= 2);

        if (isEventPeriod) {
            setShowEvent(true);
            fetchVietnameseMovies();
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchVietnameseMovies = async () => {
        try {
            setIsLoading(true);
            // Fetch 6 phim mới nhất từ quốc gia Việt Nam
            const res = await axios.get("https://phimapi.com/v1/api/quoc-gia/viet-nam?limit=6");

            if (res.data?.status === "success" || res.data?.status === true) {
                const items = res.data.data?.items || res.data.items || [];
                setMovies(items);
            }
        } catch (error) {
            console.error("Error fetching Vietnamese movies:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted || !showEvent) return null;
    if (isLoading) return <ReunificationEventSkeleton />;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5
            }
        }
    };

    return (
        <Container as="section" className="relative z-30 animate-fade-in">
            {/* BANNER DESIGN: Warm Beige Background with Red Accents */}
            <div className="relative w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-[#fdf8e6] border-2 md:border-4 border-[#e2dcc8] shadow-2xl p-5 md:p-10 lg:p-12">

                {/* Decorative Background Texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none"></div>

                {/* Banner Content Header */}
                <div className="relative z-10 flex flex-col md:flex-row items-start items-center justify-between gap-6 mb-10 border-b-2 border-red-200 pb-4 lg:pb-8">
                    <div className="flex items-center max-w-[80%] justify-between gap-4">
                        <div>
                            <h2 className="text-xl md:text-3xl font-black text-red-700 uppercase tracking-tight leading-none">
                                Mừng Đại Lễ <span className="text-yellow-600">30/4 - 1/5</span>
                            </h2>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-2">
                                Kỷ niệm {new Date().getFullYear() - 1975} năm ngày giải phóng miền Nam, thống nhất đất nước
                            </p>
                        </div>
                    </div>
                    <div className="w-10 md:w-20 lg:w-30 absolute top-0 md:top-[-20px] lg:top-[-30px] right-0">
                        <img src="/vn-flag-full.gif" alt="" />
                    </div>
                </div>

                {/* Movies Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8"
                >
                    {movies.map((movie) => (
                        <motion.div key={movie._id} variants={itemVariants} className="group flex flex-col items-center">
                            <TransitionLink href={`/phim/${movie.slug}`} className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border-2 border-transparent group-hover:border-red-600 transition-all duration-500 transform  group-hover:shadow-[0_15px_35px_rgba(185,28,28,0.2)] bg-gray-200 block">
                                <img
                                    src={getImageUrl(movie.poster_url, { width: 400 })}
                                    alt={movie.name}
                                    className="w-full h-full object-cover transition-transform duration-700"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute inset-0 p-4 flex flex-col justify-end translate-y-6 group-hover:translate-y-0 transition-all duration-300 opacity-0 group-hover:opacity-100">
                                    <span className="w-full py-2.5 bg-yellow-400 text-red-900 font-medium rounded-xl text-[10px] shadow-lg border border-yellow-500 flex items-center justify-center">
                                        Xem Phim
                                    </span>
                                </div>
                            </TransitionLink>
                            <h3 className="mt-3 text-center text-gray-800 text-xs md:text-sm line-clamp-2 leading-tight group-hover:text-red-700 transition-colors font-medium tracking-tight">
                                {decodeHtml(movie.name)}
                            </h3>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Banner Footer */}
                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-red-200/50 pt-8">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] lg:tracking-[0.5em] opacity-50 text-center md:text-left order-2 md:order-1">
                        LoFilm - Lưu giữ giá trị văn hóa lịch sử qua từng thước phim
                    </div>
                    <TransitionLink
                        href="/quoc-gia/viet-nam"
                        className="order-1 md:order-2 group/btn relative px-8 py-3 bg-red-600 text-white font-medium text-xs tracking-widest rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 transform active:scale-95 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center text-nowrap gap-1">
                            Xem Thêm
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="">
                                <path d="M5 12h14"></path>
                                <path d="m12 5 7 7-7 7"></path>
                            </svg>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    </TransitionLink>
                </div>
            </div>
        </Container>
    );
}
