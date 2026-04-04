"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, AlertTriangle, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Hls from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import Container from "@/app/components/Container";
import PlayerControls from "./PlayerControls";
import EpisodeList from "./EpisodeList";
import Sidebar from "./Sidebar";
import MovieHeader from "./MovieHeader";
import MovieInfo from "./MovieInfo";
import { getImageUrl } from "@/app/utils/movieUtils";

interface WatchClientProps {
    slug: string;
    episodeSlug: string;
    movie: {
        name: string;
        origin_name: string;
        thumb_url: string;
        poster_url: string;
        content: string;
        quality: string;
        episode_current: string;
        actors: string[];
        tmdb?: {
            vote_average: number;
        };
    };
    episode: {
        name: string;
        link_m3u8: string;
    };
    episodes: Array<{
        server_name: string;
        server_data: Array<{
            name: string;
            slug: string;
            filename: string;
            link_embed: string;
            link_m3u8: string;
        }>;
    }>;
    suggestedMovies: any[];
}

export default function WatchClient({
    slug,
    episodeSlug,
    movie,
    episode,
    episodes,
    suggestedMovies
}: WatchClientProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [activeServerIndex, setActiveServerIndex] = useState(0);
    const [hasError, setHasError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const plyrRef = useRef<Plyr | null>(null);

    // Reset lỗi khi đổi server hoặc tập phim
    useEffect(() => {
        setHasError(false);
    }, [activeServerIndex, episodeSlug]);

    // Tìm link video dựa trên server đang chọn và episodeSlug
    const videoSrc = useMemo(() => {
        if (!episodes || episodes.length === 0) return episode.link_m3u8;

        const server = episodes[activeServerIndex] || episodes[0];
        const found = server.server_data.find((ep) => ep.slug === episodeSlug);

        if (found) return found.link_m3u8;

        // Fallback: Tìm ở bất kỳ server nào nếu server hiện tại không có
        for (const s of episodes) {
            const f = s.server_data.find((ep) => ep.slug === episodeSlug);
            if (f) return f.link_m3u8;
        }

        return episode.link_m3u8;
    }, [activeServerIndex, episodeSlug, episodes, episode.link_m3u8]);

    // Hàm cập nhật chất lượng (Resolution)
    const updateQuality = (newQuality: number) => {
        if (!hlsRef.current) return;
        if (newQuality === 0) {
            hlsRef.current.currentLevel = -1; // Auto
        } else {
            hlsRef.current.levels.forEach((level, levelIndex) => {
                if (level.height === newQuality) {
                    hlsRef.current!.currentLevel = levelIndex;
                }
            });
        }
    };

    useEffect(() => {
        let isMounted = true;
        const video = videoRef.current;
        if (!video) return;

        // Cấu hình Plyr cơ bản
        const defaultOptions: Plyr.Options = {
            captions: { active: true, update: true, language: 'vi' },
            controls: [
                'play-large', 'play', 'rewind', 'fast-forward',
                'progress', 'current-time', 'duration',
                'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
            ],
            settings: ['quality', 'speed', 'loop'],
            i18n: {
                restart: 'Xem lại',
                rewind: 'Tua lại 10s',
                play: 'Phát',
                pause: 'Tạm dừng',
                forward: 'Tua tới 10s',
                fastForward: 'Tua tới 10s',
                quality: 'Chất lượng',
                speed: 'Tốc độ',
                loop: 'Vòng lặp',
                mute: '',
                unmute: '',
                settings: 'Cài đặt',
                enterFullscreen: 'Toàn màn hình',
                exitFullscreen: 'Thoát toàn màn hình',
            },
            tooltips: { controls: true, seek: true },
            seekTime: 10
        };

        // Đợi 1 nhịp để DOM ổn định sau navigation
        const initTimeout = setTimeout(() => {
            if (!isMounted || !videoRef.current) return;

            const player = new Plyr(videoRef.current, defaultOptions);
            plyrRef.current = player;

            if (Hls.isSupported() && videoSrc.endsWith('.m3u8')) {
                const hls = new Hls({
                    capLevelToPlayerSize: true,
                    autoStartLoad: true,
                    startLevel: -1,
                });
                hls.loadSource(videoSrc);
                hls.attachMedia(videoRef.current);
                hlsRef.current = hls;

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        setHasError(true);
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                            case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
                            default: hls.destroy(); break;
                        }
                    }
                });
            } else {
                videoRef.current.src = videoSrc;
            }
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(initTimeout);
            if (plyrRef.current) {
                try { plyrRef.current.destroy(); } catch (e) { }
            }
            if (hlsRef.current) {
                try { hlsRef.current.destroy(); } catch (e) { }
            }
        };
    }, [videoSrc]);

    // Xử lý phím tắt Space (Play/Pause) toàn cục
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.keyCode === 32) {
                const target = e.target as HTMLElement;
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
                    return;
                }

                if (plyrRef.current) {
                    e.preventDefault();
                    plyrRef.current.togglePlay();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Đồng bộ class theater-mode cho body
    useEffect(() => {
        if (isTheaterMode) {
            document.body.classList.add('theater-mode');
        } else {
            document.body.classList.remove('theater-mode');
        }
        return () => document.body.classList.remove('theater-mode');
    }, [isTheaterMode]);

    return (
        <div className={`pt-35 ${isTheaterMode ? "pb-4 min-h-0" : "pb-12 min-h-screen"} bg-[#0a1628] transition-all duration-500`}>
            {/* Watch Header (Catalog) */}
            <AnimatePresence>
                {!isTheaterMode && (
                    <MovieHeader 
                        slug={slug} 
                        movieName={movie.name} 
                        episodeName={episode.name} 
                    />
                )}
            </AnimatePresence>

            <div className={`transition-all duration-500 ease-in-out relative ${isExpanded ? 'w-full' : 'max-w-[1900px] mx-auto px-5 lg:px-12'}`}>
                {/* Plyr Video Section */}
                <div 
                    key={videoSrc}
                    className={`
                        aspect-video w-full bg-black/40 border border-white/5 relative overflow-hidden shadow-2xl transition-all duration-500 z-10
                        ${isExpanded ? 'rounded-none border-x-0' : 'rounded-2xl'}
                        [--plyr-color-main:#f59e0b]
                    `}
                >
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        playsInline
                        poster={getImageUrl(movie.thumb_url)}
                    />

                    {/* Lỗi luồng phát Overlay */}
                    <AnimatePresence>
                        {hasError && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center"
                            >
                                <div className="flex flex-col items-center max-w-sm">
                                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                                        <AlertTriangle size={32} className="text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 font-montserrat uppercase tracking-wider">Link phim bị lỗi (404)</h3>
                                    <p className="text-white/60 text-sm mb-8 leading-relaxed">
                                        Máy chủ hiện không phản hồi luồng phát này. Vui lòng **thử đổi sang Server khác** bên dưới.
                                    </p>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => window.location.reload()}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                                        >
                                            <RefreshCcw size={14} /> Tải lại trang
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const el = document.querySelector('.wc-main');
                                                el?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 rounded-xl text-xs font-bold text-[#0a1628] transition-all cursor-pointer"
                                        >
                                            Đổi Server khác
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative z-20">
                    <PlayerControls
                        isExpanded={isExpanded}
                        onToggleExpanded={() => setIsExpanded(!isExpanded)}
                        isTheaterMode={isTheaterMode}
                        onToggleTheater={() => setIsTheaterMode(!isTheaterMode)}
                        episodes={episodes}
                        activeServer={activeServerIndex}
                        onServerChange={setActiveServerIndex}
                    />
                </div>
            </div>

            {/* Watch Content Area (wc-main) */}
            <AnimatePresence>
                {!isTheaterMode && (
                    <motion.div
                        key="watch-content"
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 32 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <Container className="wc-main">
                            <div className="flex flex-col xl:flex-row gap-8">
                                <div className="flex-1">
                                    <div className="flex flex-col gap-6 p-5 md:p-10 bg-white/[0.03] border border-white/10 rounded-3xl shadow-2xl">
                                        <MovieInfo 
                                            slug={slug} 
                                            movie={movie} 
                                            episode={episode} 
                                        />
                                        <EpisodeList
                                            slug={slug}
                                            currentEpisode={episodeSlug}
                                            episodes={episodes}
                                            activeServer={activeServerIndex}
                                            onServerChange={setActiveServerIndex}
                                        />
                                    </div>
                                </div>

                                <div className="w-full xl:w-100">
                                    <Sidebar movie={movie} suggestedMovies={suggestedMovies} />
                                </div>
                            </div>
                        </Container>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
