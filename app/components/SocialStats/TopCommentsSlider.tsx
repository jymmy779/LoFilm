"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Star, MessageSquare } from "lucide-react";
import SwiperNavButtons from "@/app/components/Common/SwiperNavButtons";
import axios from "axios";
import Skeleton from "@/app/components/Skeleton/Skeleton";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { globalCache } from "@/app/utils/globalCache";

interface DisplayComment {
    id: string | number;
    user: {
        name: string;
        avatar: string | null;
    };
    movie: {
        slug: string;
        title: string;
        poster: string;
        backdrop: string;
    };
    content: string;
    upvotes: number;
    downvotes: number;
    replies: number;
}

export default function TopCommentsSlider() {
    const [comments, setComments] = useState<DisplayComment[]>(() => globalCache.getRaw<DisplayComment[]>("social-top-comments") || []);
    const [loading, setLoading] = useState(() => !globalCache.has("social-top-comments"));

    useEffect(() => {
        const controller = new AbortController();

        const loadTopComments = async () => {
            try {
                const res = await axios.get("/api/social/top-comments", { signal: controller.signal });
                if (res.data && Array.isArray(res.data)) {
                    if (res.data.length > 0) {
                        setComments(res.data);
                        globalCache.set("social-top-comments", res.data);
                    } else if (!globalCache.has("social-top-comments")) {
                        setComments([]);
                    }
                }
            } catch (err) {
                if (!axios.isCancel(err)) {
                    console.error("Error loading social top comments:", err);
                }
            } finally {
                setLoading(false);
            }
        };

        loadTopComments();

        return () => controller.abort();
    }, []);

    return (
        <div className="relative group/comments">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
                <h2 className="text-base sm:text-lg lg:text-xl font-bold uppercase">Top Bình luận</h2>
            </div>

            <div className="relative px-1">
                <Swiper
                    modules={[Navigation, Autoplay]}
                    slidesPerView={"auto"}
                    spaceBetween={8}
                    autoplay={{
                        delay: 4000,
                        disableOnInteraction: true,
                        pauseOnMouseEnter: true
                    }}
                    breakpoints={{
                        640: { spaceBetween: 12 },
                        1024: { spaceBetween: 16 },
                    }}
                    navigation={{
                        nextEl: ".btn-next-top-comments",
                        prevEl: ".btn-prev-top-comments",
                    }}
                    className=""
                >
                    {loading ? (
                        // Skeleton slides during loading
                        [...Array(5)].map((_, i) => (
                            <SwiperSlide key={i} className="!w-[280px] sm:!w-[320px] md:!w-[360px] !h-auto">
                                <div className="relative h-[220px] bg-[#0c1322]/40 rounded-xl overflow-hidden border border-white/5 p-4 pt-6 flex flex-col">
                                    <div className="flex justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-10 h-10" rounded="full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-3 w-12" />
                                            </div>
                                        </div>
                                        <Skeleton className="w-12 h-16" rounded="lg" />
                                    </div>
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-3/4 mb-4" />
                                    <div className="mt-auto pt-3 border-t border-white/5 flex gap-4">
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="h-4 w-12" />
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))
                    ) : comments.length === 0 ? (
                        <div className="text-center py-10 text-white/40 text-sm w-full">
                            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <SwiperSlide key={comment.id} className="!w-[280px] sm:!w-[320px] md:!w-[360px] !h-auto">
                                <div className="relative h-[190px] sm:h-[220px] bg-[#0c1322] rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 group/comment flex flex-col">
                                    {/* Unblurred backdrop movie poster occupying the top 2/3, smoothly fading into the solid card base */}
                                    {comment.movie.backdrop && (
                                        <div className="absolute inset-x-0 top-0 h-[67%] overflow-hidden pointer-events-none select-none z-0">
                                            <img
                                                src={comment.movie.backdrop}
                                                alt=""
                                                className="w-full h-full object-cover opacity-50"
                                            />
                                            {/* Linear gradient fade from transparent to solid card background color */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0c1322]/35 to-[#0c1322]" />
                                        </div>
                                    )}

                                    <div className="relative p-3 sm:p-4 pt-4 sm:pt-6 flex flex-col h-full z-10 justify-between ">
                                        <div className="flex justify-between gap-3 mb-2 sm:mb-3">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden relative">
                                                    {comment.user.avatar ? (
                                                        <img
                                                            src={comment.user.avatar}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                                                                if (fallback) {
                                                                    (fallback as HTMLElement).style.display = 'flex';
                                                                }
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className="avatar-fallback w-full h-full flex items-center justify-center bg-white/5 absolute inset-0"
                                                        style={{ display: comment.user.avatar ? 'none' : 'flex' }}
                                                    >
                                                        <span className="text-[10px] sm:text-xs font-bold text-white/40">{comment.user.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs sm:text-sm text-white/80 truncate max-w-[100px] sm:max-w-[120px]">{comment.user.name}</span>
                                                </div>
                                            </div>

                                            {/* Small Poster link to detail page - Sleeker size to save space */}
                                            <TransitionLink
                                                href={`/phim/${comment.movie.slug}`}
                                                className="w-8 h-11 sm:w-12 sm:h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 hover:border-amber-500 group/poster transition-all duration-300"
                                            >
                                                <img src={comment.movie.poster} alt={comment.movie.title} className="w-full h-full object-cover opacity-85 group-hover/poster:opacity-100 transition-opacity" />
                                            </TransitionLink>
                                        </div>

                                        <p className="text-xs sm:text-sm text-white/70 line-clamp-2 italic leading-relaxed">
                                            "{comment.content}"
                                        </p>

                                        <div className=" flex items-center justify-between text-[10px] sm:text-[12px] text-white/40 pt-2 sm:pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group/icon">
                                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="12" width="12" className="sm:h-[14px] sm:w-[14px] group-hover/icon:scale-110 transition-transform"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm11.3-395.3l112 112c4.6 4.6 5.9 11.5 3.5 17.4s-8.3 9.9-14.8 9.9l-64 0 0 96c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-96-64 0c-6.5 0-12.3-3.9-14.8-9.9s-1.1-12.9 3.5-17.4l112-112c6.2-6.2 16.4-6.2 22.6 0z"></path></svg>
                                                    <span>{comment.upvotes}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group/icon">
                                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="12" width="12" className="sm:h-[14px] sm:w-[14px] group-hover/icon:scale-110 transition-transform"><path d="M256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM244.7 395.3l-112-112c-4.6-4.6-5.9-11.5-3.5-17.4s8.3-9.9 14.8-9.9l64 0 0-96c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 96 64 0c6.5 0 12.3 3.9 14.8 9.9s1.1 12.9-3.5 17.4l-112 112c-6.2 6.2-16.4 6.2-22.6 0z"></path></svg>
                                                    <span>{comment.downvotes}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))
                    )}
                </Swiper>
            </div>
        </div>
    );
}
