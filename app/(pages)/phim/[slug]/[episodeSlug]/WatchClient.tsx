"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

import TransitionLink from "@/app/components/Transition/TransitionLink";
import { AlertTriangle, RefreshCcw, List, X } from "lucide-react";
import { useRouter } from "next/navigation";

import Hls from "hls.js";
import Artplayer from "artplayer";

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
import { useFavorites } from "./hooks/useFavorites";
import { useWatchlist } from "./hooks/useWatchlist";
import { useWatchProgress } from "./hooks/useWatchProgress";

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
    episodeSlug: initialEpisodeSlug,
    movie: initialMovie,
    episode: initialEpisode,
    episodes,
    suggestedMovies: initialSuggestions
}: WatchClientProps) {
    // 🌟 Local state for episode switching — avoids server re-render on episode change
    const [currentEpisodeSlug, setCurrentEpisodeSlug] = useState(initialEpisodeSlug);
    const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
    const [movie, setMovie] = useState<any>(initialMovie);

    // Sync from props only on full navigation (different slug or initial load)
    useEffect(() => {
        setCurrentEpisodeSlug(initialEpisodeSlug);
        setCurrentEpisode(initialEpisode);
    }, [initialEpisodeSlug, initialEpisode]);

    const processedEpisodes = useMemo(() => {
        if (!episodes) return [];
        const list: typeof episodes = [];
        episodes.forEach(server => {
            list.push({
                ...server,
                server_name: `${server.server_name} - VIP`
            });
            if (server.server_data.some(ep => ep.link_embed)) {
                list.push({
                    ...server,
                    server_name: `${server.server_name} - Dự Phòng`
                });
            }
        });
        return list;
    }, [episodes]);

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
    }, [slug, currentEpisodeSlug]);

    useEffect(() => { userRef.current = user; }, [user]);
    const autoNextRef = useRef(isAutoNext);
    useEffect(() => { autoNextRef.current = isAutoNext; }, [isAutoNext]);

    const [hasResumed, setHasResumed] = useState(false);
    const [showEndOverlay, setShowEndOverlay] = useState(false);
    const showEndOverlayRef = useRef(false);
    const [artContainer, setArtContainer] = useState<HTMLElement | null>(null);
    const [subtitlePortalNode, setSubtitlePortalNode] = useState<HTMLElement | null>(null);
    const artContainerRef = useRef<HTMLDivElement>(null);
    const [tapState, setTapState] = useState<{
        side: 'left' | 'right' | null;
        accumulated: number;
        ripples: Array<{ id: number; x: number; y: number }>;
    }>({
        side: null,
        accumulated: 0,
        ripples: []
    });

    const accumulatedSecondsRef = useRef<number>(0);
    const activeSideRef = useRef<'left' | 'right' | null>(null);
    const lastSeekTapTimeRef = useRef<number>(0);
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isArtReady, setIsArtReady] = useState(false);
    const [showEpisodeOverlay, setShowEpisodeOverlay] = useState(false);
    const [isChangingEpisode, setIsChangingEpisode] = useState(false);
    const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
    const fullscreenWrapperRef = useRef<HTMLDivElement>(null);
    const [isIframeLoading, setIsIframeLoading] = useState(false);

    useEffect(() => { showEndOverlayRef.current = showEndOverlay; }, [showEndOverlay]);
    const showEpisodeOverlayRef = useRef(showEpisodeOverlay);
    useEffect(() => { showEpisodeOverlayRef.current = showEpisodeOverlay; }, [showEpisodeOverlay]);

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
    const artRef = useRef<Artplayer | null>(null);
    const fallbackTimeRef = useRef<number>(0);
    const seekTargetRef = useRef<number | null>(null);
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Subtitle management (must be after videoRef)
    const episodeSubtitles = currentEpisode.subtitles || [];
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

        return server.server_data.findIndex((ep: any) => getFriendlyEpisodeSlug(ep.slug) === currentEpisodeSlug);
    }, [processedEpisodes, activeServerIndex, currentEpisodeSlug]);

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
    }, [activeServerIndex, currentEpisodeSlug]);

    const videoSrc = useMemo(() => {
        let originalSrc = currentEpisode.link_m3u8;
        if (processedEpisodes && processedEpisodes.length > 0) {
            const server = processedEpisodes[activeServerIndex] || processedEpisodes[0];
            const found = server.server_data.find((ep) => getFriendlyEpisodeSlug(ep.slug) === currentEpisodeSlug);
            if (found) {
                originalSrc = found.link_m3u8;
            } else {
                for (const s of processedEpisodes) {
                    const f = s.server_data.find((ep) => getFriendlyEpisodeSlug(ep.slug) === currentEpisodeSlug);
                    if (f) {
                        originalSrc = f.link_m3u8;
                        break;
                    }
                }
            }
        }
        return originalSrc;
    }, [activeServerIndex, currentEpisodeSlug, processedEpisodes, currentEpisode.link_m3u8]);

    const embedSrc = useMemo(() => {
        if (!isEmbedServer) return null;
        const server = processedEpisodes[activeServerIndex];
        const found = server?.server_data.find((ep) => getFriendlyEpisodeSlug(ep.slug) === currentEpisodeSlug);
        return found?.link_embed || null;
    }, [isEmbedServer, processedEpisodes, activeServerIndex, currentEpisodeSlug]);

    useEffect(() => {
        if (embedSrc) setIsIframeLoading(true);
    }, [embedSrc]);

    useEffect(() => {
        setShowEndOverlay(false);
        setIsChangingEpisode(false);
        fallbackTimeRef.current = 0;
    }, [currentEpisodeSlug]);

    useEffect(() => {
        const savedAutoNext = localStorage.getItem('lofilm-auto-next');
        if (savedAutoNext !== null) {
            setIsAutoNext(savedAutoNext === 'true');
        }
    }, []);


    useEffect(() => {
        const correctMainMovie = async () => {
            const curNum = parseInt(movie.episode_current?.match(/\d+/)?.[0] || "0");
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

    const toggleFullscreen = useCallback(() => {
        const wrapper = fullscreenWrapperRef.current;
        if (!wrapper) return;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        } else {
            wrapper.requestFullscreen().catch(() => { });
        }
    }, []);

    const toggleAutoNext = useCallback(() => {
        const newValue = !isAutoNext;
        setIsAutoNext(newValue);
        localStorage.setItem('lofilm-auto-next', String(newValue));
    }, [isAutoNext]);

    const { isFavorited, toggleFavorite } = useFavorites(
        slug,
        movie.name,
        movie.poster_url,
        movie.thumb_url
    );

    const { isInWatchlist, toggleWatchlist } = useWatchlist(
        user,
        slug,
        movie.name,
        movie.poster_url,
        movie.thumb_url
    );

    const { saveProgress, handleTimeUpdate } = useWatchProgress(
        user,
        slug,
        currentEpisodeSlug,
        movie,
        currentEpisode
    );

    // Refs to keep callback references stable inside the Artplayer player initialization closure
    const saveProgressRef = useRef(saveProgress);
    const handleTimeUpdateRef = useRef(handleTimeUpdate);
    useEffect(() => {
        saveProgressRef.current = saveProgress;
        handleTimeUpdateRef.current = handleTimeUpdate;
    }, [saveProgress, handleTimeUpdate]);

    // 🌟 Episode selection handler — avoids server re-render
    const selectEpisode = useCallback((epSlug: string) => {
        if (epSlug === currentEpisodeSlug) return;

        // Update URL silently
        const newUrl = `/phim/${slug}/${epSlug}`;
        window.history.replaceState(null, '', newUrl);

        // Find new episode data from processedEpisodes
        let newEpisode = null;
        let foundServerIndex = 0;
        for (let i = 0; i < processedEpisodes.length; i++) {
            const server = processedEpisodes[i];
            const found = server.server_data.find((ep: any) => getFriendlyEpisodeSlug(ep.slug) === epSlug);
            if (found) {
                newEpisode = found;
                foundServerIndex = i;
                break;
            }
        }

        if (!newEpisode) return;

        // If it's on a different server, switch server too
        setActiveServerIndex(foundServerIndex);
        setIsChangingEpisode(true);
        setCurrentEpisodeSlug(epSlug);
        setCurrentEpisode({
            name: newEpisode.name,
            link_m3u8: newEpisode.link_m3u8,
            link_vtt: (newEpisode as any).link_vtt || '',
            subtitles: (newEpisode as any).subtitles || [],
        });
    }, [slug, currentEpisodeSlug, processedEpisodes]);

    // Navigate to next episode (auto-next)
    const goToNextEpisode = useCallback(() => {
        if (!nextEpisode) return;
        selectEpisode(getFriendlyEpisodeSlug(nextEpisode.slug));
    }, [nextEpisode, selectEpisode]);

    useEffect(() => {
        if (isEmbedServer) return;

        let isMounted = true;
        const container = artContainerRef.current;
        if (!container) return;

        const initTimeout = setTimeout(async () => {
            if (!isMounted || !container) return;
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
                        .eq('episode_slug', currentEpisodeSlug)
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
                            const item = history[`${slug}/${currentEpisodeSlug}`];
                            if (item && item.watched_seconds > 10) {
                                startFrom = item.watched_seconds;
                            }
                        }
                    } catch (e) { }
                }
            }

            if (!isMounted) return;

            const art = new Artplayer({
                container: container,
                url: videoSrc,
                theme: '#f59e0b',
                volume: 1,
                isLive: false,
                muted: false,
                autoplay: true,
                pip: true,
                autoSize: false,
                autoMini: false,
                setting: true,
                loop: false,
                flip: true,
                playbackRate: true,
                aspectRatio: true,
                fullscreen: false,
                fullscreenWeb: false,
                subtitleOffset: true,
                miniProgressBar: false,
                mutex: true,
                backdrop: true,
                playsInline: true,
                autoPlayback: true,
                airplay: true,
                hotkey: false,
                lock: true,
                ...({ tooltips: false } as any),
                poster: getImageUrl(movie.thumb_url, { width: 1280, quality: 85 }),
                icons: {
                    loading: '<img src="/images/ploading.gif">',
                    state: '<img width="150" height="150" src="/images/state.svg">',
                    indicator: '<img width="16" height="16" src="/images/indicator.svg">',
                    play: '<img style="width: 40px; height: 40px;" class="sm:w-16 sm:h-16" src="https://sf-static.onflixcdn.pics/images/svg/1760902371_play-circle-svgrepo-com.svg">',
                    pause: '<img style="width: 40px; height: 40px;" class="sm:w-16 sm:h-16" src="https://sf-static.onflixcdn.pics/images/svg/1760902631_pause-circle-svgrepo-com.svg">',
                    fullscreen: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" class="icon" viewBox="0 0 1024 1024"><path d="M625.778 256H768v142.222h113.778v-256h-256ZM256 398.222V256h142.222V142.222h-256v256Zm512 227.556V768H625.778v113.778h256v-256ZM398.222 768H256V625.778H142.222v256h256Z"></path></svg>',
                    fullscreenExit: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" class="icon" viewBox="0 0 1024 1024"><path d="M768 298.667h170.667V384h-256V128H768ZM341.333 384h-256v-85.333H256V128h85.333ZM768 725.333V896h-85.333V640h256v85.333ZM341.333 640v256H256V725.333H85.333V640Z"></path></svg>',
                    setting: '<div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;cursor:pointer;"><img src="https://sf-static.onflixcdn.pics/images/svg/1773141205_setting_flix.svg?v=2" style="width:24px;height:24px;object-fit:contain;opacity:0.85;transition:opacity 0.15s;" onmouseover="this.style.opacity=\'1\'" onmouseout="this.style.opacity=\'0.85\'"></div>',
                },
                customType: {
                    m3u8: function (video, url, art) {
                        if (Hls.isSupported()) {
                            if (art.hls) (art.hls as Hls).destroy();
                            const hls = new Hls({
                                startPosition: startFrom > 0 ? startFrom : -1,
                                enableWorker: true,
                            });
                            hls.loadSource(url);
                            hls.attachMedia(video);
                            art.hls = hls;
                            hlsRef.current = hls;

                            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                                if (!hasCustomSubtitles && currentEpisode.link_vtt) {
                                    const existingTracks = video.querySelectorAll('track');
                                    existingTracks.forEach(t => t.remove());

                                    const track = document.createElement('track');
                                    track.kind = 'captions';
                                    track.label = 'Vietnamese';
                                    track.srclang = 'vi';
                                    track.src = currentEpisode.link_vtt;
                                    track.default = true;
                                    video.appendChild(track);
                                }
                            });

                            hls.on(Hls.Events.ERROR, (event, data) => {
                                if (data.fatal) {
                                    setHasError(true);
                                    switch (data.type) {
                                        case Hls.ErrorTypes.NETWORK_ERROR:
                                            hls.startLoad();
                                            break;
                                        case Hls.ErrorTypes.MEDIA_ERROR:
                                            hls.recoverMediaError();
                                            break;
                                    }
                                }
                            });
                        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                            video.src = url;
                        }
                    }
                },
                controls: [
                    {
                        position: 'left',
                        html: '<div class="art-control-skip desktop-skip-btn"><img class="w-5 h-5 sm:w-6 sm:h-6" src="https://sf-static.onflixcdn.pics/images/svg/1756189000_-10.svg"></div>',
                        index: 11,
                        click: function () { this.forward = -10; }
                    },
                    {
                        position: 'left',
                        html: '<div class="art-control-skip desktop-skip-btn"><img class="w-5 h-5 sm:w-6 sm:h-6" src="https://sf-static.onflixcdn.pics/images/svg/1756189026_+10.svg"></div>',
                        index: 12,
                        click: function () { this.forward = 10; }
                    },
                    {
                        position: 'right',
                        html: '<div id="custom-subtitle-portal-target" class="flex items-center"></div>',
                        index: 10,
                    },
                    {
                        position: 'right',
                        html: '<div id="custom-fullscreen-btn" class="art-control art-control-fullscreen hint--rounded hint--top" data-index="70" aria-label="Fullscreen"><i class="art-icon art-icon-fullscreenOn" style="display: inline-flex;"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" class="icon" viewBox="0 0 1024 1024"><path d="M625.778 256H768v142.222h113.778v-256h-256ZM256 398.222V256h142.222V142.222h-256v256Zm512 227.556V768H625.778v113.778h256v-256ZM398.222 768H256V625.778H142.222v256h256Z"></path></svg></i><i class="art-icon art-icon-fullscreenOff" style="display: none;"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" class="icon" viewBox="0 0 1024 1024"><path d="M768 298.667h170.667V384h-256V128H768ZM341.333 384h-256v-85.333H256V128h85.333ZM768 725.333V896h-85.333V640h256v85.333ZM341.333 640v256H256V725.333H85.333V640Z"></path></svg></i></div>',
                        index: 41,
                        click: function () {
                            const event = new CustomEvent('art-fullscreen-toggle');
                            window.dispatchEvent(event);
                        }
                    }
                ]
            });

            artRef.current = art;
            videoRef.current = art.video;
            setIsArtReady(true);

            art.on('ready', () => {
                setArtContainer(art.template.$player);
                const portalNode = art.template.$player.querySelector('#custom-subtitle-portal-target') as HTMLElement;
                if (portalNode) {
                    setSubtitlePortalNode(portalNode);
                }

                if (startFrom > 0 && (!hasResumed || isFallbackResume)) {
                    if (isFallbackResume) {
                        toast.success(`Đang tự động kết nối máy chủ dự phòng...`, { icon: '🔄', duration: 2500 });
                        fallbackTimeRef.current = 0;
                    } else {
                        toast.success(`Đã khôi phục vị trí xem cũ: ${Math.floor(startFrom / 60)} phút`, { icon: '🕒', duration: 2500 });
                    }
                    if (!hasResumed) setHasResumed(true);
                }
            });

            art.on('play', () => {
                if (showEndOverlayRef.current) {
                    setTimeout(() => { if (artRef.current && showEndOverlayRef.current) artRef.current.pause(); }, 10);
                }
            });

            art.on('pause', () => {
                if (artRef.current) {
                    saveProgressRef.current(artRef.current.currentTime, artRef.current.duration, true);
                }
            });

            art.on('playing', () => { setHasStartedPlaying(true); setHasError(false); });

            art.on('video:timeupdate', () => {
                if (!artRef.current) return;
                handleTimeUpdateRef.current(artRef.current.currentTime, artRef.current.duration, artRef.current.video.paused);
            });

            art.on('video:seeked', () => {
                if (!artRef.current) return;
                const duration = artRef.current.duration;
                const currentTime = artRef.current.currentTime;
                if (duration > 0 && currentTime >= duration - 0.5) {
                    if (isSeries && nextEpisode && autoNextRef.current) {
                        setTimeout(() => {
                            if (artRef.current) artRef.current.pause();
                        }, 10);
                        setIsChangingEpisode(true);
                        goToNextEpisode();
                    } else if (!showEndOverlayRef.current) {
                        setTimeout(() => {
                            if (artRef.current) {
                                artRef.current.pause();
                                artRef.current.currentTime = duration - 0.1;
                            }
                        }, 10);
                        setShowEndOverlay(true);
                    }
                }
            });

            art.on('video:ended', () => {
                if (isSeries && nextEpisode && autoNextRef.current) {
                    setIsChangingEpisode(true);
                    goToNextEpisode();
                } else if (!showEndOverlayRef.current) {
                    setTimeout(() => {
                        if (artRef.current) {
                            artRef.current.pause();
                            artRef.current.currentTime = artRef.current.duration - 0.1;
                        }
                    }, 10);
                    setShowEndOverlay(true);
                }
            });

        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(initTimeout);
            if (artRef.current) {
                try { artRef.current.destroy(true); } catch (e) { }
                artRef.current = null;
                setArtContainer(null);
            }
            if (hlsRef.current) {
                try { hlsRef.current.destroy(); } catch (e) { }
                hlsRef.current = null;
            }
        };
    }, [videoSrc, nextEpisode, slug, isEmbedServer, goToNextEpisode]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;

            const player = artRef.current;
            if (!player) return;

            const code = e.code;

            switch (code) {
                case 'Space':
                case 'KeyK':
                    e.preventDefault();
                    e.stopPropagation();
                    player.toggle();
                    break;
                case 'ArrowRight':
                case 'KeyL':
                    e.preventDefault();
                    player.forward = 10;
                    break;
                case 'ArrowLeft':
                case 'KeyJ':
                    e.preventDefault();
                    player.backward = 10;
                    break;
                case 'KeyF':
                    e.preventDefault();
                    toggleFullscreen();
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

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, []);

    // 🌟 Double-tap gesture for mobile/tablet: left 40% → backward seek (with accumulation), right 40% → forward seek (with accumulation)
    useEffect(() => {
        const container = artContainerRef.current;
        if (!container || isEmbedServer) return;

        let lastTapTime = 0;
        let lastTapX = 0;

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length !== 1) return;

            const now = Date.now();
            const touch = e.touches[0];
            const tapX = touch.clientX;
            const rect = container.getBoundingClientRect();
            const x = tapX - rect.left;
            const y = touch.clientY - rect.top;
            const ratio = x / rect.width;

            // Define seek zones (left 40% and right 40%). The remaining 20% in the middle is neutral.
            const side: 'left' | 'right' | null = ratio < 0.4 ? 'left' : ratio > 0.6 ? 'right' : null;
            const player = artRef.current;
            if (!player) return;

            if (!side) {
                // Middle zone tap
                lastTapTime = now;
                lastTapX = tapX;
                return;
            }

            const isDoubleTap = (now - lastTapTime < 300) && (Math.abs(tapX - lastTapX) < 40);
            const isContinuation = activeSideRef.current === side && (now - lastSeekTapTimeRef.current < 800);

            if (isDoubleTap || isContinuation) {
                e.preventDefault();
                e.stopPropagation();

                let newAccumulated = 10;
                if (isContinuation) {
                    newAccumulated = accumulatedSecondsRef.current + 10;
                }

                // Perform seek
                if (side === 'left') {
                    player.backward = 10;
                } else {
                    player.forward = 10;
                }

                accumulatedSecondsRef.current = newAccumulated;
                activeSideRef.current = side;
                lastSeekTapTimeRef.current = now;

                // Reset standard double tap detection
                lastTapTime = 0;
                lastTapX = 0;

                // Generate a unique ripple ID
                const rippleId = now + Math.random();

                setTapState(prev => ({
                    side,
                    accumulated: newAccumulated,
                    ripples: [...prev.ripples, { id: rippleId, x, y }]
                }));

                // Auto-remove ripple after animation finishes (800ms)
                setTimeout(() => {
                    setTapState(prev => ({
                        ...prev,
                        ripples: prev.ripples.filter(r => r.id !== rippleId)
                    }));
                }, 800);

                // Reset seek accumulator and active side after 800ms of inactivity
                if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
                resetTimeoutRef.current = setTimeout(() => {
                    setTapState(prev => ({ ...prev, side: null, accumulated: 0 }));
                    accumulatedSecondsRef.current = 0;
                    activeSideRef.current = null;
                }, 800);
            } else {
                lastTapTime = now;
                lastTapX = tapX;
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        };
    }, [isEmbedServer]);

    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );
            setIsFullscreen(isFs);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        if (isTheaterMode) document.body.classList.add('theater-mode');
        else document.body.classList.remove('theater-mode');
        return () => document.body.classList.remove('theater-mode');
    }, [isTheaterMode]);

    useEffect(() => {
        if (isFullscreen) {
            document.documentElement.classList.add('fullscreen-scrollbar-fix');
            const orientation = (screen as any).orientation;
            if (orientation && typeof orientation.lock === 'function') {
                orientation.lock('landscape').catch(() => { });
            }
        } else {
            document.documentElement.classList.remove('fullscreen-scrollbar-fix');
            const orientation = (screen as any).orientation;
            if (orientation && typeof orientation.unlock === 'function') {
                orientation.unlock();
            }
        }
        return () => {
            document.documentElement.classList.remove('fullscreen-scrollbar-fix');
            const orientation = (screen as any).orientation;
            if (orientation && typeof orientation.unlock === 'function') {
                orientation.unlock();
            }
        };
    }, [isFullscreen]);



    // Listen for custom fullscreen toggle event from ArtPlayer
    useEffect(() => {
        const handler = () => toggleFullscreen();
        window.addEventListener('art-fullscreen-toggle', handler);
        return () => window.removeEventListener('art-fullscreen-toggle', handler);
    }, [toggleFullscreen]);

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
                }, 100);
            }
        }
    }, [showEpisodeOverlay, currentEpisodeSlug, activeServerIndex]);

    if (!movie || !currentEpisode) return null;

    const portalTarget = isEmbedServer ? containerNode : artContainer;

    return (
        <div className={`pt-35 ${isTheaterMode ? "pb-4 min-h-0" : "pb-12 min-h-screen"} transition-all duration-500 animate-fade-in ${isFullscreen ? 'video-fullscreen-active' : ''} xl:-ml-[100px] xl:w-[calc(100%+100px)] xl:pl-[100px] relative`}>

            {/* Background removed as requested by user */}

            <div className={`transition-all duration-500 ease-in-out ${!isTheaterMode && !isFullscreen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <MovieHeader slug={slug} movieName={movie.name} episodeName={currentEpisode.name} />
            </div>

            <div ref={fullscreenWrapperRef} className={`transition-all duration-500 ease-in-out relative ${isExpanded ? 'w-full' : 'max-w-[1900px] mx-auto px-5 lg:px-12'} ${isFullscreen ? '!max-w-none !p-0 !m-0 !fixed !inset-0 !z-[9999]' : ''}`}>
                <div ref={containerCallbackRef} className={`aspect-video w-full bg-black/40 border border-white/5 relative overflow-hidden transition-all duration-500 z-10 ${isExpanded ? 'rounded-none border-x-0' : 'rounded-2xl'} ${showEndOverlay ? 'hide-large-play' : ''} [--plyr-color-main:#f59e0b] ${isFullscreen ? '!rounded-none !border-0 !h-screen' : ''}`}>
                    <style jsx global>{`
                        .art-video-player .art-bottom {
                            z-index: 50 !important;
                        }
                        .art-video-player .art-layer {
                            z-index: 40 !important;
                        }
                        .watch-top-overlay {
                            transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
                            transition-delay: 0s !important;
                        }
                        .art-hide-cursor .watch-top-overlay {
                            opacity: 0 !important;
                            pointer-events: none !important;
                            transform: translateY(-10px) !important;
                            transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                            transition-delay: 0s !important;
                        }
                        .art-video-player:not(.art-hide-cursor) .watch-top-overlay {
                            opacity: 1 !important;
                            transform: translateY(0) !important;
                            pointer-events: auto !important;
                            transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                            transition-delay: 0.15s !important;
                        }
                        
                        .video-fullscreen-active > *:not(.relative) {
                            display: none !important;
                        }

                        .art-video-player .art-notice {
                            display: none !important;
                        }

                        /* === FADE MƯỢT CHO TOÀN BỘ CONTROLS NHƯ NETFLIX/YOUTUBE === */
                        /** Chỉ set transition duration - Artplayer tự xử lý show/hide + fade với transition: all sẵn có */
                        .art-video-player {
                            --art-transition-duration: 0.35s !important;
                        }

                        /* Trên mobile/tablet, dịch cụm controls trái vào trong để nút play không bị tràn ra ngoài mép progress bar */
                        @media (max-width: 1024px) {
                            .art-controls-left {
                                padding-left: 8px !important;
                            }
                        }
                        @media (max-width: 640px) {
                            .art-controls-left {
                                padding-left: 4px !important;
                            }
                        }

                        /* Ẩn nút tua 10s trên mobile dọc (portrait) */
                        @media (max-width: 768px) and (orientation: portrait) {
                            .art-control[data-index="11"],
                            .art-control[data-index="12"] {
                                display: none !important;
                                width: 0 !important;
                                min-width: 0 !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                overflow: hidden !important;
                                flex: 0 0 0 !important;
                            }
                        }

                        /* Safe-area cho fullscreen: đẩy video vào giữa tránh camera/notch che trên Android */
                        .video-fullscreen-active .art-video-player {
                            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left) !important;
                            box-sizing: border-box !important;
                        }

                        /* Đẩy nút ổ khóa ra khỏi vùng camera notch khi fullscreen landscape */
                        .video-fullscreen-active .art-lock {
                            left: max(16px, env(safe-area-inset-left)) !important;
                        }

                        /* === CUSTOM DOUBLE-TAP RIPPLE & BUBBLE ANIMATIONS === */
                        @keyframes ripple-expand {
                            0% {
                                width: 0px;
                                height: 0px;
                                opacity: 0.55;
                            }
                            100% {
                                width: 600px;
                                height: 600px;
                                opacity: 0;
                            }
                        }
                        .animate-ripple-expand {
                            animation: ripple-expand 0.75s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
                        }

                        @keyframes bubble-pop-in {
                            0% {
                                transform: translate(-50%, -50%) scale(0.65);
                                opacity: 0;
                            }
                            60% {
                                transform: translate(-50%, -50%) scale(1.08);
                                opacity: 1;
                            }
                            100% {
                                transform: translate(-50%, -50%) scale(1);
                                opacity: 1;
                            }
                        }
                        .animate-bubble-pop-in {
                            animation: bubble-pop-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                        }

                        @keyframes arrow-flash-right {
                            0% { opacity: 0.15; transform: translateX(-3px); }
                            50% { opacity: 1; transform: translateX(3px); }
                            100% { opacity: 0.15; transform: translateX(-3px); }
                        }
                        .arrow-right-1 {
                            animation: arrow-flash-right 0.6s infinite;
                            animation-delay: 0s;
                        }
                        .arrow-right-2 {
                            animation: arrow-flash-right 0.6s infinite;
                            animation-delay: 0.12s;
                        }
                        .arrow-right-3 {
                            animation: arrow-flash-right 0.6s infinite;
                            animation-delay: 0.24s;
                        }

                        @keyframes arrow-flash-left {
                            0% { opacity: 0.15; transform: translateX(3px); }
                            50% { opacity: 1; transform: translateX(-3px); }
                            100% { opacity: 0.15; transform: translateX(3px); }
                        }
                        .arrow-left-1 {
                            animation: arrow-flash-left 0.6s infinite;
                            animation-delay: 0.24s;
                        }
                        .arrow-left-2 {
                            animation: arrow-flash-left 0.6s infinite;
                            animation-delay: 0.12s;
                        }
                        .arrow-left-3 {
                            animation: arrow-flash-left 0.6s infinite;
                            animation-delay: 0s;
                        }

                        .side-overlay-left {
                            background: radial-gradient(circle at 0% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 75%);
                        }
                        .side-overlay-right {
                            background: radial-gradient(circle at 100% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 75%);
                        }
                    `}</style>

                    {/* HLS Video Container */}
                    <div className={`w-full h-full absolute inset-0 z-0 ${isEmbedServer ? 'hidden' : 'block'}`}>
                        <div ref={artContainerRef} className="w-full h-full"></div>
                    </div>

                    {/* Double-tap visual indicators (mobile/tablet) */}
                    {!isEmbedServer && (
                        <>
                            {/* Tap ripples container */}
                            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                                {tapState.ripples.map(ripple => (
                                    <div
                                        key={ripple.id}
                                        className="absolute rounded-full bg-white/20 animate-ripple-expand pointer-events-none"
                                        style={{
                                            left: ripple.x,
                                            top: ripple.y,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Left double-tap region (40% width) */}
                            <div
                                className="absolute left-0 top-0 w-[40%] h-full z-20 pointer-events-none transition-opacity duration-300"
                                style={{ opacity: tapState.side === 'left' ? 1 : 0 }}
                            >
                                {/* Radial highlight */}
                                <div className="absolute inset-0 side-overlay-left pointer-events-none" />

                                {/* Seek Indicator Overlay */}
                                {tapState.side === 'left' && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center animate-bubble-pop-in pointer-events-none">
                                        <div className="flex items-center gap-0.5 mb-1.5 justify-center">
                                            <svg className="arrow-left-1" width="18" height="18" viewBox="0 0 24 24" fill="white"><polyline points="15 18 9 12 15 6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
                                            <svg className="arrow-left-2" width="18" height="18" viewBox="0 0 24 24" fill="white"><polyline points="15 18 9 12 15 6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
                                            <svg className="arrow-left-3" width="18" height="18" viewBox="0 0 24 24" fill="white"><polyline points="15 18 9 12 15 6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
                                        </div>
                                        <div className="text-white text-xs font-semibold tracking-wide" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)', fontFamily: '-apple-system, sans-serif' }}>
                                            -{tapState.accumulated} giây
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right double-tap region (40% width) */}
                            <div
                                className="absolute right-0 top-0 w-[40%] h-full z-20 pointer-events-none transition-opacity duration-300"
                                style={{ opacity: tapState.side === 'right' ? 1 : 0 }}
                            >
                                {/* Radial highlight */}
                                <div className="absolute inset-0 side-overlay-right pointer-events-none" />

                                {/* Seek Indicator Overlay */}
                                {tapState.side === 'right' && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center animate-bubble-pop-in pointer-events-none">
                                        <div className="flex items-center gap-0.5 mb-1.5 justify-center">
                                            <svg className="arrow-right-1" width="18" height="18" viewBox="0 0 24 24" fill="white"><polyline points="9 18 15 12 9 6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
                                            <svg className="arrow-right-2" width="18" height="18" viewBox="0 0 24 24" fill="white"><polyline points="9 18 15 12 9 6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
                                            <svg className="arrow-right-3" width="18" height="18" viewBox="0 0 24 24" fill="white"><polyline points="9 18 15 12 9 6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
                                        </div>
                                        <div className="text-white text-xs font-semibold tracking-wide" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)', fontFamily: '-apple-system, sans-serif' }}>
                                            +{tapState.accumulated} giây
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

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
                                <div className="absolute inset-0 z-[200] bg-[#0F1115] flex flex-col items-center justify-center p-6 text-center transition-opacity duration-300">
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

                    {/* Movie Info Overlay (Top Left) */}
                    {portalTarget && !isEmbedServer && createPortal(
                        <div className={`watch-top-overlay absolute top-2 left-2 md:top-6 md:left-6 z-[110] pointer-events-none max-w-[55%]  lg:max-w-[70%] transition-all duration-500 ${!showEndOverlay ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-white text-[13px] md:text-[20px] font-bold [text-shadow:2px_2px_4px_rgba(0,0,0,0.9)] leading-tight line-clamp-1">
                                    {movie.name}
                                </h1>
                                <div className="flex items-center gap-2 text-white/70 text-[10px] md:text-[14px] font-medium [text-shadow:1px_1px_2px_rgba(0,0,0,0.9)]">
                                    {movie.origin_name && <span className="hidden sm:inline opacity-60 font-normal truncate max-w-[150px] md:max-w-xs">{movie.origin_name}</span>}
                                    {movie.origin_name && <span className="hidden sm:inline opacity-40">•</span>}
                                    <span className="text-amber-400/90 [text-shadow:none] font-bold">{currentEpisode.name}</span>
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

                            <div
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                                className={`absolute top-0 right-0 h-full w-[200px] sm:w-[260px] md:w-[360px] bg-[#0F1115] border-l border-white/5 transition-transform duration-500 ease-out flex flex-col select-none outline-none [backface-visibility:hidden] [will-change:transform] [-webkit-tap-highlight-color:transparent] ${showEpisodeOverlay ? 'translate-x-0' : 'translate-x-full'}`}>
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
                                        const isActive = epSlug === currentEpisodeSlug;

                                        return (
                                            <button
                                                key={idx}
                                                id={isActive ? 'active-episode' : undefined}
                                                onClick={() => {
                                                    if (!isActive) {
                                                        setIsChangingEpisode(true);
                                                        setShowEpisodeOverlay(false);
                                                        selectEpisode(epSlug);
                                                    }
                                                }}
                                                className={`group flex items-center w-full flex-shrink-0 gap-1.5 lg:gap-3 p-1 sm:p-2 lg:p-3 rounded-md lg:rounded-xl transition-all duration-300 relative overflow-hidden cursor-pointer ${isActive ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                                            >
                                                <div className="relative w-12 sm:w-20 lg:w-28 aspect-video rounded sm:rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                                    <img
                                                        src={getImageUrl(movie.thumb_url || movie.poster_url, { width: 300, quality: 75 })}
                                                        alt={ep.name}
                                                        className={`object-cover w-full h-full transition-transform duration-500 ${isActive ? 'scale-105' : 'group-hover:scale-110'}`}
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
                                            </button>
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
                                        if (artRef.current) {
                                            artRef.current.seek = 0;
                                            artRef.current.play();
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

                {/* Dual Subtitles — Custom Overlay */}
                {portalTarget && !isEmbedServer && (subtitle1Text || subtitle2Text) && createPortal(
                    <div className="art-subtitle" dir="auto" style={{ pointerEvents: 'none', display: 'block', position: 'absolute', bottom: '60px', left: 0, width: '100%', textAlign: 'center', zIndex: 30 }}>
                        {subtitle1Text && (
                            <span className="art-subtitle-track" style={{ display: 'inline-block', width: '100%', textShadow: '0 1px 2px #000, 0 1px 2px #000' }}>
                                {subtitle1Text}
                            </span>
                        )}
                        {subtitle2Text && (
                            <span className="art-subtitle-track" style={{ display: 'inline-block', width: '100%', fontSize: '0.85em', color: '#f59e0b', marginTop: subtitle1Text ? '4px' : '0', textShadow: '0 1px 2px #000, 0 1px 2px #000' }}>
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
                                <MovieInfo slug={slug} movie={movie} episode={currentEpisode} />
                                <EpisodeList
                                    slug={slug}
                                    currentEpisode={currentEpisodeSlug}
                                    episodes={processedEpisodes}
                                    activeServer={activeServerIndex}
                                    onServerChange={handleServerChange}
                                    onEpisodeClick={() => setIsChangingEpisode(true)}
                                    onEpisodeSelect={selectEpisode}
                                />
                                <div className="mt-6 pt-6 border-t border-white/5">
                                    <CommentSection movieSlug={`${slug}/${getFriendlyEpisodeSlug(currentEpisodeSlug)}`} />
                                </div>
                            </div>
                        </div>
                        <div className="w-full xl:w-100">
                            <Sidebar movie={movie} suggestedMovies={filteredSuggestions} />
                        </div>
                    </div>
                </Container>
            </div>

            <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} movieName={movie.name} episodeName={currentEpisode.name} />
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                movieName={movie.name}
                shareUrl={typeof window !== "undefined" ? `${window.location.origin}/phim/${slug}/${currentEpisodeSlug}${user ? `?ref=${user.id}` : ''}` : ''}
            />
        </div>
    );
}