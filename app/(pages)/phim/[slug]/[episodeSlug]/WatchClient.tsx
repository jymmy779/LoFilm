"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

import TransitionLink from "@/app/components/Transition/TransitionLink";
import { AlertTriangle, RefreshCcw, List, X } from "lucide-react";
import { useRouter } from "next/navigation";

import Hls from "hls.js";
import "plyr/dist/plyr.css";

import Container from "@/app/components/Container";
import PlayerControls from "./PlayerControls";
import EpisodeList from "./EpisodeList";
import DualSubtitleMenu from "./DualSubtitleMenu";
import Sidebar from "./Sidebar";
import MovieHeader from "./MovieHeader";
import MovieInfo from "./MovieInfo";
import CommentSection from "@/app/components/Comments/CommentSection";
import ReportModal from "@/app/components/Common/ReportModal";
import ShareModal from "@/app/components/Movie/ShareModal";
import { getImageUrl, getRawImageUrl, getFriendlyEpisodeSlug } from "@/app/utils/movieUtils";

import SmartImage from "@/app/components/Common/SmartImage";
import { fetchTotalEpisodesFromTMDB } from "@/app/utils/tmdbUtils";
import { useAuth } from "@/app/components/Auth/AuthContext";
import { toast } from "react-hot-toast";
import { MdReplay10, MdForward10 } from "react-icons/md";
import { renderToStaticMarkup } from "react-dom/server";
import { createPortal } from "react-dom";
import { createClient } from "@/app/utils/supabase/client";
import { SubtitleTrack } from "@/app/types/movie";
import { useSubtitleManager } from "./hooks/useSubtitleManager";
import { useVttOverlay } from "./hooks/useVttOverlay";

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
        link_vtt?: string;
        subtitles?: SubtitleTrack[];
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
    movie: initialMovie,
    episode,
    episodes,
    suggestedMovies: initialSuggestions
}: WatchClientProps) {
    const processedEpisodes = useMemo(() => {
        if (!episodes) return [];
        const list: typeof episodes = [];
        episodes.forEach(server => {
            // Server VIP (Sử dụng trình phát gốc, HLS)
            list.push({
                ...server,
                server_name: `${server.server_name} - VIP`
            });
            
            // Server Dự Phòng (Sử dụng Iframe Embed)
            if (server.server_data.some(ep => ep.link_embed)) {
                list.push({
                    ...server,
                    server_name: `${server.server_name} - Dự Phòng`
                });
            }
        });
        return list;
    }, [episodes]);

    const [movie, setMovie] = useState<any>(initialMovie);
    const filteredSuggestions = useMemo(() => {
        const seen = new Set();
        return initialSuggestions.filter(m => {
            if (!m.slug || seen.has(m.slug)) return false;
            seen.add(m.slug);
            return true;
        });
    }, [initialSuggestions]);
    const router = useRouter();
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isAutoNext, setIsAutoNext] = useState(true);
    const [activeServerIndex, setActiveServerIndex] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
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
    const [plyrContainer, setPlyrContainer] = useState<HTMLElement | null>(null);
    const [subtitlePortalNode, setSubtitlePortalNode] = useState<HTMLElement | null>(null);
    const [showEpisodeOverlay, setShowEpisodeOverlay] = useState(false);
    const [isChangingEpisode, setIsChangingEpisode] = useState(false);
    const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
    const [isIframeLoading, setIsIframeLoading] = useState(false);

    useEffect(() => { showEndOverlayRef.current = showEndOverlay; }, [showEndOverlay]);
    const showEpisodeOverlayRef = useRef(showEpisodeOverlay);
    useEffect(() => { showEpisodeOverlayRef.current = showEpisodeOverlay; }, [showEpisodeOverlay]);

    const watchTimeAccumulator = useRef(0);
    const hasRecordedView = useRef(false);
    const lastUpdateTimestamp = useRef(0);

    const supabase = createClient();

    const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
    const containerCallbackRef = useCallback((node: HTMLDivElement | null) => {
        if (node) setContainerNode(node);
    }, []);

    const handleServerChange = useCallback((index: number) => {
        setActiveServerIndex(index);
        if (containerNode) {
            containerNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [containerNode]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const plyrRef = useRef<any>(null);
    const fallbackTimeRef = useRef<number>(0);
    const seekTargetRef = useRef<number | null>(null);
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Subtitle management (must be after videoRef)
    const episodeSubtitles = episode.subtitles || [];
    const hasCustomSubtitles = episodeSubtitles.length > 0;
    const {
        slot1, slot2,
        slot1Url, slot2Url,
        setSlot1, setSlot2,
    } = useSubtitleManager(episodeSubtitles);

    // Parse + sync VTT for both overlays
    const subtitle1Text = useVttOverlay(hasCustomSubtitles ? slot1Url : null, videoRef);
    const subtitle2Text = useVttOverlay(hasCustomSubtitles ? slot2Url : null, videoRef);

    const isEmbedServer = useMemo(() => {
        const server = processedEpisodes[activeServerIndex];
        return server?.server_name.includes('Dự Phòng') || false;
    }, [processedEpisodes, activeServerIndex]);

    const currentIndex = useMemo(() => {
        if (!processedEpisodes || processedEpisodes.length === 0) return -1;
        const server = processedEpisodes[activeServerIndex] || processedEpisodes[0];

        return server.server_data.findIndex((ep: any) => getFriendlyEpisodeSlug(ep.slug) === episodeSlug);
    }, [processedEpisodes, activeServerIndex, episodeSlug]);

    const nextEpisode = useMemo(() => {
        if (!processedEpisodes || processedEpisodes.length === 0 || currentIndex === -1) return null;
        const server = processedEpisodes[activeServerIndex] || processedEpisodes[0];
        if (currentIndex < server.server_data.length - 1) {
            return server.server_data[currentIndex + 1];
        }
        return null;
    }, [processedEpisodes, activeServerIndex, currentIndex]);

    const isSeries = useMemo(() => {
        if (!processedEpisodes || processedEpisodes.length === 0) return false;
        const server = processedEpisodes[0];
        return server.server_data.length > 1;
    }, [processedEpisodes]);

    useEffect(() => {
        setHasError(false);
    }, [activeServerIndex, episodeSlug]);

    const videoSrc = useMemo(() => {
        let originalSrc = episode.link_m3u8;
        if (processedEpisodes && processedEpisodes.length > 0) {
            const server = processedEpisodes[activeServerIndex] || processedEpisodes[0];
            const found = server.server_data.find((ep) => getFriendlyEpisodeSlug(ep.slug) === episodeSlug);
            if (found) {
                originalSrc = found.link_m3u8;
            } else {
                for (const s of processedEpisodes) {
                    const f = s.server_data.find((ep) => getFriendlyEpisodeSlug(ep.slug) === episodeSlug);
                    if (f) {
                        originalSrc = f.link_m3u8;
                        break;
                    }
                }
            }
        }
        return originalSrc;
    }, [activeServerIndex, episodeSlug, processedEpisodes, episode.link_m3u8]);

    const embedSrc = useMemo(() => {
        if (!isEmbedServer) return null;
        const server = processedEpisodes[activeServerIndex];
        const found = server?.server_data.find((ep) => getFriendlyEpisodeSlug(ep.slug) === episodeSlug);
        return found?.link_embed || null;
    }, [isEmbedServer, processedEpisodes, activeServerIndex, episodeSlug]);

    useEffect(() => {
        if (embedSrc) setIsIframeLoading(true);
    }, [embedSrc]);

    useEffect(() => {
        setShowEndOverlay(false);
        setIsChangingEpisode(false);
        fallbackTimeRef.current = 0;
    }, [episodeSlug]);

    useEffect(() => {
        const savedAutoNext = localStorage.getItem('lofilm-auto-next');
        if (savedAutoNext !== null) {
            setIsAutoNext(savedAutoNext === 'true');
        }
    }, []);


    useEffect(() => {
        const correctMainMovie = async () => {
            const curNum = parseInt(movie.episode_current?.match(/\d+/)?.[0] || "0");
            // episode_total có thể là number (sau update API kkphim), dùng String() để an toàn
            const totNum = parseInt(String(movie.episode_total ?? "").match(/\d+/)?.[0] || "1000");

            if (curNum > totNum && movie.tmdb?.id && movie.tmdb.type === "tv") {
                const tmdbTotal = await fetchTotalEpisodesFromTMDB(movie.tmdb.id);
                if (tmdbTotal && tmdbTotal >= curNum) {
                    setMovie((prev: any) => ({
                        ...prev,
                        episode_total: tmdbTotal.toString()
                    }));
                }
            }
        };
        correctMainMovie();
    }, [slug]);

    const toggleAutoNext = useCallback(() => {
        const newValue = !isAutoNext;
        setIsAutoNext(newValue);
        localStorage.setItem('lofilm-auto-next', String(newValue));
    }, [isAutoNext]);

    useEffect(() => {
        const checkStatus = async () => {

            if (user) {
                const { data: favData } = await supabase
                    .from('favorites')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('movie_slug', slug)
                    .maybeSingle();
                if (favData) setIsFavorited(true);

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

    const toggleFavorite = useCallback(async () => {
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
    }, [user, isFavorited, slug, movie, supabase]);

    const toggleWatchlist = useCallback(async () => {
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
    }, [user, isInWatchlist, slug, movie, supabase]);

    const lastSavedTime = useRef(0);
    const lastSavedTimeDB = useRef(0);
    const saveProgress = useCallback(async (currentTime: number, duration: number, forceDbSync = false) => {
        const currentUser = userRef.current;
        if (!currentTime || duration <= 0) return;

        const timeDiff = Math.abs(currentTime - lastSavedTime.current);
        const dbTimeDiff = Math.abs(currentTime - lastSavedTimeDB.current);

        // 1. Lưu LocalStorage mỗi 10s (rất nhẹ, không tốn tài nguyên)
        if (timeDiff >= 10) {
            lastSavedTime.current = currentTime;
            try {
                const HISTORY_KEY = currentUser ? `lofilm-watch-history-${currentUser.id}` : 'lofilm-guest-watch-history';
                const historyStr = localStorage.getItem(HISTORY_KEY);
                let history = historyStr ? JSON.parse(historyStr) : {};

                const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
                const now = Date.now();
                Object.keys(history).forEach(key => {
                    if (now - history[key].updated_at > SEVEN_DAYS_MS) {
                        delete history[key];
                    }
                });

                history[`${slug}/${episodeSlug}`] = {
                    movie_slug: slug,
                    episode_slug: episodeSlug,
                    movie_name: movie.name,
                    movie_poster: movie.thumb_url || movie.poster_url,
                    episode_name: episode.name,
                    watched_seconds: Math.floor(currentTime),
                    duration: Math.floor(duration),
                    updated_at: now
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
        }
    }, [slug, episodeSlug, movie, episode, supabase]);

    const recordViewToSupabase = useCallback(async () => {
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
            } else {
                console.error("RPC View Error:", error.message);
            }
        } catch (err) {
            console.error("System error recording view:", err);
        }
    }, [slug, supabase]);

    useEffect(() => {
        if (isEmbedServer) return;

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
            loop: { active: false },
            clickToPlay: typeof window !== 'undefined' ? !window.matchMedia('(pointer: coarse)').matches : true,
            hideControls: true,
        };

        const initTimeout = setTimeout(async () => {
            if (!isMounted || !videoRef.current) return;
            let startFrom = fallbackTimeRef.current;
            const isFallbackResume = startFrom > 0;
            if (startFrom === 0 && !hasResumed) {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (currentUser) {
                    const { data: history } = await supabase
                        .from('watch_history')
                        .select('watched_seconds')
                        .eq('user_id', currentUser.id)
                        .eq('movie_slug', slug)
                        .eq('episode_slug', episodeSlug)
                        .maybeSingle();
                    if (history && history.watched_seconds > 10) {
                        startFrom = history.watched_seconds;
                    }
                }

                if (startFrom <= 10) {
                    try {
                        const HISTORY_KEY = currentUser ? `lofilm-watch-history-${currentUser.id}` : 'lofilm-guest-watch-history';
                        const historyStr = localStorage.getItem(HISTORY_KEY);
                        if (historyStr) {
                            const history = JSON.parse(historyStr);
                            const item = history[`${slug}/${episodeSlug}`];
                            if (item && item.watched_seconds > 10) {
                                startFrom = item.watched_seconds;
                            }
                        }
                    } catch (e) { }
                }
            }

            const PlyrLib = (await import('plyr') as any).default;
            if (!isMounted || !videoRef.current) return;
            const player = new PlyrLib(videoRef.current, defaultOptions);
            plyrRef.current = player;

            player.on('ready', () => {
                const container = player.elements.container;
                setPlyrContainer(container);
                if (container) {
                    const controls = container.querySelector('.plyr__controls');
                    if (controls && hasCustomSubtitles) {
                        // Avoid duplicates if ready fires multiple times
                        if (!controls.querySelector('.plyr__control--custom-subtitle')) {
                            const portalContainer = document.createElement('div');
                            portalContainer.className = "plyr__control--custom-subtitle flex items-center";
                            const settingsBtn = controls.querySelector('.plyr__menu'); // settings menu container
                            const fullscreenBtn = controls.querySelector('button[data-plyr="fullscreen"]');
                            const targetBtn = settingsBtn || fullscreenBtn;
                            
                            if (targetBtn) {
                                controls.insertBefore(portalContainer, targetBtn);
                            } else {
                                controls.appendChild(portalContainer);
                            }
                            setSubtitlePortalNode(portalContainer);
                        }
                    }

                    container.addEventListener('touchstart', (e: TouchEvent) => {
                        if (window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches) {
                            const target = e.target as HTMLElement;
                            if (
                                showEpisodeOverlayRef.current ||
                                target.closest('[id="episode-list-container"]') ||
                                target.closest('.z-\\[210\\]') ||
                                target.closest('.z-\\[150\\]') ||
                                target.closest('.z-\\[200\\]') ||
                                target.closest('.watch-top-overlay')
                            ) return;
                            const touch = e.touches[0];
                            const rect = container.getBoundingClientRect();
                            const relativeY = touch.clientY - rect.top;
                            if (relativeY < 50) { e.stopPropagation(); return; }
                            const isControl = target.closest('.plyr__controls') || target.closest('.plyr__control--overlaid') || target.closest('.plyr__control') || target.closest('.watch-top-overlay');
                            if (!isControl) {
                                if (player.elements.container?.classList.contains('plyr--hide-controls') === false) {
                                    e.preventDefault();
                                    player.togglePlay();
                                }
                            }
                        }
                    }, { capture: true, passive: false });
                    const muteButton = container.querySelector('button[data-plyr="mute"]');
                    if (muteButton) {
                        muteButton.addEventListener('click', (e: Event) => {
                            if (window.innerWidth < 768) { e.stopImmediatePropagation(); e.preventDefault(); }
                        }, { capture: true });
                    }
                    const rewindBtn = container.querySelector('button[data-plyr="rewind"]');
                    const forwardBtn = container.querySelector('button[data-plyr="fast-forward"]');
                    if (rewindBtn) rewindBtn.innerHTML = renderToStaticMarkup(<MdReplay10 size={24} style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }} />);
                    if (forwardBtn) forwardBtn.innerHTML = renderToStaticMarkup(<MdForward10 size={24} style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }} />);
                }
            });

            player.on('play', () => {
                if (showEndOverlayRef.current) {
                    setTimeout(() => { if (plyrRef.current && showEndOverlayRef.current) plyrRef.current.pause(); }, 10);
                }
            });

            player.on('pause', () => {
                if (plyrRef.current) {
                    saveProgress(plyrRef.current.currentTime, plyrRef.current.duration, true);
                }
            });

            player.on('playing', () => { setHasStartedPlaying(true); setHasError(false); });

            player.on('enterfullscreen', () => {
                const orientation = window.screen?.orientation as any;
                if (orientation && orientation.lock) {
                    orientation.lock('landscape').catch(() => {});
                }
            });

            player.on('exitfullscreen', () => {
                const orientation = window.screen?.orientation as any;
                if (orientation && orientation.unlock) {
                    orientation.unlock();
                }
            });

            if (startFrom > 0 && (!hasResumed || isFallbackResume)) {
                player.once('ready', () => {
                    if (player.currentTime < startFrom - 5 || isFallbackResume) {
                        player.currentTime = startFrom;
                        if (isFallbackResume) {
                            toast.success(`Đang tự động kết nối máy chủ dự phòng...`, { icon: '🔄', duration: 2500 });
                            setTimeout(() => player.play().catch(() => {}), 500);
                            fallbackTimeRef.current = 0;
                        } else {
                            toast.success(`Đã khôi phục vị trí xem cũ: ${Math.floor(startFrom / 60)} phút`, { icon: '🕒', duration: 2500 });
                        }
                    }
                });
                if (!hasResumed) setHasResumed(true);
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

                    // ĐIỀU KIỆN CỘNG VIEW: Chuẩn Netflix (Xem ít nhất 2 phút)
                    if (watchTimeAccumulator.current >= 120 || currentTime >= 120) {
                        hasRecordedView.current = true;
                        recordViewToSupabase();
                    }
                }

                saveProgress(currentTime, duration);
                if (isSeries && nextEpisode && remaining <= 120 && player.duration > 0) {
                    // Pre-calculation logic if needed
                }
            });

            // Dọn dẹp đoạn code bắt sự kiện tua vì chúng ta đã giải quyết tận gốc ở lớp mạng (Network)


            player.on('seeked', () => {
                if (player.duration > 0 && player.currentTime >= player.duration - 0.5) {
                    if (isSeries && nextEpisode && autoNextRef.current) {
                        setTimeout(() => {
                            if (plyrRef.current) plyrRef.current.pause();
                        }, 10);
                        setIsChangingEpisode(true);
                        router.push(`/phim/${slug}/${getFriendlyEpisodeSlug(nextEpisode.slug)}`);
                    } else if (!showEndOverlayRef.current) {
                        setTimeout(() => {
                            if (plyrRef.current) {
                                plyrRef.current.pause();
                                plyrRef.current.currentTime = plyrRef.current.duration - 0.1;
                            }
                        }, 10);
                        setShowEndOverlay(true);
                    }
                }
            });

            player.on('ended', () => {
                if (isSeries && nextEpisode && autoNextRef.current) {
                    setIsChangingEpisode(true);
                    router.push(`/phim/${slug}/${getFriendlyEpisodeSlug(nextEpisode.slug)}`);
                } else if (!showEndOverlayRef.current) {
                    setTimeout(() => {
                        if (plyrRef.current) {
                            plyrRef.current.pause();
                            plyrRef.current.currentTime = plyrRef.current.duration - 0.1;
                        }
                    }, 10);
                    setShowEndOverlay(true);
                }
            });

            if (Hls.isSupported() && (videoSrc.includes('.m3u8'))) {
                const hls = new Hls({
                    capLevelToPlayerSize: true,
                    autoStartLoad: true,
                    startLevel: -1,
                    startPosition: startFrom > 0 ? startFrom : -1,
                    // Tối ưu bộ đệm (buffering) chống giật lag
                    maxBufferLength: 120, // Tăng lên 120s
                    maxMaxBufferLength: 600,
                    maxBufferSize: 100 * 1000 * 1000, 
                    fragLoadingTimeOut: 60000, // Tăng timeout mạng yếu
                    manifestLoadingTimeOut: 60000,
                    levelLoadingTimeOut: 60000,
                    enableWorker: true, // Chạy trên luồng phụ
                });
                hls.loadSource(videoSrc);
                hls.attachMedia(videoRef.current);
                hlsRef.current = hls;
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    // Only inject native track if no custom subtitles (backward compat)
                    if (!hasCustomSubtitles && episode.link_vtt && videoRef.current) {
                        const existingTracks = videoRef.current.querySelectorAll('track');
                        existingTracks.forEach(t => t.remove());

                        const track = document.createElement('track');
                        track.kind = 'captions';
                        track.label = 'Vietnamese';
                        track.srclang = 'vi';
                        track.src = episode.link_vtt;
                        track.default = true;
                        videoRef.current.appendChild(track);
                    }
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        setHasError(true);
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.warn("Fatal network error in video player. Retrying to load source...", data.details);
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.warn("Fatal media error in video player. Attempting recovery...");
                                hls.recoverMediaError();
                                break;
                            default:
                                console.error("Fatal unrecoverable error in Hls player.", data);
                                break;
                        }
                    }
                });
            } else if (videoRef.current) {
                videoRef.current.src = videoSrc;
                videoRef.current.onerror = () => setHasError(true);

                // Only inject native track if no custom subtitles (backward compat)
                if (!hasCustomSubtitles && episode.link_vtt) {
                    const existingTracks = videoRef.current.querySelectorAll('track');
                    existingTracks.forEach(t => t.remove());

                    const track = document.createElement('track');
                    track.kind = 'captions';
                    track.label = 'Vietnamese';
                    track.srclang = 'vi';
                    track.src = episode.link_vtt;
                    track.default = true;
                    videoRef.current.appendChild(track);
                }
            }
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(initTimeout);
            if (plyrRef.current) {
                try { plyrRef.current.destroy(); } catch (e) { }
                plyrRef.current = null;
                setPlyrContainer(null);
            }
            if (hlsRef.current) {
                try { hlsRef.current.destroy(); } catch (e) { }
                hlsRef.current = null;
            }
        };
    }, [videoSrc, nextEpisode, slug, isEmbedServer]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            // Không bắt phím khi đang gõ vào input hoặc comment
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;

            const player = plyrRef.current;
            if (!player) return;

            const key = e.key;
            const code = e.code;

            switch (code) {
                case 'Space':
                case 'KeyK':
                    e.preventDefault();
                    player.togglePlay();
                    break;
                case 'ArrowRight':
                case 'KeyL': { // YouTube style forward
                    e.preventDefault();
                    const current = seekTargetRef.current !== null ? seekTargetRef.current : player.currentTime;
                    const target = Math.min(player.duration || 0, current + 10);
                    seekTargetRef.current = target;
                    player.currentTime = target;
                    
                    const seekInput = player.elements.inputs?.seek;
                    if (seekInput && player.duration) {
                        seekInput.value = ((target / player.duration) * 100).toString();
                        seekInput.style.setProperty('--value', `${(target / player.duration) * 100}%`);
                    }
                    if (player.elements.container) player.elements.container.classList.remove('plyr--hide-controls');
                    
                    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
                    seekTimeoutRef.current = setTimeout(() => { seekTargetRef.current = null; }, 1000);
                    break;
                }
                case 'ArrowLeft':
                case 'KeyJ': { // YouTube style rewind
                    e.preventDefault();
                    const current = seekTargetRef.current !== null ? seekTargetRef.current : player.currentTime;
                    const target = Math.max(0, current - 10);
                    seekTargetRef.current = target;
                    player.currentTime = target;
                    
                    const seekInput = player.elements.inputs?.seek;
                    if (seekInput && player.duration) {
                        seekInput.value = ((target / player.duration) * 100).toString();
                        seekInput.style.setProperty('--value', `${(target / player.duration) * 100}%`);
                    }
                    if (player.elements.container) player.elements.container.classList.remove('plyr--hide-controls');
                    
                    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
                    seekTimeoutRef.current = setTimeout(() => { seekTargetRef.current = null; }, 1000);
                    break;
                }
                case 'KeyF':
                    e.preventDefault();
                    player.fullscreen.toggle();
                    break;
                case 'KeyM':
                    e.preventDefault();
                    player.muted = !player.muted;
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    player.volume = Math.min(1, player.volume + 0.1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    player.volume = Math.max(0, player.volume - 0.1);
                    break;
            }
        };

        // Sử dụng { capture: true } để chiếm quyền ưu tiên phím tắt, tránh bị các thành phần khác chặn mất
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, []);

    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (isTheaterMode) document.body.classList.add('theater-mode');
        else document.body.classList.remove('theater-mode');
        return () => document.body.classList.remove('theater-mode');
    }, [isTheaterMode]);

    useEffect(() => {
        if (isFullscreen) {
            document.documentElement.classList.add('fullscreen-scrollbar-fix');
        } else {
            document.documentElement.classList.remove('fullscreen-scrollbar-fix');
        }
        return () => document.documentElement.classList.remove('fullscreen-scrollbar-fix');
    }, [isFullscreen]);

    useEffect(() => {
        if (showEpisodeOverlay) {
            const activeEl = document.getElementById('active-episode');
            const container = document.getElementById('episode-list-container');
            if (activeEl && container) {
                setTimeout(() => {
                    const targetScroll = activeEl.offsetTop - container.offsetHeight / 2 + activeEl.offsetHeight / 2;
                    container.scrollTo({
                        top: targetScroll,
                        behavior: 'auto'
                    });
                }, 100); // Đợi xíu để animation của panel kịp chạy ra
            }
        }
    }, [showEpisodeOverlay, episodeSlug, activeServerIndex]);

    if (!movie || !episode) return null;

    const portalTarget = isEmbedServer ? containerNode : plyrContainer;

    return (
        <div className={`pt-35 ${isTheaterMode ? "pb-4 min-h-0" : "pb-12 min-h-screen"} transition-all duration-500 animate-fade-in ${isFullscreen ? 'video-fullscreen-active' : ''} xl:-ml-[100px] xl:w-[calc(100%+100px)] xl:pl-[100px] relative`}>
            
            {/* Background removed as requested by user */}

            <div className={`transition-all duration-500 ease-in-out ${!isTheaterMode && !isFullscreen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <MovieHeader slug={slug} movieName={movie.name} episodeName={episode.name} />
            </div>

            <div className={`transition-all duration-500 ease-in-out relative ${isExpanded ? 'w-full' : 'max-w-[1900px] mx-auto px-5 lg:px-12'} ${isFullscreen ? '!max-w-none !p-0 !m-0 !fixed !inset-0 !z-[9999]' : ''}`}>
                <div ref={containerCallbackRef} key={`${activeServerIndex}-${episodeSlug}`} className={`aspect-video w-full bg-black/40 border border-white/5 relative overflow-hidden transition-all duration-500 z-10 ${isExpanded ? 'rounded-none border-x-0' : 'rounded-2xl'} ${showEndOverlay ? 'hide-large-play' : ''} [--plyr-color-main:#f59e0b] ${isFullscreen ? '!rounded-none !border-0 !h-screen' : ''}`}>
                    <style jsx global>{`
                        .hide-large-play .plyr__control--overlaid { display: none !important; }
                        .plyr { z-index: auto !important; aspect-ratio: 16/9; width: 100%; border-radius: inherit; touch-action: pan-y; will-change: transform, opacity; }
                        .plyr__controls { z-index: 100 !important; background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5)) !important; transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease !important; transition-delay: 0s !important; }
                        .hide-large-play .plyr__controls { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
                        
                        /* Thêm delay 1.5s trước khi ẩn controls (Chuẩn YouTube/Netflix) */
                        .plyr--hide-controls .plyr__controls {
                            opacity: 0 !important;
                            visibility: hidden !important;
                            pointer-events: none !important;
                            transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease !important;
                            transition-delay: 1.5s !important;
                        }
                        
                        /* Đồng bộ Movie Info và Episode List với Plyr Controls */
                        .watch-top-overlay {
                            /* Khi ẩn đi: mượt và chậm hơn để tạo cảm giác cao cấp */
                            transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
                            transition-delay: 0s !important;
                        }

                        .plyr--hide-controls .watch-top-overlay {
                            opacity: 0 !important;
                            pointer-events: none !important;
                            /* Loại bỏ dịch chuyển, chỉ giữ lại fade */
                            transform: translateY(0) !important;
                            transition-delay: 1.5s !important;
                        }

                        /* Đảm bảo luôn hiện và phản hồi nhanh khi controls hiện */
                        .plyr:not(.plyr--hide-controls) .watch-top-overlay {
                            opacity: 1 !important;
                            transform: translateY(0) !important;
                            pointer-events: auto !important;
                            /* Khi hiện lên: phản hồi nhanh và hỗ trợ hover mượt */
                            transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, border-color 0.3s ease !important;
                            transition-delay: 0s !important;
                        }
                        
                        /* Optimize Layout when in Fullscreen: Hide everything else to free up GPU for orientation change */
                        .video-fullscreen-active > *:not(.relative) {
                            display: none !important;
                        }
                        
                        .plyr--fullscreen-active {
                            background: #000 !important;
                        }

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
                    
                    {/* HLS Video Container (Không xoá khỏi DOM để tránh lỗi NotFoundError của React, chỉ ẩn đi) */}
                    <div className={`w-full h-full absolute inset-0 z-0 ${isEmbedServer ? 'hidden' : 'block'}`}>
                        <video ref={videoRef} crossOrigin="anonymous" className="w-full h-full object-contain" playsInline loop={false} poster={getImageUrl(movie.thumb_url, { width: 1280, quality: 85 })}>
                        </video>
                    </div>

                    {/* Iframe Embed */}
                    {isEmbedServer && embedSrc && (
                        <>
                            <iframe 
                                src={embedSrc}
                                allowFullScreen
                                onLoad={() => setIsIframeLoading(false)}
                                className="w-full h-full border-0 absolute inset-0 z-[5]"
                            />
                            {isIframeLoading && (
                                <div className="absolute inset-0 z-[200] bg-[#0a1628] flex flex-col items-center justify-center p-6 text-center transition-opacity duration-300">
                                    <div className="relative mb-4 md:mb-6">
                                        <div className="md:w-16 md:h-16 w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="md:w-8 md:h-8 w-6 h-6 border-4 border-white/10 border-b-white/40 rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                                        </div>
                                    </div>
                                    <div className="transition-all duration-500 delay-100">
                                        <h3 className="text-white text-md md:text-lg lg:text-xl font-bold tracking-tight mb-2">Đang kết nối Server...</h3>
                                        <p className="text-white/40 text-xs md:text-sm">Vui lòng đợi trong giây lát</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Movie Info Overlay (Top Left) - Rendered into Plyr Container for Fullscreen Support */}
                    {portalTarget && !isEmbedServer && createPortal(
                        <div className={`watch-top-overlay absolute top-2 left-2 md:top-6 md:left-6 z-[110] pointer-events-none max-w-[55%]  lg:max-w-[70%] transition-all duration-500 ${!showEndOverlay ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-white text-[13px] md:text-[20px] font-bold [text-shadow:2px_2px_4px_rgba(0,0,0,0.9)] leading-tight line-clamp-1">
                                    {movie.name}
                                </h1>
                                <div className="flex items-center gap-2 text-white/70 text-[10px] md:text-[14px] font-medium [text-shadow:1px_1px_2px_rgba(0,0,0,0.9)]">
                                    {movie.origin_name && <span className="hidden sm:inline opacity-60 font-normal truncate max-w-[150px] md:max-w-xs">{movie.origin_name}</span>}
                                    {movie.origin_name && <span className="hidden sm:inline opacity-40">•</span>}
                                    <span className="text-amber-400/90 [text-shadow:none] font-bold">{episode.name}</span>
                                </div>
                            </div>
                        </div>,
                        portalTarget
                    )}

                    {/* Episode List Trigger Button (Top Right) */}
                    {portalTarget && createPortal(
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowEpisodeOverlay(true);
                            }}
                            className={`watch-top-overlay absolute top-3 right-3 md:top-8 md:right-8 z-[110] flex items-center gap-2 md:gap-2.5 bg-black/60 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/50 py-1.5 md:py-2.5 px-3 md:px-5 rounded-full transition-all duration-300 cursor-pointer group shadow-lg ${!showEpisodeOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                            <List size={14} className="md:w-5 md:h-5 text-white group-hover:text-amber-400 transition-colors" />
                            <span className="text-white text-[10px] md:text-[14px] font-bold tracking-wide group-hover:text-amber-500 transition-colors">Danh sách tập</span>
                        </button>,
                        portalTarget
                    )}



                    {/* Loading Overlay when switching episodes */}
                    {portalTarget && createPortal(
                        <div
                            className={`absolute inset-0 z-[200] bg-black/60 flex flex-col items-center justify-center p-6 text-center transition-opacity duration-300 ${isChangingEpisode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                            <div className="relative mb-4 md:mb-6">
                                <div className="md:w-16 md:h-16 w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="md:w-8 md:h-8 w-6 h-6 border-4 border-white/10 border-b-white/40 rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                                </div>
                            </div>
                            <div className={`transition-all duration-500 delay-100 ${isChangingEpisode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <h3 className="text-white text-md md:text-lg lg:text-xl font-bold tracking-tight mb-2">Đang chuyển tập...</h3>
                                <p className="text-white/40 text-xs md:text-sm">Vui lòng đợi trong giây lát</p>
                            </div>
                        </div>,
                        portalTarget
                    )}

                    {/* Episode List Overlay Panel */}
                    {portalTarget && createPortal(
                        <div className={`absolute inset-0 z-[210] ${showEpisodeOverlay ? 'visible' : 'invisible'} [transition-property:visibility] duration-500`}>

                            {/* Panel sliding from right */}
                            <div
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                                className={`absolute top-0 right-0 h-full w-[200px] sm:w-[260px] md:w-[360px] bg-[#0F111A] border-l border-white/5 transition-transform duration-500 ease-out flex flex-col select-none outline-none [backface-visibility:hidden] [will-change:transform] [-webkit-tap-highlight-color:transparent] ${showEpisodeOverlay ? 'translate-x-0' : 'translate-x-full'}`}>
                                {/* Header */}
                                <div className="p-2 sm:p-3 lg:p-5 border-b gap-10 border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="text-white text-[13px] md:text-[20px] font-bold line-clamp-1">{movie.name}</h3>
                                        <span className="text-white/40 text-[10px] md:text-xs lg:text-sm">
                                            Danh sách tập • {processedEpisodes[activeServerIndex]?.server_data?.length || 0} tập
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
                                    {processedEpisodes[activeServerIndex]?.server_data?.map((ep, idx) => {
                                        const epSlug = getFriendlyEpisodeSlug(ep.slug);
                                        const isActive = epSlug === episodeSlug;

                                        return (
                                            <TransitionLink
                                                key={idx}
                                                id={isActive ? 'active-episode' : undefined}
                                                href={`/phim/${slug}/${epSlug}`}
                                                transition={!isActive}
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
                                                    <SmartImage
                                                        src={getImageUrl(movie.thumb_url || movie.poster_url, { width: 300, quality: 75 })}
                                                        rawSrc={getRawImageUrl(movie.thumb_url || movie.poster_url)}
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
                                                        {(() => {
                                                            const rawName = ep.name || "";
                                                            const displayName = rawName.replace(/Tập\s*/i, "").trim();
                                                            if (!displayName || /^0+$/.test(displayName) || displayName.toLowerCase() === "trailer") {
                                                                return "Trailer";
                                                            }
                                                            return ep.name;
                                                        })()}
                                                    </h4>
                                                </div>
                                            </TransitionLink>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>,
                        portalTarget
                    )}


                    {/* Replay/End Overlay */}
                    {portalTarget && createPortal(
                        <div
                            className={`absolute inset-0 z-[150] bg-black/90 flex flex-col items-center justify-center p-3 md:p-6 text-center pointer-events-auto transition-opacity duration-300 ${showEndOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                            <div className="flex items-center justify-center gap-4 md:gap-8 scale-90 md:scale-100">
                                <button
                                    onClick={() => {
                                        setShowEndOverlay(false);
                                        showEndOverlayRef.current = false;
                                        if (plyrRef.current) {
                                            plyrRef.current.currentTime = 0;
                                            plyrRef.current.play();
                                        }
                                    }}
                                    className={`group flex cursor-pointer flex-col items-center gap-3 hover:scale-105 transition-all duration-500 ${showEndOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                                >
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 group-hover:bg-white/20">
                                        <RefreshCcw size={20} className="md:w-6 md:h-6" />
                                    </div>
                                    <span className="text-white/80 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Xem lại</span>
                                </button>

                                <button
                                    onClick={() => setShowEpisodeOverlay(true)}
                                    className={`group flex cursor-pointer flex-col items-center gap-3 hover:scale-105 transition-all duration-500 delay-75 ${showEndOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                                >
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 group-hover:bg-white/20">
                                        <List size={20} className="md:w-6 md:h-6" />
                                    </div>
                                    <span className="text-white/80 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Danh sách tập</span>
                                </button>
                            </div>
                        </div>,
                        portalTarget
                    )}


                </div>

                    {/* Dual Subtitles — Custom Overlay using Native Plyr CSS */}
                    {portalTarget && !isEmbedServer && (subtitle1Text || subtitle2Text) && createPortal(
                        <div className="plyr__captions" dir="auto" style={{ pointerEvents: 'none', display: 'block' }}>
                            {subtitle1Text && (
                                <span className="plyr__caption" style={{ display: 'inline-block', width: '100%' }}>
                                    {subtitle1Text}
                                </span>
                            )}
                            {subtitle2Text && (
                                <span className="plyr__caption" style={{ display: 'inline-block', width: '100%', fontSize: '0.85em', color: '#f59e0b', marginTop: subtitle1Text ? '4px' : '0' }}>
                                    {subtitle2Text}
                                </span>
                            )}
                        </div>,
                        portalTarget
                    )}

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
                        episodes={processedEpisodes}
                        activeServer={activeServerIndex}
                        onServerChange={handleServerChange}
                        onReport={() => setShowReportModal(true)}
                        onShare={() => setShowShareModal(true)}
                        subtitles={episodeSubtitles}
                        subtitleSlot1={slot1}
                        subtitleSlot2={slot2}
                        onSubtitleSlot1Change={setSlot1}
                        onSubtitleSlot2Change={setSlot2}
                    />
                </div>
            </div>

            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${!isTheaterMode ? "max-h-[5000px] opacity-100 mt-8" : "max-h-0 opacity-0 mt-0"
                    }`}
            >
                <Container className="wc-main">
                    <div className="flex flex-col xl:flex-row gap-8">
                        <div className="flex-1">
            {subtitlePortalNode && hasCustomSubtitles && createPortal(
                <DualSubtitleMenu 
                    subtitles={episodeSubtitles}
                    subtitleSlot1={slot1}
                    subtitleSlot2={slot2}
                    onSubtitleSlot1Change={setSlot1}
                    onSubtitleSlot2Change={setSlot2}
                />,
                subtitlePortalNode
            )}

                            <div className="flex flex-col gap-6 p-5 md:p-10 bg-white/[0.03] border border-white/10 rounded-3xl">
                                <MovieInfo slug={slug} movie={movie} episode={episode} />
                                <EpisodeList
                                    slug={slug}
                                    currentEpisode={episodeSlug}
                                    episodes={processedEpisodes}
                                    activeServer={activeServerIndex}
                                    onServerChange={handleServerChange}
                                    onEpisodeClick={() => setIsChangingEpisode(true)}
                                />
                                <div className="mt-6 pt-6 border-t border-white/5">
                                    <CommentSection movieSlug={`${slug}/${getFriendlyEpisodeSlug(episodeSlug)}`} />
                                </div>
                            </div>
                        </div>
                        <div className="w-full xl:w-100">
                            <Sidebar movie={movie} suggestedMovies={filteredSuggestions} />
                        </div>
                    </div>
                </Container>
            </div>

            <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} movieName={movie.name} episodeName={episode.name} />
            <ShareModal 
                isOpen={showShareModal} 
                onClose={() => setShowShareModal(false)} 
                movieName={movie.name} 
                shareUrl={typeof window !== "undefined" ? `${window.location.origin}/phim/${slug}/${episodeSlug}${user ? `?ref=${user.id}` : ''}` : ''} 
            />
        </div>
    );
}
