"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SmartImage from "../Common/SmartImage";
import axios from "axios";
import { Star, Eye } from "lucide-react";
import { Movie } from "@/app/types/movie";
import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import { decodeHtml } from "@/app/utils/textUtils";
import Skeleton from "../Skeleton/Skeleton";

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
    limit?: number;
}

const SidebarSection = ({ title, apiUrl, type, limit = 10 }: SidebarSectionProps) => {
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
                            .slice(0, limit);
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
                            .slice(0, limit);
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
        <div key={isLoading ? 'loading' : 'loaded'} className="bg-[#14233e]/40 border border-white/10 rounded-2xl p-5 mb-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/10">
                <div className="w-1 h-5 bg-amber-400 rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">{title}</h3>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    [...Array(limit > 5 ? 6 : limit)].map((_, i) => (
                        <div key={i} className="flex gap-3">
                            {type === 'rank' && <Skeleton className="w-5 h-5 mt-4 opacity-20" rounded="sm" />}
                            <Skeleton className="w-11 h-15 rounded-lg shrink-0" />
                            <div className="flex-grow pt-1 space-y-2">
                                <Skeleton className="w-full h-4" rounded="md" />
                                <Skeleton className="w-1/2 h-3 opacity-50" rounded="sm" />
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
                                <div className={`relative shrink-0 overflow-hidden rounded-lg ${type === 'rank' ? 'w-11 h-15' : 'w-12 h-16'}`}>
                                    <SmartImage
                                        src={getImageUrl(movie.poster_url || movie.thumb_url || "", { width: 100, quality: 60 })}
                                        rawSrc={getRawImageUrl(movie.poster_url || movie.thumb_url)}
                                        alt={movie.name}
                                        fill
                                        sizes="50px"
                                        priority={index < 5}
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />

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

interface SidebarProps {
    weeklyLimit?: number;
    seriesLimit?: number;
}

export default function Sidebar({ weeklyLimit = 10, seriesLimit = 5 }: SidebarProps) {
    return (
        <aside className="w-full space-y-2">
            <SidebarSection
                title="Top phim tuần"
                apiUrl="https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3"
                type="rank"
                limit={weeklyLimit}
            />
            <SidebarSection
                title="Top phim bộ"
                apiUrl="https://phimapi.com/v1/api/danh-sach/phim-bo"
                type="simple"
                limit={seriesLimit}
            />

        </aside>
    );
}
