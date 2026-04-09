import { useRef } from "react";
import { createClient } from "@/app/utils/supabase/client";

export const useWatchHistory = (user: any, slug: string, movie: any, episode: any, episodeSlug: string) => {
    const supabase = createClient();
    const lastSavedTime = useRef(0);

    const saveProgress = async (currentTime: number, duration: number) => {
        if (!user || !currentTime || duration <= 0) return;

        // Chỉ lưu sau mỗi 10s để giảm tải API
        if (Math.abs(currentTime - lastSavedTime.current) < 10) return;
        lastSavedTime.current = currentTime;

        const { error } = await supabase.from('watch_history').upsert({
            user_id: user.id,
            movie_slug: slug,
            movie_name: movie.name,
            movie_poster: movie.thumb_url || movie.poster_url,
            episode_name: episode.name,
            episode_slug: episodeSlug,
            watched_seconds: Math.floor(currentTime),
            duration: Math.floor(duration),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,movie_slug,episode_slug' });

        if (error) console.error("Lỗi khi lưu lịch sử xem:", error.message);
    };

    const fetchWatchedProgress = async () => {
        if (!user) return 0;
        const { data } = await supabase
            .from('watch_history')
            .select('watched_seconds')
            .eq('user_id', user.id)
            .eq('movie_slug', slug)
            .eq('episode_slug', episodeSlug)
            .single();

        return data?.watched_seconds && data.watched_seconds > 10 ? data.watched_seconds : 0;
    };

    return { saveProgress, fetchWatchedProgress };
};
