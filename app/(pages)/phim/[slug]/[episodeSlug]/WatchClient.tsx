"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { ChevronRight, AlertTriangle, RefreshCcw } from "lucide-react";
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
import ReportModal from "@/app/components/Common/ReportModal";
import { getImageUrl, getFriendlyEpisodeSlug } from "@/app/utils/movieUtils";
import { createClient } from "@/app/utils/supabase/client";
import { toast } from "react-hot-toast";

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
    const userRef = useRef<any>(null); // Dùng Ref để tránh stale closure trong sự kiện video
    useEffect(() => { userRef.current = user; }, [user]);

    const [hasResumed, setHasResumed] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const supabase = createClient();

    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const plyrRef = useRef<Plyr | null>(null);

    // Tìm tập tiếp theo
    const nextEpisode = useMemo(() => {
        if (!episodes || episodes.length === 0) return null;
        const server = episodes[activeServerIndex] || episodes[0];
        const currentIndex = server.server_data.findIndex(ep => getFriendlyEpisodeSlug(ep.slug) === episodeSlug);
        if (currentIndex !== -1 && currentIndex < server.server_data.length - 1) {
            return server.server_data[currentIndex + 1];
        }
        return null;
    }, [episodes, activeServerIndex, episodeSlug]);

    // Reset lỗi và UI khi đổi server hoặc tập phim
    useEffect(() => {
        setHasError(false);
        setShowNextButton(false);
    }, [activeServerIndex, episodeSlug]);

    // Tìm link video dựa trên server đang chọn và episodeSlug
    const videoSrc = useMemo(() => {
        if (!episodes || episodes.length === 0) return episode.link_m3u8;

        const server = episodes[activeServerIndex] || episodes[0];
        const found = server.server_data.find((ep) => getFriendlyEpisodeSlug(ep.slug) === episodeSlug);

        if (found) return found.link_m3u8;

        // Fallback: Tìm ở bất kỳ server nào nếu server hiện tại không có
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

    // Hàm cập nhật chất lượng (Resolution)
    const updateQuality = (newQuality: number) => {
        if (!hlsRef.current) return;
        if (newQuality === 0) {
            hlsRef.current.currentLevel = -1; // Auto
        } else {
            // @ts-ignore
            hlsRef.current.levels.forEach((level, levelIndex) => {
                if (level.height === newQuality) {
                    hlsRef.current!.currentLevel = levelIndex;
                }
            });
        }
    };

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

    // Kiểm tra trạng thái yêu thích
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
        setIsFavorited(!isFavorited); // Cập nhật ngay lập tức (Optimistic Update)

        try {
            if (prevStatus) {
                // Xóa khỏi DB
                const { error } = await supabase.from('favorites').delete().eq('movie_slug', slug).eq('user_id', user.id);
                if (error) throw error;
                toast.success("Đã xóa khỏi danh sách yêu thích");
            } else {
                // Thêm vào DB
                const { error } = await supabase.from('favorites').insert({
                    user_id: user.id,
                    movie_slug: slug,
                    movie_name: movie.name,
                    movie_poster: movie.poster_url
                });
                if (error) throw error;
                toast.success("Đã thêm vào danh sách yêu thích");
            }
        } catch (err: any) {
            // Rollback nếu lỗi
            setIsFavorited(prevStatus);
            toast.error("Lỗi: " + err.message);
        }
    };

    // Hàm lưu tiến độ xem phim vào Supabase
    const lastSavedTime = useRef(0);
    const saveProgress = async (currentTime: number, duration: number) => {
        const currentUser = userRef.current;
        if (!currentUser || !currentTime || duration <= 0) return;

        // Chỉ lưu sau mỗi 10s để giảm tải API
        if (Math.abs(currentTime - lastSavedTime.current) < 10) return;
        lastSavedTime.current = currentTime;

        const { error } = await supabase.from('watch_history').upsert({
            user_id: currentUser.id,
            movie_slug: slug,
            movie_name: movie.name,
            movie_poster: movie.poster_url || movie.thumb_url,
            episode_name: episode.name,
            episode_slug: episodeSlug,
            watched_seconds: Math.floor(currentTime),
            duration: Math.floor(duration),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,movie_slug,episode_slug' });

        if (error) console.error("Lỗi khi lưu lịch sử xem:", error.message);
    };

    useEffect(() => {
        let isMounted = true;
        const video = videoRef.current;
        if (!video) return;

        // Cấu hình Plyr cơ bản
        const defaultOptions: Plyr.Options = {
            captions: { active: true, update: true, language: 'vi' },
            controls: [
                'play-large',
                'progress',
                'play',
                'rewind',
                'fast-forward',
                'current-time',
                'duration',
                'mute',
                'volume',
                'captions',
                'pip',
                'airplay',
                'fullscreen'
            ],
            i18n: {
                restart: '',
                rewind: '',
                play: '',
                pause: '',
                forward: '',
                fastForward: '',
                mute: '',
                unmute: '',
                settings: '',
                enterFullscreen: '',
                exitFullscreen: '',
            },
            displayDuration: true,
            fullscreen: { enabled: true, fallback: true, iosNative: true },
            storage: { enabled: false }, // Vô hiệu hóa storage mặc định của Plyr để dùng database của LoFilm
            tooltips: { controls: false, seek: true },
            seekTime: 10
        };

        // Đợi 1 nhịp cực ngắn để DOM ổn định
        const initTimeout = setTimeout(async () => {
            if (!isMounted || !videoRef.current) return;

            let startFrom = 0;
            // Lấy thông tin user và lịch sử xem đồng thời
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

            if (startFrom > 0 && !hasResumed) {
                const doResume = () => {
                    if (player && player.currentTime < startFrom - 5) {
                        player.currentTime = startFrom;
                        toast.success(`Đã khôi phục vị trí xem cũ: ${Math.floor(startFrom / 60)} phút`, {
                            icon: '🕒',
                            duration: 2500
                        });
                    }
                };

                player.once('ready', doResume);
                setHasResumed(true);
            }

            // Lắng nghe sự kiện kết thúc và thời gian để hiện nút chuyển tập
            player.on('timeupdate', () => {
                const currentTime = player.currentTime;
                const duration = player.duration;

                // Lưu lịch sử xem
                saveProgress(currentTime, duration);

                const remaining = duration - currentTime;
                // Hiện nút khi còn 60s (1 phút) hoặc phim đã gần hết
                if (remaining <= 60 && player.duration > 0 && nextEpisode) {
                    setShowNextButton(true);
                } else if (remaining > 60) {
                    setShowNextButton(false);
                }
            });

            player.on('play', () => {
            });

            player.on('seeking', () => {
            });

            player.on('ended', () => {
                const currentAutoNext = localStorage.getItem('lofilm-auto-next') !== 'false';
                if (currentAutoNext && nextEpisode) {
                    window.location.href = `/phim/${slug}/${getFriendlyEpisodeSlug(nextEpisode.slug)}`;
                } else {
                    setShowNextButton(false);
                }
            });

            if (Hls.isSupported() && videoSrc.endsWith('.m3u8')) {
                const hls = new Hls({
                    capLevelToPlayerSize: true,
                    autoStartLoad: true,
                    startLevel: -1,
                    startPosition: startFrom > 0 ? startFrom : -1, // NHẢY NGAY LẬP TỨC TỪ ĐẦU
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
    }, [videoSrc, nextEpisode, slug]);

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


                    {/* Nút Tập Tiếp Theo Overlay */}
                    <AnimatePresence>
                        {showNextButton && nextEpisode && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute bottom-12 md:bottom-16 lg:bottom-24 right-4 md:right-6 z-40"
                            >
                                <TransitionLink
                                    href={`/phim/${slug}/${getFriendlyEpisodeSlug(nextEpisode.slug)}`}
                                    transition={false}
                                    className="flex items-center gap-1.5 md:gap-2 bg-black/80 border border-white/20 py-1.5 px-3 md:py-2 md:px-5 lg:py-2.5 lg:px-6 rounded-md hover:bg-amber-500 hover:text-[#0a1628] hover:border-amber-500 transition-all duration-300 text-white font-bold text-[10px] md:text-xs uppercase tracking-wider shadow-2xl"
                                >
                                    Tập tiếp theo
                                    <ChevronRight size={16} />
                                </TransitionLink>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Lỗi luồng phát Overlay */}
                    <AnimatePresence>
                        {hasError && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-6 text-center"
                            >
                                <div className="flex flex-col items-center max-w-[280px] sm:max-w-sm">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 md:mb-6">
                                        <AlertTriangle size={24} className="text-red-500 md:w-8 md:h-8" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 font-montserrat uppercase tracking-wider">Link phim bị lỗi (404)</h3>
                                    <p className="text-white/60 text-[11px] md:text-sm mb-6 md:mb-8 leading-relaxed">
                                        Máy chủ hiện không phản hồi luồng phát này. Vui lòng **thử đổi sang Server khác** bên dưới hoặc **tắt VPN** nếu có.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] md:text-xs font-bold text-white transition-all cursor-pointer"
                                        >
                                            <RefreshCcw size={14} /> Tải lại trang
                                        </button>
                                        <button
                                            onClick={() => {
                                                const el = document.querySelector('.wc-main');
                                                el?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="flex items-center justify-center px-6 py-2.5 bg-amber-500 hover:bg-amber-400 rounded-xl text-[10px] md:text-xs font-bold text-[#0a1628] transition-all cursor-pointer"
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
                        isAutoNext={isAutoNext}
                        onToggleAutoNext={toggleAutoNext}
                        isFavorited={isFavorited}
                        onToggleFavorite={toggleFavorite}
                        episodes={episodes}
                        activeServer={activeServerIndex}
                        onServerChange={setActiveServerIndex}
                        onReport={() => setShowReportModal(true)}
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

            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                movieName={movie.name}
                episodeName={episode.name}
            />
        </div>
    );
}
