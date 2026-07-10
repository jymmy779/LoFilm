import { useRef, useCallback } from "react";
import { createClient } from "@/app/utils/supabase/client";

interface Movie {
    name: string;
    thumb_url: string;
    poster_url: string;
}

interface Episode {
    name: string;
}

export const useWatchProgress = (
    user: any,
    slug: string,
    episodeSlug: string,
    movie: Movie,
    episode: Episode
) => {
    const supabase = createClient();
    const lastSavedTime = useRef(0);
    const lastSavedTimeDB = useRef(0);

    const watchTimeAccumulator = useRef(0);
    const hasRecordedView = useRef(false);
    const lastUpdateTimestamp = useRef(0);

    const userRef = useRef(user);
    userRef.current = user;

    const recordViewToSupabase = useCallback(async () => {
        const sessionKey = `viewed_${slug}`;
        if (typeof window !== "undefined" && sessionStorage.getItem(sessionKey)) return;

        try {
            let deviceId = localStorage.getItem("lofilm_device_id");
            if (!deviceId) {
                deviceId = "dev-" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
                localStorage.setItem("lofilm_device_id", deviceId);
            }

            let ip = "unknown";
            try {
                const ipRes = await fetch("https://api.ipify.org?format=json");
                if (ipRes.ok) {
                    const ipData = await ipRes.json();
                    ip = ipData.ip;
                }
            } catch (e) { }

            const { error } = await supabase.rpc("record_movie_view", {
                p_movie_slug: slug,
                p_ip: ip,
                p_user_id: userRef.current?.id || null,
                p_device_id: deviceId,
            });

            if (!error) {
                sessionStorage.setItem(sessionKey, "true");
            } else {
                console.error("RPC View Error:", error.message);
            }
        } catch (err) {
            console.error("System error recording view:", err);
        }
    }, [slug, supabase]);

    const saveProgress = useCallback(
        async (currentTime: number, duration: number, forceDbSync = false) => {
            if (!currentTime || duration <= 0) return;

            const currentUser = userRef.current;
            const timeDiff = Math.abs(currentTime - lastSavedTime.current);
            const dbTimeDiff = Math.abs(currentTime - lastSavedTimeDB.current);

            // 1. Lưu LocalStorage mỗi 10s (rất nhẹ, không tốn tài nguyên)
            if (timeDiff >= 10) {
                lastSavedTime.current = currentTime;
                try {
                    const HISTORY_KEY = currentUser ? `lofilm-watch-history-${currentUser.id}` : "lofilm-guest-watch-history";
                    const historyStr = localStorage.getItem(HISTORY_KEY);
                    let history = historyStr ? JSON.parse(historyStr) : {};

                    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
                    const now = Date.now();
                    Object.keys(history).forEach((key) => {
                        if (now - history[key].updated_at > SEVEN_DAYS_MS) {
                            delete history[key];
                        }
                    });

                    history[`${slug}/${episodeSlug}`] = {
                        movie_slug: slug,
                        episode_slug: episodeSlug,
                        movie_name: movie.name,
                        movie_poster: movie.poster_url || movie.thumb_url,
                        episode_name: episode.name,
                        watched_seconds: Math.floor(currentTime),
                        duration: Math.floor(duration),
                        updated_at: now,
                    };

                    const keys = Object.keys(history);
                    if (keys.length > 40) {
                        const oldestKey = keys.sort((a, b) => history[a].updated_at - history[b].updated_at)[0];
                        delete history[oldestKey];
                    }

                    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
                } catch (e) {
                    console.error("Error saving progress to localStorage:", e);
                }
            }

            // 2. Lưu Database Supabase mỗi 60s HOẶC khi bị ép (pause, close) để chống quá tải DB
            if (currentUser && (dbTimeDiff >= 60 || forceDbSync)) {
                lastSavedTimeDB.current = currentTime;
                await supabase.from("watch_history").upsert(
                    {
                        user_id: currentUser.id,
                        movie_slug: slug,
                        movie_name: movie.name,
                        movie_poster: movie.poster_url || movie.thumb_url,
                        episode_name: episode.name,
                        episode_slug: episodeSlug,
                        watched_seconds: Math.floor(currentTime),
                        duration: Math.floor(duration),
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id,movie_slug,episode_slug" }
                );
            }
        },
        [slug, episodeSlug, movie, episode, supabase]
    );

    const handleTimeUpdate = useCallback(
        (currentTime: number, duration: number, isPaused: boolean) => {
            if (!hasRecordedView.current && !isPaused) {
                const now = Date.now();
                if (lastUpdateTimestamp.current > 0) {
                    const delta = (now - lastUpdateTimestamp.current) / 1000;
                    if (delta > 0 && delta < 2) {
                        watchTimeAccumulator.current += delta;
                    }
                }
                lastUpdateTimestamp.current = now;

                if (watchTimeAccumulator.current >= 120 || currentTime >= 120) {
                    hasRecordedView.current = true;
                    recordViewToSupabase();
                }
            }

            saveProgress(currentTime, duration);
        },
        [saveProgress, recordViewToSupabase]
    );

    return {
        saveProgress,
        handleTimeUpdate,
    };
};
