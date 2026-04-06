"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize,
    Settings, MonitorPlay, RotateCcw, RotateCw,
    ChevronRight, Loader2, Volume1, Sun
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Hls from "hls.js";
import { getImageUrl } from "@/app/utils/movieUtils";
import TransitionLink from "@/app/components/Transition/TransitionLink";

interface PremiumVideoPlayerProps {
    src: string;
    poster?: string;
    onEnded?: () => void;
    onNext?: () => void;
    autoPlay?: boolean;
    title?: string;
    subTitle?: string;
    startTime?: number;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    // New Props for End-of-Video Logic
    episodes?: any[];
    currentEpisodeSlug?: string;
    recommendedMovies?: any[];
    onNavigateToEpisode?: (slug: string) => void;
}

export default function PremiumVideoPlayer({
    src,
    poster,
    onEnded,
    onNext,
    autoPlay = false,
    title,
    subTitle,
    startTime = 0,
    onTimeUpdate,
    episodes,
    currentEpisodeSlug,
    recommendedMovies,
    onNavigateToEpisode
}: PremiumVideoPlayerProps) {
    // Basic States
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // End-of-Video States
    const [showAutoNext, setShowAutoNext] = useState(false);
    const [autoNextCountdown, setAutoNextCountdown] = useState(15);
    const [isAutoNextCancelled, setIsAutoNextCancelled] = useState(false);
    const [showEndedOverlay, setShowEndedOverlay] = useState(false);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Derived State
    const isSeries = (episodes?.length || 0) > 1;
    const nextEpisode = React.useMemo(() => {
        if (!isSeries || !episodes) return null;
        const currentIndex = episodes.findIndex((ep: any) =>
            ep.slug === currentEpisodeSlug ||
            `tap-${ep.slug}` === currentEpisodeSlug ||
            (currentEpisodeSlug === "tap-full" && ep.slug === "full")
        );
        if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
            return episodes[currentIndex + 1];
        }
        return null;
    }, [episodes, isSeries, currentEpisodeSlug]);

    // UI States
    const [seekTooltipTime, setSeekTooltipTime] = useState(0);
    const [seekTooltipLeft, setSeekTooltipLeft] = useState(0);
    const [showSeekTooltip, setShowSeekTooltip] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showVolumePopUp, setShowVolumePopUp] = useState(false);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    // Format time (MM:SS or HH:MM:SS)
    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        }
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Auto Hide Controls
    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        if (containerRef.current) containerRef.current.style.cursor = "default";

        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                if (isFullScreen && containerRef.current) {
                    containerRef.current.style.cursor = "none";
                }
            }, 3000);
        }
    }, [isPlaying, isFullScreen]);

    const resetVolumeTimeout = useCallback(() => {
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = setTimeout(() => {
            setShowVolumePopUp(false);
        }, 3000);
    }, []);

    // Initialize Video & HLS
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const initPlayer = () => {
            if (Hls.isSupported() && src.endsWith(".m3u8")) {
                if (hlsRef.current) hlsRef.current.destroy();

                const hls = new Hls({
                    capLevelToPlayerSize: true,
                    autoStartLoad: true,
                });
                hls.loadSource(src);
                hls.attachMedia(video);
                hlsRef.current = hls;

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (autoPlay) video.play().catch(() => setIsPlaying(false));
                });
            } else {
                video.src = src;
                if (autoPlay) video.play().catch(() => setIsPlaying(false));
            }
        };

        initPlayer();

        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [src, autoPlay]);

    // Handle Start Time
    useEffect(() => {
        if (startTime > 0 && videoRef.current) {
            const video = videoRef.current;
            const handleDuration = () => {
                video.currentTime = startTime;
                video.removeEventListener("loadedmetadata", handleDuration);
            };
            video.addEventListener("loadedmetadata", handleDuration);
        }
    }, [startTime]);

    // Video Events
    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (showEndedOverlay) {
            handleReplay();
            return;
        }

        if (video.paused) {
            video.play();
            setIsPlaying(true);
            resetControlsTimeout();
        } else {
            video.pause();
            setIsPlaying(false);
            setShowControls(true);
        }
    }, [resetControlsTimeout, showEndedOverlay]); // Added showEndedOverlay

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        setCurrentTime(video.currentTime);

        if (onTimeUpdate) onTimeUpdate(video.currentTime, video.duration);

        // Auto-Next Logic (15s before end)
        if (isSeries && nextEpisode && !isAutoNextCancelled) {
            const timeLeft = video.duration - video.currentTime;
            if (timeLeft <= 15 && timeLeft > 0 && !showAutoNext) {
                startAutoNextCountdown();
            } else if (timeLeft > 15 && showAutoNext) {
                cancelAutoNext();
            }
        }

        // Buffer calculation
        if (video.buffered.length > 0) {
            const buf = video.buffered.end(video.buffered.length - 1);
            setBuffered(buf);
        }
    };

    // Auto-Next Functions
    const startAutoNextCountdown = () => {
        setShowAutoNext(true);
        setAutoNextCountdown(15);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = setInterval(() => {
            setAutoNextCountdown(prev => {
                if (prev <= 1) {
                    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                    handleAutoNext();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleAutoNext = () => {
        if (nextEpisode && onNavigateToEpisode) {
            onNavigateToEpisode(nextEpisode.slug);
        }
        setShowAutoNext(false);
    };

    const cancelAutoNext = () => {
        setShowAutoNext(false);
        setIsAutoNextCancelled(true);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };

    const handleReplay = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
            setShowEndedOverlay(false);
            setIsPlaying(true);
            setIsAutoNextCancelled(false); // Reset auto-next for new play
        }
    };

    const onVideoEnded = () => {
        if (isSeries && nextEpisode && !isAutoNextCancelled) {
            handleAutoNext();
        } else {
            setShowEndedOverlay(true);
            setIsPlaying(false);
            setShowControls(false);
        }
        onEnded?.();
    };

    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        setDuration(videoRef.current.duration);
        setIsLoading(false);
    };

    const handleSeek = (e: MouseEvent | TouchEvent | React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (!videoRef.current || !duration || !progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const clientX = "touches" in e
            ? (e as any).touches[0].clientX
            : (e as MouseEvent).clientX;

        const pos = (clientX - rect.left) / rect.width;
        const finalPos = Math.max(0, Math.min(1, pos));

        videoRef.current.currentTime = finalPos * duration;
        setCurrentTime(finalPos * duration);
    };

    // Global drag handling
    useEffect(() => {
        if (!isDragging) return;

        const onMouseMove = (e: MouseEvent) => {
            handleSeek(e);
        };
        const onMouseUp = () => {
            setIsDragging(false);
        };
        const onTouchMove = (e: TouchEvent) => {
            handleSeek(e);
        };
        const onTouchEnd = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [isDragging, duration]);

    const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const time = pos * duration;
        setSeekTooltipTime(time);
        setSeekTooltipLeft(e.clientX - rect.left);
        setShowSeekTooltip(true);
    };

    // Fullscreen
    const toggleFullScreen = useCallback(() => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullScreen(true);
        } else {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    }, []);

    useEffect(() => {
        const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFsChange);
        return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    // Gestures
    const handleMainClick = (e: React.MouseEvent) => {
        // Prevent if clicking internal controls
        if ((e.target as HTMLElement).closest(".video-controls") || (e.target as HTMLElement).closest(".settings-panel")) return;

        // Single click/tap handling
        if (showVolumePopUp) {
            setShowVolumePopUp(false);
            return;
        }

        if (!showControls) {
            setShowControls(true);
            resetControlsTimeout();
        } else {
            // For Desktop: Toggle play on click
            // For Mobile: Hide controls on tap
            const isTouch = window.matchMedia("(pointer: coarse)").matches;
            if (!isTouch) {
                togglePlay();
            } else {
                setShowControls(false);
            }
        }
    };

    // Keyboard Hotkeys
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (!videoRef.current) return;
            const video = videoRef.current;

            switch (e.code) {
                case "Space": e.preventDefault(); togglePlay(); break;
                case "KeyK": togglePlay(); break;
                case "ArrowRight": video.currentTime += 10; break;
                case "ArrowLeft": video.currentTime -= 10; break;
                case "ArrowUp": e.preventDefault(); setVolume(v => Math.min(1, v + 0.1)); break;
                case "ArrowDown": e.preventDefault(); setVolume(v => Math.max(0, v - 0.1)); break;
                case "KeyF": toggleFullScreen(); break;
                case "KeyM": setIsMuted(!isMuted); break;
            }
            resetControlsTimeout();
        };

        window.addEventListener("keydown", handleKeys);
        return () => window.removeEventListener("keydown", handleKeys);
    }, [togglePlay, toggleFullScreen, isMuted, resetControlsTimeout]);

    // Volume update
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);


    const handleTouchStart = (e: React.TouchEvent) => {
        resetControlsTimeout();
    };

    const handleTouchEnd = () => {
        resetControlsTimeout();
    };

    return (
        <div
            ref={containerRef}
            className={`premium-player relative w-full h-full bg-black overflow-hidden select-none touch-none ${isFullScreen ? "fixed inset-0 z-[9999]" : "rounded-xl"}`}
            onMouseMove={resetControlsTimeout}
            onClick={handleMainClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >

            <video
                ref={videoRef}
                poster={poster}
                className="w-full h-full object-contain pointer-events-none"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => setIsLoading(false)}
                onEnded={onVideoEnded}
                playsInline
                loop={false}
            />


            {/* Top Gradient - For Title */}
            <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-500 pointer-events-none ${showControls ? "opacity-100" : "opacity-0"}`} />

            {/* Title Overlay */}
            {title && (
                <div className={`absolute top-4 left-4 md:top-6 md:left-6 transition-all duration-500 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
                    <h3 className="text-white text-sm md:text-lg drop-shadow-lg uppercase tracking-tight">{title}</h3>
                    {subTitle && <p className="text-white/50 text-[10px] md:text-xs tracking-wider">{subTitle}</p>}
                </div>
            )}

            {/* Center Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Loader2 size={64} className="text-amber-500 animate-spin opacity-80" />
                </div>
            )}

            {/* Auto-Next Card (15s Countdown) */}
            <AnimatePresence>
                {showAutoNext && nextEpisode && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, y: 0 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute bottom-24 right-6 w-72 md:w-80 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 z-[70] shadow-2xl overflow-hidden"
                    >
                        {/* Progress Border */}
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 15, ease: "linear" }}
                                className="h-full bg-amber-500"
                            />
                        </div>

                        <div className="flex gap-4 relative z-10">
                            <div className="w-20 h-28 flex-shrink-0 bg-white/5 rounded-lg overflow-hidden relative border border-white/5">
                                <img src={poster} alt={nextEpisode.name} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-sm">
                                        {autoNextCountdown}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Tập tiếp theo</h4>
                                    <h3 className="text-white text-sm font-bold line-clamp-2 leading-snug">{nextEpisode.name}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAutoNext}
                                        className="flex-1 bg-white text-black text-[10px] font-black uppercase py-2 rounded-lg hover:bg-amber-500 transition-colors"
                                    >
                                        Phát ngay
                                    </button>
                                    <button
                                        onClick={cancelAutoNext}
                                        className="px-3 bg-white/5 text-white/60 text-[10px] font-black uppercase py-2 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ended Overlay (Single Movie / Last Episode) */}
            <AnimatePresence>
                {showEndedOverlay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[80] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="max-w-4xl w-full"
                        >
                            <h2 className="text-white/40 text-xs md:text-sm  uppercase tracking-[0.4em] mb-8">Bạn vừa xem xong</h2>
                            <h1 className="text-white text-2xl md:text-5xl  mb-12 drop-shadow-2xl">{title}</h1>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-16">
                                <button
                                    onClick={handleReplay}
                                    className="group flex cursor-pointer items-center gap-3 bg-white text-black px-8 py-4 rounded-full  uppercase tracking-widest hover:bg-amber-500 transition-all hover:scale-105"
                                >
                                    <RotateCcw size={20} className=" group-hover:rotate-[-45deg] transition-transform" />
                                    Xem lại từ đầu
                                </button>
                                <TransitionLink
                                    href="/"
                                    className="flex items-center gap-3 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Về trang chủ
                                </TransitionLink>
                            </div>

                            {recommendedMovies && recommendedMovies.length > 0 && (
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-6 px-2">
                                        <h3 className="text-white uppercase tracking-wider text-sm">Phim đề xuất cho bạn</h3>
                                        <div className="h-[1px] flex-1 bg-white/10 mx-6" />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                        {recommendedMovies.slice(0, 4).map((m: any) => (
                                            <TransitionLink
                                                key={m.slug}
                                                href={`/phim/${m.slug}`}
                                                className="group block"
                                            >
                                                <div className="aspect-[2/3] bg-white/5 rounded-2xl border border-white/10 overflow-hidden mb-3 relative">
                                                    <img
                                                        src={getImageUrl(m.poster_url || m.thumb_url)}
                                                        alt={m.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-500 opacity-60 group-hover:opacity-100"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                                        <div className="bg-amber-500 text-[#0a1628] text-[10px] font-black py-1 px-2 rounded w-fit mb-2">XEM NGAY</div>
                                                    </div>
                                                </div>
                                                <h4 className="text-white font-bold text-xs line-clamp-1 group-hover:text-amber-500 transition-colors uppercase tracking-tight">{m.name}</h4>
                                            </TransitionLink>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Main Play/Pause Big Button for Mobile */}
            <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className={`absolute inset-0 flex items-center justify-center bg-transparent border-none ${showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} transition-opacity duration-300 md:hidden z-[45]`}
            >
                <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-sm">
                    {isPlaying ? <Pause className="text-white fill-white" size={16} /> : <Play className="text-white fill-white ml-0.5" size={16} />}
                </div>
            </button>

            {/* BOTTOM CONTROLS */}
            <div className={`video-controls absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pt-12 pb-3 md:pb-5 px-3 md:px-6 transition-opacity duration-500 ease-in-out ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>

                {/* Progress Bar Container */}
                <div
                    ref={progressBarRef}
                    className="group/seek bg-white/20 h-1 w-full relative mb-2 md:mb-4 lg:mb-6 cursor-pointer transition-all hover:h-1.5"
                    onMouseDown={(e) => { setIsDragging(true); handleSeek(e); }}
                    onMouseMove={handleProgressHover}
                    onMouseLeave={() => setShowSeekTooltip(false)}
                >
                    {/* Buffered Progress */}
                    <div
                        className="absolute h-full bg-white/30 left-0 top-0 transition-all"
                        style={{ width: `${(buffered / duration) * 100}%` }}
                    />
                    {/* Current Position */}
                    <div
                        className="absolute h-full bg-amber-500 left-0 top-0 transition-none"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                        {/* Knob */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-500 rounded-full scale-0 group-hover/seek:scale-100 transition-transform shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                    </div>

                    {/* Seek Tooltip */}
                    {showSeekTooltip && (
                        <div
                            className="absolute bottom-6 -translate-x-1/2 bg-black/80 border border-white/20 px-2 py-1 rounded text-white text-xs font-bold whitespace-nowrap pointer-events-none"
                            style={{ left: `${seekTooltipLeft}px` }}
                        >
                            {formatTime(seekTooltipTime)}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    {/* Left Controls */}
                    <div className="flex items-center gap-2 md:gap-6">
                        <div className="flex items-center gap-4">
                            <button onClick={togglePlay} className="text-white hover:text-amber-500 transition-all hover:scale-110 active:scale-95 duration-200">
                                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
                            </button>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime -= 10; }}
                                    className="text-white/80 hover:text-white transition-colors relative"
                                    title="Lùi 10s"
                                >
                                    <RotateCcw size={20} />
                                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black mt-0.5">10</span>
                                </button>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime += 10; }}
                                    className="text-white/80 hover:text-white transition-colors relative"
                                    title="Tới 10s"
                                >
                                    <RotateCw size={20} />
                                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black mt-0.5">10</span>
                                </button>
                            </div>
                        </div>

                        <div 
                            className="relative flex items-center"
                            onMouseEnter={() => !window.matchMedia("(pointer: coarse)").matches && setShowVolumePopUp(true)}
                            onMouseLeave={() => !window.matchMedia("(pointer: coarse)").matches && setShowVolumePopUp(false)}
                        >
                            <button 
                                onClick={() => {
                                    const isTouch = window.matchMedia("(pointer: coarse)").matches;
                                    if (isTouch) {
                                        setShowVolumePopUp(!showVolumePopUp);
                                        if (!showVolumePopUp) resetVolumeTimeout();
                                    } else {
                                        setIsMuted(!isMuted);
                                    }
                                }} 
                                className="text-white hover:text-amber-500 transition-colors flex items-center justify-center h-8"
                            >
                                {(isMuted || volume === 0) ? <VolumeX size={20} /> : volume > 0.5 ? <Volume2 size={20} /> : <Volume1 size={20} />}
                            </button>

                            <AnimatePresence>
                                {showVolumePopUp && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-3 bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center gap-3 shadow-2xl z-[60]"
                                        onMouseEnter={() => volumeTimeoutRef.current && clearTimeout(volumeTimeoutRef.current)}
                                        onMouseLeave={() => window.matchMedia("(pointer: coarse)").matches && resetVolumeTimeout()}
                                    >
                                        {/* Vertical Slider */}
                                        <div className="relative w-1.5 h-32 bg-white/20 rounded-full overflow-hidden cursor-pointer group/v-slider">
                                            <motion.div 
                                                className="absolute bottom-0 w-full bg-amber-500 rounded-full"
                                                style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}
                                            />
                                            <input
                                                type="range"
                                                min="0" max="1" step="0.01"
                                                value={isMuted ? 0 : volume}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setVolume(val);
                                                    setIsMuted(val === 0);
                                                    resetVolumeTimeout();
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                style={{ 
                                                    writingMode: 'bt-lr',
                                                    WebkitAppearance: 'slider-vertical'
                                                } as any}
                                            />
                                        </div>

                                        {/* Percentage Text */}
                                        <span className="text-[10px] font-black text-white w-8 text-center select-none">
                                            {Math.round((isMuted ? 0 : volume) * 100)}%
                                        </span>

                                        {/* Mobile Mute Toggle */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                                            className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                                        >
                                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="text-white text-xs md:text-sm font-medium tracking-tight whitespace-nowrap">
                            <span className="font-bold">{formatTime(currentTime)}</span>
                            <span className="mx-1 opacity-40">/</span>
                            <span className="opacity-60">{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative flex items-center">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`text-white hover:text-amber-500 transition-all duration-300 flex items-center justify-center ${showSettings ? "rotate-45 text-amber-500" : ""}`}
                            >
                                <Settings size={20} />
                            </button>
                            <AnimatePresence>
                                {showSettings && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute bottom-full right-0 mb-4 w-48 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl p-2 z-[60]"
                                    >
                                        <div className="text-[10px] text-white/40 tracking-widest px-3 py-2">Tốc độ phát</div>
                                        {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                                            <button
                                                key={speed}
                                                onClick={() => { setPlaybackRate(speed); if (videoRef.current) videoRef.current.playbackRate = speed; setShowSettings(false); }}
                                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${playbackRate === speed ? "bg-amber-500 text-black font-bold" : "text-white/70 hover:bg-white/10"}`}
                                            >
                                                {speed}x {speed === 1 && "(Chuẩn)"}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button onClick={() => videoRef.current?.requestPictureInPicture()} className="text-white hover:text-amber-500 transition-colors hidden md:block flex items-center justify-center">
                            <MonitorPlay size={20} />
                        </button>

                        <button onClick={toggleFullScreen} className="text-white hover:text-amber-500 transition-colors flex items-center justify-center">
                            {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                input[type=range] {
                    -webkit-appearance: none;
                    background: rgba(255, 255, 255, 0.2);
                }
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                    background: #f59e0b;
                    cursor: pointer;
                    box-shadow: 0 0 5px rgba(0,0,0,0.3);
                }
            `}</style>
        </div>
    );
}
