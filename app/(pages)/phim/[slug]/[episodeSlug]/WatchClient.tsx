"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { ChevronRight, AlertTriangle, RefreshCcw } from "lucide-react";
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
import { createClient } from "@/app/utils/supabase/client";
import { toast } from "react-hot-toast";
import { MdReplay10, MdForward10 } from "react-icons/md";
import { renderToStaticMarkup } from "react-dom/server";

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
    const [isAutoNext, setIsAutoNext] = useState(true);
    const [showNextButton, setShowNextButton] = useState(false);
    const [activeServerIndex, setActiveServerIndex] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [user, setUser] = useState<any>(null);
    const userRef = useRef<any>(null);
    useEffect(() => { userRef.current = user; }, [user]);
    const autoNextRef = useRef(isAutoNext);
    useEffect(() => { autoNextRef.current = isAutoNext; }, [isAutoNext]);

    const [hasResumed, setHasResumed] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);

    const [showEndOverlay, setShowEndOverlay] = useState(false);
    const showEndOverlayRef = useRef(false);
    useEffect(() => { showEndOverlayRef.current = showEndOverlay; }, [showEndOverlay]);
    
    // View Tracking Refs
    const watchTimeAccumulator = useRef(0);
    const hasRecordedView = useRef(false);
    const lastUpdateTimestamp = useRef(0);
    
    const supabase = createClient();

    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const plyrRef = useRef<Plyr | null>(null);

    const nextEpisode = useMemo(() => {
        if (!episodes || episodes.length === 0) return null;
        const server = episodes[activeServerIndex] || episodes[0];
        const currentIndex = server.server_data.findIndex(ep => getFriendlyEpisodeSlug(ep.slug) === episodeSlug);
        if (currentIndex !== -1 && currentIndex < server.server_data.length - 1) {
            return server.server_data[currentIndex + 1];
        }
        return null;
    }, [episodes, activeServerIndex, episodeSlug]);

    const isSeries = useMemo(() => {
        if (!episodes || episodes.length === 0) return false;
        const server = episodes[0];
        return server.server_data.length > 1;
    }, [episodes]);

    useEffect(() => {
        setHasError(false);
        setShowNextButton(false);
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
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, [supabase]);

    useEffect(() => {
        setShowEndOverlay(false);
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
        const checkFavorite = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('favorites')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('movie_slug', slug)
                    .single();
                if (data) setIsFavorited(true);
            }
        };
        checkFavorite();
    }, [slug, supabase]);

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
        try {
            // Get user IP for unique view tracking (especially for guests)
            let ip = null;
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipRes.json();
                ip = ipData.ip;
            } catch (e) {
                console.warn("Could not fetch IP, using identification from DB only");
            }

            // Call the secure RPC function
            await supabase.rpc('record_movie_view', {
                p_movie_slug: slug,
                p_ip: ip,
                p_user_id: userRef.current?.id || null
            });
        } catch (err) {
            console.error("Error recording view:", err);
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
            if (isMounted) setUser(currentUser);

            if (currentUser && !hasResumed) {
                const { data: history } = await supabase
                    .from('watch_history')
                    .select('watched_seconds')
                    .eq('user_id', currentUser.id)
                    .eq('movie_slug', slug)
                    .eq('episode_slug', episodeSlug)
                    .single();
                if (history && history.watched_seconds > 10) {
                    startFrom = history.watched_seconds;
                }
            }

            const player = new Plyr(videoRef.current, defaultOptions);
            plyrRef.current = player;

            // Xử lý nút Mute trên Mobile: Chỉ hiện Popup, không được Mute
            player.on('ready', () => {
                const container = player.elements.container;
                const muteButton = container?.querySelector('button[data-plyr="mute"]');
                if (muteButton) {
                    muteButton.addEventListener('click', (e: Event) => {
                        if (window.innerWidth < 768) {
                            // Chặn Plyr thực hiện lệnh Mute mặc định
                            e.stopImmediatePropagation();
                            e.preventDefault();
                            // Popup âm lượng sẽ hiện ra nhờ CSS :focus-within
                        }
                    }, { capture: true }); // Chạy trước cả listener mặc định của Plyr
                }

                // Đổi Icon Tua 10s
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
                
                // --- View Tracking Logic ---
                if (!hasRecordedView.current && !player.paused && player.playing) {
                    const now = Date.now();
                    if (lastUpdateTimestamp.current > 0) {
                        const delta = (now - lastUpdateTimestamp.current) / 1000;
                        // Chỉ cộng dồn nếu delta hợp lý (tránh trường hợp tab bị treo rồi chạy bù)
                        if (delta > 0 && delta < 2) {
                            watchTimeAccumulator.current += delta;
                        }
                    }
                    lastUpdateTimestamp.current = now;

                    // Ngưỡng 30 giây xem thực tế
                    if (watchTimeAccumulator.current >= 30) {
                        hasRecordedView.current = true;
                        recordViewToSupabase();
                    }
                } else if (player.paused) {
                    lastUpdateTimestamp.current = 0; // Reset timestamp when paused
                }

                saveProgress(currentTime, duration);
                if (isSeries && nextEpisode && remaining <= 120 && player.duration > 0) {
                    setShowNextButton(true);
                } else if (remaining > 120) {
                    setShowNextButton(false);
                }
            });

            player.on('seeked', () => {
                if (player.duration > 0 && player.currentTime >= player.duration - 0.5) {
                    if (!(isSeries && nextEpisode && autoNextRef.current)) {
                        player.pause();
                        player.currentTime = player.duration - 0.1;
                        setShowEndOverlay(true);
                    }
                }
            });

            player.on('ended', () => {
                if (isSeries && nextEpisode && autoNextRef.current) {
                    window.location.href = `/phim/${slug}/${getFriendlyEpisodeSlug(nextEpisode.slug)}`;
                } else {
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
                        .plyr { z-index: auto !important; }
                        .plyr__controls { z-index: 100 !important; background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5)) !important; }
                        .hide-large-play .plyr__controls { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
                        
                        /* Hiện thời gian trên mọi thiết bị */
                        .plyr__time--current,
                        .plyr__time--duration {
                            display: block !important;
                        }
                        
                        /* Thu hẹp khoảng cách dấu gạch chéo thời gian */
                        .plyr__time + .plyr__time::before {
                            margin-right: 4px !important;
                        }

                        /* Thu nhỏ cụn nút điều khiển trên Mobile-Tablet */
                        @media (max-width: 767px) {
                            .plyr__control {
                                padding: 5px !important;
                            }
                            .plyr__control svg {
                                width: 14px !important;
                                height: 14px !important;
                            }

                            /* Popup âm lượng trên mobile */
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
                            /* Hiện popup khi click/focus vào cụm volume */
                            .plyr__volume:focus-within input,
                            .plyr__volume:active input {
                                opacity: 1 !important;
                                pointer-events: auto !important;
                                bottom: calc(100% + 10px) !important;
                            }
                        }

                        /* Tùy chỉnh Icon tua 10s - Gọn gàng & Khoảng cách */
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

                        /* Responsive cho mobile */
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
                    <video ref={videoRef} className="w-full h-full object-contain" playsInline loop={false} poster={getImageUrl(movie.thumb_url)} />

                    <AnimatePresence>
                        {showNextButton && nextEpisode && !showEndOverlay && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-24 md:bottom-26 right-4 md:right-8 z-40">
                                <TransitionLink href={`/phim/${slug}/${getFriendlyEpisodeSlug(nextEpisode.slug)}`} transition={false} className="group flex items-center gap-1.5 md:gap-2 bg-black/90 border border-white/40 py-1.5 px-3 md:py-2 md:px-5 rounded-lg hover:bg-white hover:text-[#0a1628] transition-all duration-300 text-white font-bold text-[9px] md:text-[11px] tracking-widest shadow-2xl">
                                    Tập tiếp theo
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </TransitionLink>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                                    {isSeries && nextEpisode && (
                                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                                            <TransitionLink href={`/phim/${slug}/${getFriendlyEpisodeSlug(nextEpisode.slug)}`} className="group flex flex-col items-center gap-3 hover:scale-105 transition-transform">
                                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-amber-500 flex items-center justify-center text-[#0a1628] shadow-lg shadow-amber-500/20 group-hover:bg-amber-400">
                                                    <ChevronRight size={28} className="md:w-8 md:h-8" />
                                                </div>
                                                <span className="text-amber-500 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Tập tiếp theo</span>
                                            </TransitionLink>
                                        </motion.div>
                                    )}
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
                    <PlayerControls isExpanded={isExpanded} onToggleExpanded={() => setIsExpanded(!isExpanded)} isTheaterMode={isTheaterMode} onToggleTheater={() => setIsTheaterMode(!isTheaterMode)} isAutoNext={isAutoNext} onToggleAutoNext={toggleAutoNext} isFavorited={isFavorited} onToggleFavorite={toggleFavorite} episodes={episodes} activeServer={activeServerIndex} onServerChange={setActiveServerIndex} onReport={() => setShowReportModal(true)} />
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
                                        <EpisodeList slug={slug} currentEpisode={episodeSlug} episodes={episodes} activeServer={activeServerIndex} onServerChange={setActiveServerIndex} />
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
