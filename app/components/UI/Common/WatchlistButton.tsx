"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useWatchlist } from "@/app/(pages)/phim/[slug]/[episodeSlug]/hooks/useWatchlist";
import { Movie } from "@/app/types/movie";
import { Bookmark } from "lucide-react";

interface WatchlistButtonProps {
    movie: Movie;
    className?: string;
    iconSize?: number;
}

export default function WatchlistButton({ movie, className = "", iconSize = 18 }: WatchlistButtonProps) {
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const { isInWatchlist, toggleWatchlist } = useWatchlist(
        user,
        movie.slug,
        movie.name,
        movie.poster_url || "",
        movie.thumb_url
    );

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWatchlist();
            }}
            className={`cursor-pointer transition-all duration-300 flex items-center justify-center ${className}`}
            aria-label={isInWatchlist ? "Xóa khỏi danh sách xem sau" : "Thêm vào danh sách xem sau"}
            title={isInWatchlist ? "Xóa khỏi danh sách xem sau" : "Thêm vào danh sách xem sau"}
        >
            <Bookmark
                size={iconSize}
                fill={isInWatchlist ? "#f59e0b" : "none"}
                className={`${isInWatchlist ? "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-white/60 group-hover:text-amber-400"} transition-all duration-300 transform active:scale-95`}
            />
        </button>
    );
}
