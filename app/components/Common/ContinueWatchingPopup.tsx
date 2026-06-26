"use client";

import { useEffect, useState } from "react";
import { Play, X, Clock } from "lucide-react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import SmartImage from "@/app/components/Common/SmartImage";
import { usePathname } from "next/navigation";

interface WatchHistoryItem {
    movie_slug: string;
    episode_slug: string;
    movie_name: string;
    movie_poster: string;
    episode_name: string;
    watched_seconds: number;
    duration: number;
    updated_at: number;
}

export default function ContinueWatchingPopup() {
    const [recentMovie, setRecentMovie] = useState<WatchHistoryItem | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Delay slighty so it doesn't pop up too aggressively on initial load
        const timer = setTimeout(() => {
            try {
                const GUEST_HISTORY_KEY = 'lofilm-guest-watch-history';
                
                const historyStr = localStorage.getItem(GUEST_HISTORY_KEY);
                
                if (!historyStr) return;
                
                const history: Record<string, WatchHistoryItem> = JSON.parse(historyStr);
                const movies = Object.values(history);
                
                if (movies.length === 0) return;
                
                // Sort by most recently updated
                movies.sort((a, b) => b.updated_at - a.updated_at);
                
                const mostRecent = movies[0];

                // Conditions to show:
                // 1. Watched more than 30 seconds
                // 2. Not finished (less than 95% complete)
                // 3. Duration is valid (> 0)
                if (
                    mostRecent.duration > 0 &&
                    mostRecent.watched_seconds > 30 &&
                    (mostRecent.watched_seconds / mostRecent.duration) < 0.95
                ) {
                    setRecentMovie(mostRecent);
                    
                    // Delay a tiny bit to allow the component to mount in the hidden state before transitioning
                    setTimeout(() => {
                        setIsVisible(true);
                    }, 50);
                }
            } catch (e) {
                console.error("Error reading watch history for popup:", e);
            }
        }, 3000); // Show after 3 seconds

        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsVisible(false);
        setTimeout(() => setIsDismissed(true), 500); // Wait for transition
    };

    // Ẩn ở trang auth và trang xem phim
    if (!recentMovie || isDismissed || pathname === '/dang-nhap' || pathname === '/dat-lai-mat-khau' || pathname.includes('/phim/')) return null;

    const progressPercent = Math.min(100, Math.max(0, (recentMovie.watched_seconds / recentMovie.duration) * 100));
    
    // Format mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const friendlyEpisodeName = (() => {
        const rawName = recentMovie.episode_name || "";
        const displayName = rawName.replace(/Tập\s*/i, "").trim();
        if (!displayName || /^0+$/.test(displayName) || displayName.toLowerCase() === "trailer") {
            return "Trailer";
        }
        return `Tập ${displayName.replace(/^0+(?=\d)/, "")}`;
    })();

    return (
        <div className={`fixed z-[90] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] 
            /* Mobile: Bottom Center */
            bottom-8 left-4 right-4 
            /* Tablet/Desktop: Bottom Right */
            md:bottom-8 md:right-8 md:left-auto md:w-[460px] xl:w-[520px]
            ${isVisible 
                ? "translate-y-0 md:translate-x-0 opacity-100" 
                : "translate-y-[150%] md:translate-y-0 md:translate-x-[150%] opacity-0 pointer-events-none"
            }
        `}>
            <TransitionLink 
                href={`/phim/${recentMovie.movie_slug}/${recentMovie.episode_slug}`}
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => setIsDismissed(true), 500);
                }}
                className="relative flex items-stretch gap-4 md:gap-5 xl:gap-6 p-3 md:p-4 xl:p-5 pr-4 md:pr-6 xl:pr-8 bg-[#12223a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] hover:bg-[#172a48] transition-colors group overflow-hidden"
            >
                {/* Close Button */}
                <button 
                    onClick={handleDismiss}
                    className="absolute cursor-pointer top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-white/50 hover:text-white hover:bg-black/80 transition-colors z-10"
                    aria-label="Đóng thông báo"
                >
                    <X size={14} strokeWidth={2.5} />
                </button>

                {/* Poster Thumbnail */}
                <div className="relative w-[100px] h-[65px] md:w-[120px] md:h-[78px] xl:w-[140px] xl:h-[91px] rounded-lg overflow-hidden shrink-0 border border-white/5 bg-black/50">
                    <SmartImage 
                        src={getImageUrl(recentMovie.movie_poster, { width: 300, quality: 80 })}
                        rawSrc={getRawImageUrl(recentMovie.movie_poster)}
                        alt={recentMovie.movie_name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100px, (max-width: 1280px) 120px, 140px"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-500/90 text-black flex items-center justify-center pl-0.5 shadow-lg transform group-hover:scale-110 transition-transform">
                            <Play className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" />
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center flex-1 min-w-0 py-1 md:py-2">
                    <div className="flex items-center gap-1.5 mb-1 md:mb-1.5">
                        <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
                        <span className="text-[10px] md:text-xs xl:text-[13px] font-bold text-amber-400 uppercase">
                            Tiếp tục xem
                        </span>
                    </div>
                    <h4 className="text-sm md:text-base xl:text-lg font-bold text-white/90 truncate mb-1">
                        {recentMovie.movie_name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-white/50">
                        <span className="font-medium text-white/70">{friendlyEpisodeName}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{formatTime(recentMovie.watched_seconds)}</span>
                    </div>
                </div>

                {/* Progress Bar Absolute Bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                    <div 
                        className="h-full bg-amber-500 rounded-r-full transition-all duration-1000 ease-out"
                        style={{ width: isVisible ? `${progressPercent}%` : '0%' }}
                    />
                </div>
            </TransitionLink>
        </div>
    );
}
