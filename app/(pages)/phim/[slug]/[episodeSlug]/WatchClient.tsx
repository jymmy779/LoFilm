"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { ChevronRight, AlertTriangle, RefreshCcw, List, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Hls from "hls.js";
// @ts-ignore
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import Container from "@/app/components/Container";
import PlayerControls from "./PlayerControls";
import EpisodeList from "./EpisodeList";
import Sidebar from "./Sidebar";
import MovieHeader from "./MovieHeader";
import MovieInfo from "./MovieInfo";
import CommentSection from "@/app/components/Comments/CommentSection";
import ReportModal from "@/app/components/Common/ReportModal";
import { getImageUrl, getFriendlyEpisodeSlug } from "@/app/utils/movieUtils";
import { useAuth } from "@/app/components/Auth/AuthContext";
import { toast } from "react-hot-toast";
import { MdReplay10, MdForward10 } from "react-icons/md";
import { renderToStaticMarkup } from "react-dom/server";
import { createPortal } from "react-dom";
import { createClient } from "@/app/utils/supabase/client";

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
            id?: string;
            type?: string;
            vote_average?: number;
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
    const router = useRouter();
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isAutoNext, setIsAutoNext] = useState(true);
    const [activeServerIndex, setActiveServerIndex] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const userRef = useRef<any>(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [slug, episodeSlug]);

    useEffect(() => { userRef.current = user; }, [user]);
    const autoNextRef = useRef(isAutoNext);
    useEffect(() => { autoNextRef.current = isAutoNext; }, [isAutoNext]);

    const [hasResumed, setHasResumed] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);

    const [showEndOverlay, setShowEndOverlay] = useState(false);
    const showEndOverlayRef = useRef(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [plyrContainer, setPlyrContainer] = useState<HTMLElement | null>(null);
    const [showEpisodeOverlay, setShowEpisodeOverlay] = useState(false);
    const [isChangingEpisode, setIsChangingEpisode] = useState(false);

    useEffect(() => { showEndOverlayRef.current = showEndOverlay; }, [showEndOverlay]);

    const watchTimeAccumulator = useRef(0);
    const hasRecordedView = useRef(false);
    const lastUpdateTimestamp = useRef(0);

    const supabase = createClient();

    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const plyrRef = useRef<Plyr | null>(null);

    const currentIndex = useMemo(() => {
        if (!episodes || episodes.length === 0) return -1;
        const server = episodes[activeServerIndex] || episodes[0];
        const cleanTargetSlug = episodeSlug.replace(/^tap-/, "").toLowerCase();

        return server.server_data.findIndex((ep: any) => {
            const epSlug = ep.slug.toLowerCase();
            const epCleanSlug = epSlug.replace(/^tap-/, "");

            return (
                epSlug === episodeSlug ||
                epSlug === cleanTargetSlug ||
                epCleanSlug === cleanTargetSlug ||
                (episodeSlug === "tap-full" && epSlug === "full") ||
                ep.name.toLowerCase() === `tập ${cleanTargetSlug}` ||
                ep.name.toLowerCase() === `tập ${cleanTargetSlug.replace(/^0+/, "")}` ||
                ep.name.toLowerCase() === cleanTargetSlug ||
                epCleanSlug.replace(/^0+/, "") === cleanTargetSlug.replace(/^0+/, "")
            );
        });
    }, [episodes, activeServerIndex, episodeSlug]);

    const nextEpisode = useMemo(() => {
        if (!episodes || episodes.length === 0 || currentIndex === -1) return null;
        const server = episodes[activeServerIndex] || episodes[0];
        if (currentIndex < server.server_data.length - 1) {
            return server.server_data[currentIndex + 1];
        }
        return null;
    }, [episodes, activeServerIndex, currentIndex]);

    const isSeries = useMemo(() => {
        if (!episodes || episodes.length === 0) return false;
        const server = episodes[0];
        return server.server_data.length > 1;
    }, [episodes]);

    useEffect(() => {
        setHasError(false);
    }, [activeServerIndex, episodeSlug]);

    const videoSrc = useMemo(() => {
        if (!episodes || episodes.length === 0) return episode.link_m3u8;
        const server = episodes[activeServerIndex] || episodes[0];
        const found = server.server_data.find((ep) => getFriendlyEpisodeSlug(ep.slug) === episodeSlug);
        if (found) return found.link_m3u8;
        for (const s of episodes) {
            const f = s.server_data.find((ep) => getFriendlyEpisodeSlug(ep.slug) === episodeSlug);
            if (f) return f.link_m3u8;
        }
        return episode.link_m3u8;
    }, [activeServerIndex, episodeSlug, episodes, episode.link_m3u8]);


    useEffect(() => {
        setShowEndOverlay(false);
        setIsChangingEpisode(false);
    }, [episodeSlug]);

    useEffect(() => {
        const savedAutoNext = localStorage.getItem('lofilm-auto-next');
        if (savedAutoNext !== null) {
            setIsAutoNext(savedAutoNext === 'true');
        }
    }, []);

    const toggleAutoNext = () => {
        const newValue = !isAutoNext;
        setIsAutoNext(newValue);
        localStorage.setItem('lofilm-auto-next', String(newValue));
    };

    useEffect(() => {
        const checkStatus = async () => {
            if (user) {
                // Check Fav
                const { data: favData } = await supabase
                    .from('favorites')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('movie_slug', slug)
                    .maybeSingle();
                if (favData) setIsFavorited(true);

                // Check Watchlist
                const { data: watchData } = await supabase
                    .from('watchlist')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('movie_slug', slug)
                    .maybeSingle();
                if (watchData) setIsInWatchlist(true);
            }
        };
        checkStatus();
    }, [slug, supabase, user]);

    const toggleFavorite = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để lưu phim yêu thích!");
            return;
        }
        const prevStatus = isFavorited;
        setIsFavorited(!isFavorited);
        try {
            if (prevStatus) {
                const { error } = await supabase.from('favorites').delete().eq('movie_slug', slug).eq('user_id', user.id);
                if (error) throw error;
                toast.success("Đã xóa khỏi danh sách yêu thích");
            } else {
                const { error } = await supabase.from('favorites').insert({
                    user_id: user.id,
                    movie_slug: slug,
                    movie_name: movie.name,
                    movie_poster: movie.thumb_url || movie.poster_url
                });
                if (error) throw error;
                toast.success("Đã thêm vào danh sách yêu thích");
            }
        } catch (err: any) {
            setIsFavorited(prevStatus);
            toast.error("Lỗi: " + err.message);
        }
    };

    const toggleWatchlist = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để thêm vào danh sách xem sau!");
            return;
        }
        const prevStatus = isInWatchlist;
        setIsInWatchlist(!isInWatchlist);
        try {
            if (prevStatus) {
                const { error } = await supabase.from('watchlist').delete().eq('movie_slug', slug).eq('user_id', user.id);
                if (error) throw error;
                toast.success("Đã xóa khỏi danh sách xem sau");
            } else {
                const { error } = await supabase.from('watchlist').insert({
                    user_id: user.id,
                    movie_slug: slug,
                    movie_name: movie.name,
                    movie_poster: movie.thumb_url || movie.poster_url
                });
                if (error) throw error;
                toast.success("Đã thêm vào danh sách xem sau");
            }
        } catch (err: any) {
            setIsInWatchlist(prevStatus);
            toast.error("Lỗi: " + err.message);
        }
    };

    const lastSavedTime = useRef(0);
    const saveProgress = async (currentTime: number, duration: number) => {
        const currentUser = userRef.current;
        if (!currentUser || !currentTime || duration <= 0) return;
        if (Math.abs(currentTime - lastSavedTime.current) < 10) return;
        lastSavedTime.current = currentTime;
        await supabase.from('watch_history').upsert({
            user_id: currentUser.id,
            movie_slug: slug,
            movie_name: movie.name,
            movie_poster: movie.thumb_url || movie.poster_url,
            episode_name: episode.name,
            episode_slug: episodeSlug,
            watched_seconds: Math.floor(currentTime),
            duration: Math.floor(duration),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,movie_slug,episode_slug' });
    };

    // Function to call Supabase RPC and record a valid view
    const recordViewToSupabase = async () => {
        const sessionKey = `viewed_${slug}`;
        if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) return;

        try {
            let deviceId = localStorage.getItem("lofilm_device_id");
            if (!deviceId) {
                deviceId = "dev-" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
                localStorage.setItem("lofilm_device_id", deviceId);
            }

            let ip = "unknown";
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                if (ipRes.ok) {
                    const ipData = await ipRes.json();
                    ip = ipData.ip;
                }
            } catch (e) { }

            const { error } = await supabase.rpc('record_movie_view', {
                p_movie_slug: slug,
                p_ip: ip,
                p_user_id: userRef.current?.id || null,
                p_device_id: deviceId
            });

            if (!error) {
                sessionStorage.setItem(sessionKey, 'true');
                console.log("Recorded view successfully");
            } else {
                console.error("RPC View Error:", error.message);
            }
        } catch (err) {
            console.error("System error recording view:", err);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const video = videoRef.current;
        if (!video) return;

        const defaultOptions: Plyr.Options = {
            captions: { active: true, update: true, language: 'vi' },
            controls: [
                'play-large', 'progress', 'play', 'rewind', 'fast-forward',
                'current-time', 'duration', 'mute', 'volume', 'captions',
                'pip', 'airplay', 'fullscreen'
            ],
            i18n: { restart: '', rewind: '', play: '', pause: '', forward: '', fastForward: '', mute: '', unmute: '', settings: '', enterFullscreen: '', exitFullscreen: '' },
            displayDuration: true,
            fullscreen: { enabled: true, fallback: true, iosNative: true },
            storage: { enabled: false },
            tooltips: { controls: false, seek: true },
            seekTime: 10,
            loop: { active: false }
        };

        const initTimeout = setTimeout(async () => {
            if (!isMounted || !videoRef.current) return;
            let startFrom = 0;
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            if (currentUser && !hasResumed) {
                const { data: history } = await supabase
                    .from('watch_history')
                    .select('watched_seconds')
                    .eq('user_id', currentUser.id)
                    .eq('movie_slug', slug)
                    .eq('episode_slug', episodeSlug)
                    .maybeSingle(); // maybeSingle() trả về null thay vì error 406
                if (history && history.watched_seconds > 10) {
                    startFrom = history.watched_seconds;
                }
            }

            const player = new Plyr(videoRef.current, defaultOptions);
            plyrRef.current = player;

            player.on('ready', () => {
                const container = player.elements.container;
                setPlyrContainer(container);
                const muteButton = container?.querySelector('button[data-plyr="mute"]');
                if (muteButton) {
                    muteButton.addEventListener('click', (e: Event) => {
                        if (window.innerWidth < 768) {
                            e.stopImmediatePropagation();
                            e.preventDefault();
                        }
                    }, { capture: true });
                }

                const rewindBtn = container?.querySelector('button[data-plyr="rewind"]');
                const forwardBtn = container?.querySelector('button[data-plyr="fast-forward"]');
                if (rewindBtn) {
                    rewindBtn.innerHTML = renderToStaticMarkup(<MdReplay10 size={24} style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }} />);
                }
                if (forwardBtn) {
                    forwardBtn.innerHTML = renderToStaticMarkup(<MdForward10 size={24} style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }} />);
                }
            });

            player.on('play', () => {
                if (showEndOverlayRef.current) player.pause();
            });

            player.on('controlsshown', () => setControlsVisible(true));
            player.on('controlshidden', () => setControlsVisible(false));

            player.on('enterfullscreen', () => {
                if (window.innerWidth < 1024 && screen.orientation && (screen.orientation as any).lock) {
                    (screen.orientation as any).lock('landscape').catch(() => {
                        // Bỏ qua lỗi nếu trình duyệt không hỗ trợ hoặc bị chặn
                    });
                }
            });

            player.on('exitfullscreen', () => {
                if (screen.orientation && screen.orientation.unlock) {
                    try {
                        screen.orientation.unlock();
                    } catch (e) { }
                }
            });

            if (startFrom > 0 && !hasResumed) {
                player.once('ready', () => {
                    if (player.currentTime < startFrom - 5) {
                        player.currentTime = startFrom;
                        toast.success(`Đã khôi phục vị trí xem cũ: ${Math.floor(startFrom / 60)} phút`, { icon: '🕒', duration: 2500 });
                    }
                });
                setHasResumed(true);
            }

            player.on('timeupdate', () => {
                const currentTime = player.currentTime;
                const duration = player.duration;
                const remaining = duration - currentTime;

                // LOGIC TÍNH VIEW MỚI (LINH HOẠT HƠN)
                if (!hasRecordedView.current && !player.paused && player.playing) {
                    const now = Date.now();

                    // Tính thời gian xem tích lũy (duration based)
                    if (lastUpdateTimestamp.current > 0) {
                        const delta = (now - lastUpdateTimestamp.current) / 1000;
                        if (delta > 0 && delta < 2) {
                            watchTimeAccumulator.current += delta;
                        }
                    }
                    lastUpdateTimestamp.current = now;

                    // ĐIỀU KIỆN CỘNG VIEW:
                    // 1. Xem tích lũy đủ 10 giây (chứng tỏ có ý định xem)
                    // 2. HOẶC tua qua mốc 30 giây và đang bấm Play
                    if (watchTimeAccumulator.current >= 10 || currentTime >= 30) {
                        hasRecordedView.current = true;
                        recordViewToSupabase();
                    }
                }

                saveProgress(currentTime, duration);
                if (isSeries && nextEpisode && remaining <= 120 && player.duration > 0) {
                    // Pre-calculation logic if needed
                }
            });

            player.on('seeked', () => {
                if (player.duration > 0 && player.currentTime >= player.duration - 0.5) {
                    if (isSeries && nextEpisode && autoNextRef.current) {
                        player.pause();
                        setIsChangingEpisode(true);
                        router.push(`/phim/${slug}/${getFriendlyEpisodeSlug(nextEpisode.slug)}`);
                    } else if (!showEndOverlayRef.current) {
                        player.pause();
                        player.currentTime = player.duration - 0.1;
                        setShowEndOverlay(true);
                    }
                }
            });

            player.on('ended', () => {
                if (isSeries && nextEpisode && autoNextRef.current) {
                    setIsChangingEpisode(true);
                    router.push(`/phim/${slug}/${getFriendlyEpisodeSlug(nextEpisode.slug)}`);
                } else if (!showEndOverlayRef.current) {
                    player.pause();
                    player.currentTime = player.duration - 0.1;
                    setShowEndOverlay(true);
                }
            });

            if (Hls.isSupported() && videoSrc.endsWith('.m3u8')) {
                const hls = new Hls({ capLevelToPlayerSize: true, autoStartLoad: true, startLevel: -1, startPosition: startFrom > 0 ? startFrom : -1 });
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
            if (plyrRef.current) try { plyrRef.current.destroy(); } catch (e) { }
            if (hlsRef.current) try { hlsRef.current.destroy(); } catch (e) { }
        };
    }, [videoSrc, nextEpisode, slug]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.keyCode === 32) {
                const target = e.target as HTMLElement;
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
                if (plyrRef.current) {
                    e.preventDefault();
                    plyrRef.current.togglePlay();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isTheaterMode) document.body.classList.add('theater-mode');
        else document.body.classList.remove('theater-mode');
        return () => document.body.classList.remove('theater-mode');
    }, [isTheaterMode]);

    useEffect(() => {
        if (showEpisodeOverlay) {
            const activeEl = document.getElementById('active-episode');
            const container = document.getElementById('episode-list-container');
            if (activeEl && container) {
                setTimeout(() => {
                    const targetScroll = activeEl.offsetTop - container.offsetHeight / 2 + activeEl.offsetHeight / 2;
                    container.scrollTo({
                        top: targetScroll,
                        behavior: 'smooth'
                    });
                }, 100); // Đợi xíu để animation của panel kịp chạy ra
            }
        }
    }, [showEpisodeOverlay, episodeSlug, activeServerIndex]);

    return (
        <div className={`pt-35 ${isTheaterMode ? "pb-4 min-h-0" : "pb-12 min-h-screen"} bg-[#0a1628] transition-all duration-500`}>
            <AnimatePresence>
                {!isTheaterMode && (
                    <MovieHeader slug={slug} movieName={movie.name} episodeName={episode.name} />
                )}
            </AnimatePresence>

            <div className={`transition-all duration-500 ease-in-out relative ${isExpanded ? 'w-full' : 'max-w-[1900px] mx-auto px-5 lg:px-12'}`}>
                <div key={videoSrc} className={`aspect-video w-full bg-black/40 border border-white/5 relative overflow-hidden shadow-2xl transition-all duration-500 z-10 ${isExpanded ? 'rounded-none border-x-0' : 'rounded-2xl'} ${showEndOverlay ? 'hide-large-play' : ''} [--plyr-color-main:#f59e0b]`}>
                    <style jsx global>{`
                        .hide-large-play .plyr__control--overlaid { display: none !important; }
                        .plyr { z-index: auto !important; aspect-ratio: 16/9; width: 100%; border-radius: inherit; }
                        .plyr__controls { z-index: 100 !important; background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5)) !important; }
                        .hide-large-play .plyr__controls { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
                        
                        .plyr__time--current,
                        .plyr__time--duration {
                            display: block !important;
                        }
                        
                        .plyr__time + .plyr__time::before {
                            margin-right: 4px !important;
                        }

                        @media (max-width: 767px) {
                            .plyr__control {
                                padding: 5px !important;
                            }
                            .plyr__control svg {
                                width: 14px !important;
                                height: 14px !important;
                            }

                            .plyr__volume {
                                position: relative !important;
                                min-width: 32px !important;
                            }
                            .plyr__volume input {
                                position: absolute !important;
                                bottom: calc(100% + 15px) !important;
                                left: 50% !important;
                                transform: translateX(-50%) !important;
                                width: 100px !important;
                                background: rgba(10, 22, 40, 0.95) !important;
                                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                                padding: 12px 10px !important;
                                border-radius: 12px !important;
                                opacity: 0 !important;
                                pointer-events: none !important;
                                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                                z-index: 100 !important;
                                box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
                                backdrop-filter: blur(8px) !important;
                            }
                            .plyr__volume:focus-within input,
                            .plyr__volume:active input {
                                opacity: 1 !important;
                                pointer-events: auto !important;
                                bottom: calc(100% + 10px) !important;
                            }
                        }

                        .plyr__control[data-plyr="rewind"],
                        .plyr__control[data-plyr="fast-forward"] {
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            padding: 0 !important;
                            margin: 0 6px !important; /* Tạo thêm khoảng cách */
                        }

                        .plyr__control[data-plyr="rewind"] svg,
                        .plyr__control[data-plyr="fast-forward"] svg {
                            width: 24px !important;
                            height: 24px !important;
                        }

                        @media (max-width: 767px) {
                            .plyr__control[data-plyr="rewind"],
                            .plyr__control[data-plyr="fast-forward"] {
                                margin: 0 2px !important;
                            }
                            .plyr__control[data-plyr="rewind"] svg,
                            .plyr__control[data-plyr="fast-forward"] svg {
                                width: 18px !important;
                                height: 18px !important;
                            }
                        }
                    `}</style>
                    <video ref={videoRef} className="w-full h-full object-contain" playsInline loop={false} poster={getImageUrl(movie.thumb_url, { width: 1280, quality: 85 })} />

                    {/* Movie Info Overlay (Top Left) - Rendered into Plyr Container for Fullscreen Support */}
                    {plyrContainer && createPortal(
                        <div className={`absolute top-2 left-2 md:top-6 md:left-6 z-[60] pointer-events-none max-w-[55%]  lg:max-w-[70%] transition-all duration-500 transform ${controlsVisible && !showEndOverlay && !hasError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-white text-[13px] md:text-[20px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight line-clamp-1">
                                    {movie.name}
                                </h1>
                                <div className="flex items-center gap-2 text-white/70 text-[10px] md:text-[14px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                    {movie.origin_name && <span className="hidden sm:inline opacity-60 font-normal truncate max-w-[150px] md:max-w-xs">{movie.origin_name}</span>}
                                    {movie.origin_name && <span className="hidden sm:inline opacity-40">•</span>}
                                    <span className="text-amber-400/90">{episode.name}</span>
                                </div>
                            </div>
                        </div>,
                        plyrContainer
                    )}

                    {/* Episode List Trigger Button (Top Right) */}
                    {plyrContainer && createPortal(
                        <button
                            onClick={() => setShowEpisodeOverlay(true)}
                            className={`absolute top-2 right-2 md:top-6 md:right-6 z-[60] flex items-center gap-1.5 md:gap-2 bg-black/60 hover:bg-black/80 border border-white/10 py-1 md:py-2 px-2.5 md:px-4 rounded-full transition-all duration-500 cursor-pointer group ${controlsVisible && !hasError && !showEpisodeOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
                        >
                            <List size={12} className="md:w-5 md:h-5 text-white" />
                            <span className="text-white text-[9px] md:text-[13px] font-bold tracking-wider">Danh sách tập</span>
                        </button>,
                        plyrContainer
                    )}

                    {/* Loading Overlay when switching episodes */}
                    {plyrContainer && createPortal(
                        <AnimatePresence>
                            {isChangingEpisode && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                                >
                                    <div className="relative mb-6">
                                        <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-white/10 border-b-white/40 rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                                        </div>
                                    </div>
                                    <motion.div
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <h3 className="text-white text-lg md:text-xl font-bold tracking-tight mb-2">Đang chuyển tập...</h3>
                                        <p className="text-white/40 text-xs md:text-sm">Vui lòng đợi trong giây lát</p>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>,
                        plyrContainer
                    )}

                    {/* Episode List Overlay Panel */}
                    {plyrContainer && createPortal(
                        <div className={`absolute inset-0 z-[120] ${showEpisodeOverlay ? 'visible' : 'invisible'} [transition-property:visibility] duration-500`}>
                            {/* Backdrop shadow */}
                            <div
                                className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ${showEpisodeOverlay ? 'opacity-100' : 'opacity-0'}`}
                                onClick={() => setShowEpisodeOverlay(false)}
                            />

                            {/* Panel sliding from right */}
                            <div 
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                                className={`absolute top-0 right-0 h-full w-[200px] sm:w-[260px] md:w-[360px] bg-[#0F111A] border-l border-white/5 shadow-2xl transition-transform duration-500 ease-out flex flex-col select-none outline-none [backface-visibility:hidden] [will-change:transform] [-webkit-tap-highlight-color:transparent] ${showEpisodeOverlay ? 'translate-x-0' : 'translate-x-full'}`}>
                                {/* Header */}
                                <div className="p-2 sm:p-3 lg:p-5 border-b gap-10 border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="text-white text-[13px] md:text-[20px] font-bold line-clamp-1">{movie.name}</h3>
                                        <span className="text-white/40 text-[10px] md:text-xs lg:text-sm">
                                            Danh sách tập • {episodes[activeServerIndex]?.server_data?.length || 0} tập
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowEpisodeOverlay(false)}
                                        className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <X size={16} className="lg:w-6 lg:h-6" />
                                    </button>
                                </div>

                                {/* List Body */}
                                <div id="episode-list-container" className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1.5 sm:p-3 lg:p-5 flex flex-col gap-1.5 md:gap-2 lg:gap-3">
                                    {episodes[activeServerIndex]?.server_data?.map((ep, idx) => {
                                        const epSlug = getFriendlyEpisodeSlug(ep.slug);
                                        const isActive = epSlug === episodeSlug;

                                        return (
                                            <TransitionLink
                                                key={idx}
                                                id={isActive ? 'active-episode' : undefined}
                                                href={`/phim/${slug}/${epSlug}`}
                                                transition={false}
                                                onClick={() => {
                                                    if (!isActive) {
                                                        setIsChangingEpisode(true);
                                                        // Close the overlay after a small delay to let the loading show
                                                        setTimeout(() => setShowEpisodeOverlay(false), 300);
                                                    }
                                                }}
                                                className={`group flex items-center w-full flex-shrink-0 gap-1.5 lg:gap-3 p-1 sm:p-2 lg:p-3 rounded-md lg:rounded-xl transition-all duration-300 relative overflow-hidden ${isActive ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                                            >
                                                <div className="relative w-12 sm:w-20 lg:w-28 aspect-video rounded sm:rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                                    <Image
                                                        src={getImageUrl(movie.thumb_url || movie.poster_url)}
                                                        alt={ep.name}
                                                        fill
                                                        className={`object-cover transition-transform duration-500 ${isActive ? 'scale-105' : 'group-hover:scale-110'}`}
                                                        sizes="(max-width: 640px) 48px, (max-width: 1024px) 80px, 112px"
                                                    />
                                                    {isActive && (
                                                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 rounded-full bg-amber-500 animate-ping" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0 min-w-0">
                                                    <h4 className={`text-[9px] sm:text-[11px] lg:text-[13px] font-bold truncate ${isActive ? 'text-amber-500' : 'text-white/80 group-hover:text-white'}`}>
                                                        {ep.name}
                                                    </h4>
                                                </div>
                                            </TransitionLink>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>,
                        plyrContainer
                    )}


                    <AnimatePresence>
                        {showEndOverlay && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[110] bg-black/90 flex flex-col items-center justify-center p-3 md:p-6 text-center pointer-events-auto">
                                <div className="flex items-center justify-center gap-4 md:gap-8 pointer-events-auto scale-90 md:scale-100">
                                    <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={() => { setShowEndOverlay(false); if (plyrRef.current) { plyrRef.current.currentTime = 0; plyrRef.current.play(); } }} className="group flex cursor-pointer flex-col items-center gap-3 hover:scale-105 transition-transform">
                                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-lg group-hover:bg-white/20">
                                            <RefreshCcw size={20} className="md:w-6 md:h-6" />
                                        </div>
                                        <span className="text-white/80 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Xem lại</span>
                                    </motion.button>

                                    <motion.button
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        onClick={() => setShowEpisodeOverlay(true)}
                                        className="group flex cursor-pointer flex-col items-center gap-3 hover:scale-105 transition-transform"
                                    >
                                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-lg group-hover:bg-white/20">
                                            <List size={20} className="md:w-6 md:h-6" />
                                        </div>
                                        <span className="text-white/80 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Danh sách tập</span>
                                    </motion.button>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {hasError && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-6 text-center">
                                <div className="flex flex-col items-center max-w-[280px] sm:max-w-sm">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 md:mb-6">
                                        <AlertTriangle size={24} className="text-red-500 md:w-8 md:h-8" />
                                    </div>
                                    <p className="text-white/60 text-[11px] md:text-sm mb-6 md:mb-8 leading-relaxed">Máy chủ hiện không phản hồi luồng phát này. Vui lòng thử đổi sang Server khác bên dưới hoặc tắt VPN nếu có.</p>
                                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                                        <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] md:text-xs font-bold text-white transition-all cursor-pointer">
                                            <RefreshCcw size={14} /> Tải lại trang
                                        </button>
                                        <button onClick={() => { const el = document.querySelector('.wc-main'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center justify-center px-6 py-2.5 bg-amber-500 hover:bg-amber-400 rounded-xl text-[10px] md:text-xs font-bold text-[#0a1628] transition-all cursor-pointer">
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
                        isAutoNext={isAutoNext} 
                        onToggleAutoNext={toggleAutoNext} 
                        isFavorited={isFavorited} 
                        onToggleFavorite={toggleFavorite} 
                        isInWatchlist={isInWatchlist}
                        onToggleWatchlist={toggleWatchlist}
                        episodes={episodes} 
                        activeServer={activeServerIndex} 
                        onServerChange={setActiveServerIndex} 
                        onReport={() => setShowReportModal(true)} 
                    />
                </div>
            </div>

            <AnimatePresence>
                {!isTheaterMode && (
                    <motion.div key="watch-content" initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: "auto", opacity: 1, marginTop: 32 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} transition={{ duration: 0.5, ease: "easeInOut" }} className="overflow-hidden">
                        <Container className="wc-main">
                            <div className="flex flex-col xl:flex-row gap-8">
                                <div className="flex-1">
                                    <div className="flex flex-col gap-6 p-5 md:p-10 bg-white/[0.03] border border-white/10 rounded-3xl shadow-2xl">
                                        <MovieInfo slug={slug} movie={movie} episode={episode} />
                                        <EpisodeList 
                                            slug={slug} 
                                            currentEpisode={episodeSlug} 
                                            episodes={episodes} 
                                            activeServer={activeServerIndex} 
                                            onServerChange={setActiveServerIndex} 
                                            onEpisodeClick={() => setIsChangingEpisode(true)}
                                        />
                                        <div className="mt-6 pt-6 border-t border-white/5">
                                            <CommentSection movieSlug={slug} />
                                        </div>
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

            <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} movieName={movie.name} episodeName={episode.name} />
        </div>
    );
}
