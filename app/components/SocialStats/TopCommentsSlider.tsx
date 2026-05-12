"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { TOP_COMMENTS } from "@/app/data/social-stats";
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import SwiperNavButtons from "@/app/components/Common/SwiperNavButtons";

export default function TopCommentsSlider() {
    return (
        <div className="relative group/comments">
            <div className="flex items-center gap-2 mb-6">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider">Top Bình luận</h2>
            </div>

            <div className="relative px-1">
                <Swiper
                    modules={[Navigation]}
                    slidesPerView={"auto"}
                    spaceBetween={12}
                    breakpoints={{
                        640: { spaceBetween: 16 },
                        1024: { spaceBetween: 20 },
                    }}
                    navigation={{
                        nextEl: ".btn-next-top-comments",
                        prevEl: ".btn-prev-top-comments",
                    }}
                    className=""
                >
                    {TOP_COMMENTS.map((comment) => (
                        <SwiperSlide key={comment.id} className="!w-[280px] sm:!w-[320px] md:!w-[360px] !h-auto">
                            <div className="relative h-full bg-[#1e2a44]/20 rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 group flex flex-col">
                                <div className="relative p-5 flex flex-col h-full z-10">
                                    <div className="flex justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden group-hover:border-white/20 transition-all">
                                                {comment.user.avatar ? (
                                                    <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                        <span className="text-xs font-bold text-white/40">{comment.user.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-white/80 truncate max-w-[120px] group-hover:text-white transition-colors">{comment.user.name}</span>
                                                <span className="text-[10px] text-white/30 uppercase tracking-tighter">Thành viên</span>
                                            </div>
                                        </div>

                                        {/* Small Poster */}
                                        <div className="w-14 h-20 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 group-hover:border-white/20 transition-all">
                                            <img src={comment.movie.poster} alt={comment.movie.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>

                                    <p className="text-sm text-white/70 line-clamp-3 mb-6 italic leading-relaxed">
                                        "{comment.content}"
                                    </p>

                                    <div className="mt-auto flex items-center justify-between text-[12px] text-white/40 border-t border-white/5 pt-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group/icon">
                                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="14" width="14" className="group-hover/icon:scale-110 transition-transform"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm11.3-395.3l112 112c4.6 4.6 5.9 11.5 3.5 17.4s-8.3 9.9-14.8 9.9l-64 0 0 96c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-96-64 0c-6.5 0-12.3-3.9-14.8-9.9s-1.1-12.9 3.5-17.4l112-112c6.2-6.2 16.4-6.2 22.6 0z"></path></svg>
                                                <span>{comment.upvotes}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group/icon">
                                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="14" width="14" className="group-hover/icon:scale-110 transition-transform"><path d="M256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM244.7 395.3l-112-112c-4.6-4.6-5.9-11.5-3.5-17.4s8.3-9.9 14.8-9.9l64 0 0-96c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 96 64 0c6.5 0 12.3 3.9 14.8 9.9s1.1 12.9-3.5 17.4l-112 112c-6.2 6.2-16.4 6.2-22.6 0z"></path></svg>
                                                <span>{comment.downvotes}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group/icon">
                                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="14" width="14" className="group-hover/icon:scale-110 transition-transform"><path d="M205 34.8c11.5 5.1 19 16.6 19 29.2l0 64 112 0c97.2 0 176 78.8 176 176c0 113.3-81.5 163.9-100.2 174.1c-2.5 1.4-5.3 1.9-8.1 1.9c-10.9 0-19.7-8.9-19.7-19.7c0-7.5 4.3-14.4 9.8-19.5c9.4-8.8 22.2-26.4 22.2-56.7c0-53-43-96-96-96l-96 0 0 64c0 12.6-7.4 24.1-19 29.2s-25 3-34.4-5.4l-160-144C3.9 225.7 0 217.1 0 208s3.9-17.7 10.6-23.8l160-144c9.4-8.5 22.9-10.6 34.4-5.4z"></path></svg>
                                                <span>{comment.replies}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}
