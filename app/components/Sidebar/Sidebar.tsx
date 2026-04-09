"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { Star, Eye, Zap } from "lucide-react";
import { Movie } from "@/app/types/movie";
import { getImageUrl } from "@/app/utils/movieUtils";
import { decodeHtml } from "@/app/utils/textUtils";
import Skeleton from "react-loading-skeleton";

// Hàm chuẩn hóa tên để tìm các phần phim giống nhau
const normalizeMovieName = (name: string) => {
    return name
        .toLowerCase()
        .replace(/\(phần\s+\d+\)/g, "") // Xóa (Phần X)
        .replace(/phần\s+\d+/g, "")     // Xóa Phần X
        .replace(/season\s+\d+/g, "")    // Xóa Season X
        .replace(/ss\d+/g, "")           // Xóa SSX
        .replace(/\d+$/g, "")            // Xóa số ở cuối
        .trim();
};

interface SidebarSectionProps {
    title: string;
    apiUrl: string;
    type: 'rank' | 'simple';
}

const SidebarSection = ({ title, apiUrl, type }: SidebarSectionProps) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Determine target limit and URL logic
                const isWeekly = title.toLowerCase().includes("tuần");
                const isSeries = title.toLowerCase().includes("bộ");

                // Fetch more items initially to allow for deduplication
                // (especially for weekly updates where many items might be different episodes of the same series)
                const fetchLimit = isWeekly ? 40 : (isSeries ? 30 : 20);

                let finalUrl = apiUrl;
                // Ensure URL has the limit parameter correctly
                if (finalUrl.includes("?")) {
                    finalUrl = finalUrl.includes("limit=") ? finalUrl : `${finalUrl}&limit=${fetchLimit}`;
                } else {
                    finalUrl = `${finalUrl}?limit=${fetchLimit}`;
                }

                // 2. Fetch data via proxy
                const res = await axios.get(`/api/proxy?url=${encodeURIComponent(finalUrl)}`);

                // API phim mới cập nhật trả về res.data.items
                // API v1 (phim bộ/lẻ) trả về res.data.data.items
                let items = res.data?.data?.items || res.data?.items || [];

                if (items.length > 0) {
                    // Nếu là danh sách cần phim đánh giá cao (Phim bộ)
                    if (title.includes("bộ")) {
                        const seenNames = new Set();
                        items = items
                            .map((m: any) => ({
                                ...m,
                                rating: m.tmdb?.vote_average || 0,
                                normalizedName: normalizeMovieName(m.name)
                            }))
                            .filter((m: any) => {
                                if (seenNames.has(m.normalizedName)) return false;
                                seenNames.add(m.normalizedName);
                                return true;
                            })
                            .sort((a: any, b: any) => b.rating - a.rating)
                            .slice(0, 10);
                    } else {
                        // Top tuần: Lọc trùng và lấy phim mới nhất
                        const seenNames = new Set();
                        items = items
                            .filter((m: any) => {
                                const norm = normalizeMovieName(m.name);
                                if (seenNames.has(norm)) return false;
                                seenNames.add(norm);
                                return true;
                            })
                            .slice(0, 10);
                    }

                    setMovies(items);
                }
            } catch (err) {
                console.error(`Error fetching sidebar ${title}:`, err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [apiUrl, title]);

    return (
        <div className="bg-[#14233e]/40 border border-white/5 rounded-2xl p-5 mb-6 shadow-xl">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/5">
                <div className="w-1 h-5 bg-amber-400 rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">{title}</h3>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton width={type === 'rank' ? 20 : 0} height={20} className={type === 'rank' ? "mt-4" : "hidden"} />
                            <Skeleton width={45} height={65} className="rounded-md shrink-0" />
                            <div className="flex-grow pt-1">
                                <Skeleton width="80%" height={14} className="mb-2" />
                                <Skeleton width="40%" height={10} />
                            </div>
                        </div>
                    ))
                ) : (
                    movies.map((movie, index) => {
                        return (
                            <Link
                                key={movie._id}
                                href={`/phim/${movie.slug}`}
                                className="group flex items-center gap-3 hover:bg-white/5 p-1 -m-1 rounded-xl transition-all duration-300"
                            >
                                {type === 'rank' && (
                                    <span className={`text-sm font-black w-5 shrink-0 ${index === 0 ? "text-amber-400 scale-125" :
                                        index === 1 ? "text-slate-300" :
                                            index === 2 ? "text-orange-400" : "text-white/20"
                                        }`}>
                                        {index + 1}.
                                    </span>
                                )}
                                <div className={`relative shrink-0 overflow-hidden rounded-lg shadow-lg border border-white/10 ${type === 'rank' ? 'w-11 h-15' : 'w-12 h-16'}`}>
                                    <Image
                                        src={movie.poster_url || movie.thumb_url || ""}
                                        alt={movie.name}
                                        fill
                                        sizes="50px"
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h4 className="text-[13px] font-bold text-white/90 group-hover:text-amber-400 transition-colors line-clamp-1 leading-tight mb-1">
                                        {decodeHtml(movie.name)}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-white/40 font-medium">
                                        <span className="flex items-center gap-0.5 text-amber-500/80">
                                            <Star size={10} fill="currentColor" />
                                            {movie.tmdb?.vote_average ? movie.tmdb.vote_average.toFixed(1) : "8.5"}
                                        </span>
                                        <span>•</span>
                                        <span>{movie.year || "2024"}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5">
                                            <Eye size={10} />
                                            {Math.floor(Math.random() * 500) + 100}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default function Sidebar() {
    return (
        <aside className="w-full space-y-2">
            <SidebarSection
                title="Top phim tuần"
                apiUrl="https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3"
                type="rank"
            />
            <SidebarSection
                title="Top phim bộ"
                apiUrl="https://phimapi.com/v1/api/danh-sach/phim-bo"
                type="simple"
            />

            {/* Promo block */}
            <div className="bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                <Zap className="absolute -right-2 -bottom-2 w-24 h-24 text-white/5 opacity-20 group-hover:scale-110 transition-transform duration-700" />
                <h4 className="text-sm font-bold text-white mb-2 relative z-10">Trải nghiệm VIP</h4>
                <p className="text-[11px] text-white/60 mb-3 relative z-10 leading-relaxed">Xem phim không quảng cáo, chất lượng 4K cực đỉnh chỉ có tại LoFilm.</p>
                <button className="text-[10px] font-bold uppercase tracking-widest bg-amber-400 text-black px-4 py-2 rounded-lg hover:bg-white transition-colors relative z-10">
                    Khám phá ngay
                </button>
            </div>
        </aside>
    );
}
