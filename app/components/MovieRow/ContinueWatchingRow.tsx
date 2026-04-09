"use client";

import { useEffect, useState } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { getImageUrl } from "@/app/utils/movieUtils";
import Image from "next/image";
import { motion } from "framer-motion";
import Container from "@/app/components/Container";
import { Play } from "lucide-react";
import SwiperNavButtons from "@/app/components/Common/SwiperNavButtons";
import { useAuth } from "@/app/components/Auth/AuthContext";
import { createClient } from "@/app/utils/supabase/client";

interface ContinueWatchingRowProps {
    initialHistory?: any[];
}

export default function ContinueWatchingRow({ initialHistory }: ContinueWatchingRowProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [history, setHistory] = useState<any[]>(initialHistory || []);
    const [isLoading, setIsLoading] = useState(!initialHistory);
    const supabase = createClient();

    useEffect(() => {
        const fetchHistory = async () => {
            // Wait until auth state is determined
            if (isAuthLoading) return;

            if (!user) {
                setHistory([]);
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('watch_history')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                // Chỉ hiện những phim chưa xem hết (dưới 90%)
                const continueWatching = data.filter(item => {
                    if (!item.duration) return true;
                    const progress = (item.watched_seconds / item.duration) * 100;
                    return progress < 90;
                });
                setHistory(continueWatching);
            }
            setIsLoading(false);
        };
        fetchHistory();
    }, [user, isAuthLoading, supabase]);

    if (isLoading) {
        return (
            <Container as="section" className="relative z-30 mb-8 md:mb-12 lg:mb-16 mt-8">
                <div className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-black/40 p-4 md:p-6 lg:p-8 rounded-2xl border border-white/5 overflow-hidden animate-pulse">
                    <div className="w-full xl:w-[260px] xl:flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                        <div className="space-y-2">
                            <div className="h-8 w-32 bg-white/10 rounded-lg" />
                            <div className="h-4 w-20 bg-white/5 rounded" />
                        </div>
                        <div className="h-4 w-24 bg-white/5 rounded" />
                    </div>
                    <div className="flex gap-4 overflow-hidden">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex-none w-[220px] sm:w-[260px] md:w-[300px]">
                                <div className="aspect-video rounded-xl bg-white/5 mb-3 border border-white/5" />
                                <div className="space-y-2 px-1">
                                    <div className="h-4 w-3/4 bg-white/10 rounded" />
                                    <div className="h-3 w-1/2 bg-white/5 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Container>
        );
    }

    if (history.length === 0 && !isLoading) return null;

    return (
        <Container as="section" className="relative z-30 mb-8 md:mb-12 lg:mb-16 mt-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-black/40 p-4 md:p-6 lg:p-8 rounded-2xl border border-white/5 relative overflow-hidden"
            >
                {/* Background Decor subtle */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-400/5 blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <div className="w-full xl:w-[260px] xl:flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                    <div>
                        <h2 className="text-[20px] lg:text-[28px] font-bold !leading-tight text-white">
                            Xem Tiếp
                        </h2>
                        <p className="text-white/40 text-[10px] font-medium mt-1 tracking-[0.2em]">Lịch sử của bạn</p>
                    </div>

                    <TransitionLink
                        href="/trang-ca-nhan?tab=history"
                        className="text-amber-400/80 font-medium hover:text-amber-400 transition-colors flex items-center gap-2 text-sm tracking-wider w-max"
                    >
                        Tất cả lịch sử
                    </TransitionLink>
                </div>

                {/* Swiper */}
                <div className="w-full xl:w-[calc(100%-292px)] relative group/slider">
                    <Swiper
                        modules={[Navigation]}
                        slidesPerView={"auto"}
                        spaceBetween={12}
                        breakpoints={{
                            1280: { spaceBetween: 20 },
                            767: { spaceBetween: 16 },
                        }}
                        navigation={{
                            nextEl: '.btn-next-continue',
                            prevEl: '.btn-prev-continue',
                        }}
                        className="swiper-carousel"
                    >
                        {history.map((item, index) => {
                            const progress = (item.watched_seconds / item.duration) * 100;
                            const isFinished = progress > 90;
                            const isPriority = index < 4;

                            return (
                                <SwiperSlide key={item.id} className="!w-[220px] sm:!w-[260px] md:!w-[300px]">
                                    <TransitionLink
                                        href={`/phim/${item.movie_slug}/${item.episode_slug}`}
                                        className="block group/item relative"
                                    >
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 mb-3 border border-white/5">
                                            <Image
                                                src={getImageUrl(item.movie_poster, { width: 320, quality: 75 })}
                                                alt={item.movie_name}
                                                fill
                                                priority={false}
                                                loading="lazy"
                                                sizes="(max-width: 768px) 220px, (max-width: 1024px) 260px, 300px"
                                                className="object-cover  object-top transition-transform duration-700 group-hover/item:scale-110"
                                            />

                                            {/* Progress Bar Overlay */}
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10 overflow-hidden">
                                                <div
                                                    className={`h-full bg-amber-400 transition-all duration-300 ${isFinished ? 'opacity-50' : 'opacity-100'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>

                                            {/* Labels */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-black shadow-xl transform scale-75 group-hover/item:scale-100 transition-transform">
                                                    <Play size={24} fill="black" />
                                                </div>
                                            </div>

                                            {item.episode_name && (
                                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] font-bold text-white border border-white/10">
                                                    {item.episode_name}
                                                </div>
                                            )}

                                            <div className="absolute bottom-3 right-3 text-[9px] font-mono text-white/80 bg-black/40 px-1.5 py-0.5 rounded">
                                                {Math.floor(item.watched_seconds / 60)}:{String(Math.floor(item.watched_seconds % 60)).padStart(2, '0')}
                                            </div>
                                        </div>

                                        <div className="px-1">
                                            <h3 className="text-white font-medium text-sm line-clamp-1 group-hover/item:text-amber-400 transition-colors">
                                                {item.movie_name}
                                            </h3>
                                            <p className="text-white/40 text-[10px] mt-0.5">
                                                {isFinished ? 'Đã xem gần hết' : `Còn lại ${Math.floor((item.duration - item.watched_seconds) / 60)} phút`}
                                            </p>
                                        </div>
                                    </TransitionLink>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    <SwiperNavButtons 
                        prevClassName="btn-prev-continue" 
                        nextClassName="btn-next-continue" 
                        variant="amber" 
                    />
                </div>
            </motion.div>
        </Container>
    );
}
