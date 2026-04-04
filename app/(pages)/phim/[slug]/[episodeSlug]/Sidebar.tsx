"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ChevronDown, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "@/app/utils/movieUtils";

interface SidebarProps {
    movie: {
        actors: string[];
        tmdb?: {
            vote_average: number;
        };
    };
    suggestedMovies?: any[];
}

const Sidebar = ({ movie, suggestedMovies = [] }: SidebarProps) => {
    const [isEmotionExpanded, setIsEmotionExpanded] = useState(false);

    // Điểm đánh giá từ TMDB
    const rating = movie.tmdb?.vote_average && movie.tmdb.vote_average > 0
        ? movie.tmdb.vote_average.toFixed(1)
        : "N/A";

    // Dữ liệu mẫu (Cảm xúc vẫn để mẫu vì API không cung cấp)
    const emotions = [
        { key: "fire", icon: "🔥", name: "Hấp dẫn", percent: 27, color: "rgb(255, 107, 53)" },
        { key: "heart", icon: "❤️", name: "Yêu thích", percent: 26, color: "rgb(255, 107, 107)" },
        { key: "laugh", icon: "😂", name: "Vui nhộn", percent: 19, color: "rgb(255, 216, 117)" },
        { key: "wow", icon: "😮", name: "Thú vị", percent: 14, color: "rgb(78, 205, 196)" },
        { key: "cry", icon: "😢", name: "Buồn", percent: 8, color: "rgb(108, 142, 191)" },
        { key: "poo", icon: "💩", name: "Tệ", percent: 6, color: "rgb(141, 110, 99)" },
    ];

    // Lấy danh sách diễn viên từ API
    const actorsList = movie.actors && movie.actors.length > 0 && movie.actors[0] !== ""
        ? movie.actors.map(name => ({ name, slug: name.toLowerCase().replace(/ /g, "-") }))
        : [
            { name: "Đang cập nhật", slug: "#" }
        ];

    const displaySuggestions = suggestedMovies.length > 0
        ? suggestedMovies.map(m => ({
            title: m.name,
            alias: m.origin_name,
            year: m.year,
            ep: m.episode_current?.includes('Hoàn tất') ? 'HT' : (m.episode_current || "Full"),
            thumb_url: m.thumb_url,
            slug: m.slug
        }))
        : [];

    return (
        <div className="flex flex-col gap-8">
            {/* Rating Section */}
            <div className="flex flex-col items-center ">
                <div className="flex items-center gap-6 mb-6">
                    <button className="flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-[#0a1628] transition-all">
                            <Star size={20} fill="currentColor" />
                        </div>
                        <span className="text-[12px] text-white/60 font-medium">Đánh giá</span>
                    </button>
                </div>
                <div className="w-full pt-6 border-t border-white/5 flex flex-col items-center">
                    <div className="flex items-center gap-2">
                        <Star size={16} fill="#f5c518" stroke="#f5c518" />
                        <span className="text-lg font-black text-white">{rating}</span>
                        <span className="text-[12px] text-white/40 uppercase tracking-wider ml-1 pt-1">Đánh giá</span>
                    </div>
                </div>
            </div>

            {/* Emotion Chart */}
            <div className="sidebar-card relative overflow-hidden border border-white/20 bg-white/[0.06] rounded-3xl p-6 shadow-2xl shadow-black/80 flex flex-col transform-gpu">
                <div className="relative mb-6 text-center">
                    <h3 className="text-[16px] font-bold text-white tracking-[0.2em] mb-1 drop-shadow-sm">Biểu đồ cảm xúc</h3>
                    <p className="text-[10px] text-white/60 tracking-widest">Cảm xúc hiện tại của người xem</p>
                </div>

                <div className="flex flex-col">
                    {/* First 3 emotions - Always visible */}
                    {emotions.slice(0, 3).map((item) => (
                        <div key={item.key} className="flex flex-col gap-2 mb-4">
                            <div className="flex items-center justify-between text-[12px]">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{item.icon}</span>
                                    <span className="text-white/60">{item.name}</span>
                                </div>
                                <span className="text-amber-400">{item.percent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative border border-white/5">
                                <div
                                    className="h-full rounded-full relative shadow-[0_0_10px_rgba(255,255,255,0.15)] transform-gpu"
                                    style={{
                                        width: `${item.percent}%`,
                                        background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`,
                                        backgroundColor: item.color,
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Expandable part - Optimized with CSS for zero-lag */}
                    <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out transform-gpu ${isEmotionExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                        style={{ willChange: "max-height, opacity" }}
                    >
                        {emotions.slice(3).map((item) => (
                            <div key={item.key} className="flex flex-col gap-2 mb-4">
                                <div className="flex items-center justify-between text-[12px] font-bold">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{item.icon}</span>
                                        <span className="text-white/60">{item.name}</span>
                                    </div>
                                    <span className="text-amber-400">{item.percent}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative border border-white/5">
                                    <div
                                        className="h-full rounded-full relative shadow-[0_0_10px_rgba(255,255,255,0.15)] transform-gpu"
                                        style={{
                                            width: `${item.percent}%`,
                                            background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`,
                                            backgroundColor: item.color,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => setIsEmotionExpanded(!isEmotionExpanded)}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] text-white/60 hover:text-white transition-all group cursor-pointer"
                >
                    {isEmotionExpanded ? "Thu gọn" : "Xem đầy đủ"}
                    <ChevronDown 
                      size={14} 
                      className={`transition-transform duration-300 ${isEmotionExpanded ? 'rotate-180' : 'rotate-0'}`} 
                    />
                </button>
            </div>

            {/* Actors Section */}
            <div className="pt-8 border-t border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Diễn viên</h3>
                <div className="grid grid-cols-3 gap-6">
                    {actorsList.map((actor: { name: string; slug: string }, idx: number) => (
                        <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-14 h-14 rounded-full bg-white/5 border-2 border-white/10 group-hover:border-white flex items-center justify-center overflow-hidden transition-all relative">
                                <User size={20} className="text-white/20 group-hover:text-white/40 transition-colors" />
                            </div>
                            <span className="text-[11px] text-white/60 group-hover:text-white text-center leading-tight truncate w-full transition-colors">
                                {actor.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Suggestions Section */}
            <div className="pt-8 border-t border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Đề xuất cho bạn</h3>
                <div className="flex flex-col">
                    {displaySuggestions.map((movie, idx) => (
                        <Link
                            key={idx}
                            href={`/phim/${movie.slug}`}
                            className="flex gap-4 py-3 border-b border-white/5 hover:bg-white/[0.02] -mx-4 px-4 transition-all group first:pt-0 last:border-0"
                        >
                            <div className="w-16 h-20 shrink-0 rounded-lg overflow-hidden relative shadow-lg">
                                <img src={getImageUrl(movie.thumb_url)} alt={movie.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                                <h4 className="text-[13px] font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors mb-0.5">{movie.title}</h4>
                                <div className="text-[11px] text-white/40 font-medium italic line-clamp-1 mb-2">{movie.alias}</div>
                                <div className="flex gap-2">
                                    <span className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-white/50">{movie.year}</span>
                                    <span className="px-1.5 py-0.5 bg-amber-500 rounded text-[#0a1628] text-[9px]  tracking-tighter shadow-lg">
                                        {movie.ep}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
