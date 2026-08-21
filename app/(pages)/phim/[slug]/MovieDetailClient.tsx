"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import Container from "@/app/components/UI/Container";
import FavoriteButton from "@/app/components/UI/Common/FavoriteButton";
import WatchlistButton from "@/app/components/UI/Common/WatchlistButton";
import { MessageSquare, Play, Video, Share2, Star, Clock, Globe, Film, Sparkles, CheckCircle2, ChevronRight, User, X } from "lucide-react";
import { Movie, EpisodeServer } from "@/app/types/movie";
import {
    getImageUrl,
    getRawImageUrl,
    getEpisodeStatus,
    isMovieCompleted,
    getFriendlyEpisodeSlug,
    filterDuplicateMovies,
    getYoutubeEmbedUrl,
    generateCategorySlug
} from "@/app/utils/movieUtils";
import { getCategoryStyles } from "@/app/utils/uiUtils";
import { INTERNAL_API_URL } from "@/app/utils/apiConfig";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import { fetchActorsFromTMDB, TMDBActor } from "@/app/utils/tmdbUtils";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import { decodeHtml, cleanContent } from "@/app/utils/textUtils";
import dynamic from "next/dynamic";
import EpisodeList from "./[episodeSlug]/EpisodeList";
import { getR2ActorUrl, getR2MoviePosterUrl, getR2MovieThumbUrl } from "@/app/utils/r2ImageUrl";
import MoviePosterCard from "@/app/components/Movies/MovieCard/MoviePosterCard";
import ShareModal from "@/app/components/Movies/Movie/ShareModal";
import TrailerModal from "@/app/components/Movies/Movie/TrailerModal";

const CommentSection = dynamic(() => import("@/app/components/Social/Comments/CommentSection"), {
    loading: () => <Skeleton className="h-40" rounded="lg" />,
    ssr: false
});

interface MovieDetailClientProps {
    movie: Movie;
    episodes: EpisodeServer[];
    suggestedMovies: Movie[];
    slug: string;
    initialActors?: TMDBActor[];
}

export default function MovieDetailClient({
    movie: initialMovie,
    episodes,
    suggestedMovies,
    slug,
    initialActors
}: MovieDetailClientProps) {
    const [movie, setMovie] = useState<Movie>(initialMovie);
    const SERVER_PREF_KEY = `lofilm-server:${slug}`;
    const [activeServerIndex, setActiveServerIndex] = useState(0);
    const [suggestedMoviesState, setSuggestedMoviesState] = useState<Movie[]>(suggestedMovies);
    const filteredSuggestions = useMemo(() => filterDuplicateMovies(suggestedMoviesState), [suggestedMoviesState]);
    const [tmdbActors, setTmdbActors] = useState<TMDBActor[]>(initialActors || []);
    const [isLoadingActors, setIsLoadingActors] = useState(false);
    const [hasFetchedSuggestions, setHasFetchedSuggestions] = useState(false);
    const [hasFetchedActors, setHasFetchedActors] = useState(!!initialActors && initialActors.length > 0);
    const [showTrailerModal, setShowTrailerModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "actors" | "related">("overview");

    const handleServerChange = useCallback((index: number) => {
        setActiveServerIndex(index);
        try { sessionStorage.setItem(SERVER_PREF_KEY, String(index)); } catch { }
    }, [SERVER_PREF_KEY]);

    // Process episode servers
    const processedEpisodes = useMemo(() => {
        if (!episodes) return [];
        const list: typeof episodes = [];
        const counts: Record<string, number> = {};

        episodes.forEach(server => {
            let originalName = server.server_name.toLowerCase();
            let cleanName = "Vietsub";

            if (originalName.includes('thuyết minh') || originalName.includes(' tm') || originalName === 'tm') {
                cleanName = 'Thuyết Minh';
            } else if (originalName.includes('lồng tiếng') || originalName.includes(' lt') || originalName === 'lt') {
                cleanName = 'Lồng Tiếng';
            } else if (originalName.includes('raw') || originalName.includes('nosub')) {
                cleanName = 'Raw';
            }

            if (originalName.includes(' op')) cleanName += ' OP';
            else if (originalName.includes(' nc')) cleanName += ' NC';
            else if (originalName.includes(' vs')) cleanName += ' VS';
            else if (originalName.includes(' kk')) cleanName += ' KK';
            else {
                const sampleUrl = (server.server_data?.[0]?.link_m3u8 || server.server_data?.[0]?.link_embed || '').toLowerCase();
                if (sampleUrl.includes('ophim') || sampleUrl.includes('opstream')) cleanName += ' OP';
                else if (sampleUrl.includes('vsmov')) cleanName += ' VS';
                else if (sampleUrl.includes('nguonc')) cleanName += ' NC';
                else cleanName += ' KK';
            }

            counts[cleanName] = counts[cleanName] || 0;

            if (server.server_data.some(ep => ep.link_m3u8)) {
                counts[cleanName]++;
                list.push({
                    ...server,
                    server_name: `${cleanName} #${counts[cleanName]}`,
                    _isEmbed: false
                } as any);
            }
            if (server.server_data.some(ep => ep.link_embed)) {
                counts[cleanName]++;
                list.push({
                    ...server,
                    server_name: `${cleanName} #${counts[cleanName]}`,
                    _isEmbed: true
                } as any);
            }
        });
        return list;
    }, [episodes]);

    // Reset when slug changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        setMovie(initialMovie);
        setHasFetchedSuggestions(false);
        setIsSynopsisExpanded(false);
        if (!initialActors || initialActors.length === 0) {
            setHasFetchedActors(false);
            setTmdbActors([]);
        } else {
            setHasFetchedActors(true);
            setTmdbActors(initialActors);
        }
    }, [initialMovie.slug, initialActors]);

    // Fetch suggestions if not provided
    useEffect(() => {
        if (hasFetchedSuggestions) return;
        const fetchSuggestions = async () => {
            const firstCategory = initialMovie.category?.[0]?.slug;
            if (!firstCategory) return;

            try {
                const res = await axios.get(`/api/proxy?url=${encodeURIComponent(`${INTERNAL_API_URL}/the-loai/${firstCategory}?page=1&limit=20`)}&revalidate=60`);
                const items: Movie[] = res.data?.data?.items || res.data?.items || [];
                const filtered = items.filter((m: Movie) => m.slug !== initialMovie.slug).slice(0, 14);
                if (filtered.length > 0) {
                    setSuggestedMoviesState(filtered);
                }
                setHasFetchedSuggestions(true);
            } catch (err) {
                console.error("Failed to fetch suggestions:", err);
            }
        };

        if (suggestedMovies.length === 0) {
            fetchSuggestions();
        } else {
            setHasFetchedSuggestions(true);
        }
    }, [initialMovie.slug, initialMovie.category, suggestedMovies, hasFetchedSuggestions]);

    // Fetch Actors from TMDB
    useEffect(() => {
        if (hasFetchedActors) return;
        if (!movie.slug) return;

        const getActors = async () => {
            setIsLoadingActors(true);
            try {
                if (movie.tmdb?.id) {
                    const actors = await fetchActorsFromTMDB(
                        movie.tmdb.id,
                        (movie.tmdb.type as 'movie' | 'tv') || 'movie'
                    );
                    if (actors.length > 0) {
                        setTmdbActors(actors);
                    }
                } else {
                    const res = await fetch(`/api/proxy?url=${encodeURIComponent(`${INTERNAL_API_URL}/phim/${movie.slug}/peoples`)}`);
                    const data = await res.json();
                    if (data.success || data.status === "success") {
                        const peoples = data.data?.peoples;
                        if (peoples && Array.isArray(peoples)) {
                            const mappedActors = peoples.map((actor: any) => ({
                                id: actor.tmdb_people_id || Math.random(),
                                name: actor.name,
                                profile_path: actor.profile_path,
                                character: actor.character
                            }));
                            if (mappedActors.length > 0) {
                                setTmdbActors(mappedActors);
                            }
                        }
                    }
                }
                setHasFetchedActors(true);
            } catch (error) {
                console.error("Failed to fetch actors:", error);
            } finally {
                setIsLoadingActors(false);
            }
        };

        getActors();
    }, [movie.slug, movie.tmdb?.id, movie.tmdb?.type, hasFetchedActors]);

    // First server episodes & initial watch URL
    const firstServerEpisodes = episodes?.[0]?.server_data || [];
    const isTrailerOnly = useMemo(() => {
        return (movie.episode_current || '').toLowerCase().includes('trailer') ||
            (movie.quality || '').toLowerCase().includes('trailer');
    }, [movie.episode_current, movie.quality]);

    const watchEpisodeSlug = useMemo(() => {
        if (isTrailerOnly) return 'trailer';
        return getFriendlyEpisodeSlug(firstServerEpisodes[0]?.slug || 'tap-01');
    }, [isTrailerOnly, firstServerEpisodes]);

    const isCompleted = isMovieCompleted(movie);
    const statusText = isCompleted ? 'Đã hoàn thành' : 'Đang cập nhật';
    const rating = movie.tmdb?.vote_average ? movie.tmdb.vote_average.toFixed(1) : null;
    const categoryStyles = useMemo(() => {
        if (!movie.category || movie.category.length === 0) return [];
        return getCategoryStyles(movie.category.map(c => c.slug));
    }, [movie.category]);

    return (
        <div className="min-h-screen pb-24 bg-[#0F1115] text-white">
            {/* === 1. CINEMATIC HERO PANORAMA === */}
            <div className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[660px] xl:min-h-[700px] overflow-hidden flex items-end xl:-ml-[100px] xl:w-[calc(100%+100px)] bg-[#0F1115]">
                {/* Backdrop Image with Multi-layer Scrim */}
                <div className="absolute inset-0 z-0">
                    <SmartImage
                        r2Src={getR2MovieThumbUrl(movie.slug)}
                        src={getImageUrl(movie.thumb_url, { width: 1920, quality: 80 })}
                        rawSrc={getRawImageUrl(movie.thumb_url)}
                        fallbackSrc={movie.poster_url ? getImageUrl(movie.poster_url, { width: 1200, quality: 75 }) : undefined}
                        alt={movie.name}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-top filter brightness-95"
                    />
                    {/* Cinematic Clean Overlays (Keeping 75% of backdrop clear & bright) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/60 via-30% to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0F1115]/75 via-[#0F1115]/20 via-45% to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0F1115]/60 to-transparent z-10 pointer-events-none" />
                </div>

                {/* Hero Content Showcase */}
                <Container className="relative z-20 w-full pt-36 sm:pt-40 md:pt-32 lg:pt-36 pb-8 lg:pb-12 xl:pl-[120px]">
                    <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-center md:items-end">
                        {/* Poster Card */}
                        <div className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[200px] lg:w-[230px] aspect-[2/3] rounded-lg overflow-hidden border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8)] bg-[#12151C] relative group">
                            <SmartImage
                                r2Src={getR2MoviePosterUrl(movie.slug)}
                                src={getImageUrl(movie.poster_url || movie.thumb_url, { width: 380, quality: 85 })}
                                rawSrc={getRawImageUrl(movie.poster_url || movie.thumb_url)}
                                alt={movie.name}
                                fill
                                priority
                                sizes="(max-width: 768px) 180px, 230px"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Subtle Glass Border Highlight */}
                            <div className="absolute inset-0 border border-white/10 rounded-lg pointer-events-none" />
                        </div>

                        {/* Title & Metadata Info */}
                        <div className="flex-1 min-w-0 space-y-3 sm:space-y-4 text-center md:text-left">
                            {/* Badges System */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                {rating && (
                                    <div className="px-2.5 py-1 text-xs font-black bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-md shadow-sm flex items-center gap-1 leading-none">
                                        <span>★</span>
                                        <span>{rating}</span>
                                    </div>
                                )}
                                <div className="px-2.5 py-1 text-xs font-bold bg-[#A7F3D0] text-emerald-950 rounded-md shadow-sm leading-none">
                                    {movie.year || "2024"}
                                </div>
                                <div className="px-2.5 py-1 text-xs font-bold bg-[#F5CAE3] text-pink-950 rounded-md shadow-sm leading-none">
                                    {getEpisodeStatus(movie)}
                                </div>
                                {movie.quality && (
                                    <div className="px-2.5 py-1 text-xs font-bold bg-[#FAD078] text-amber-950 rounded-md shadow-sm leading-none">
                                        {movie.quality}
                                    </div>
                                )}
                                <div className="px-2.5 py-1 text-xs font-bold bg-[#C084FC] text-purple-950 rounded-md shadow-sm leading-none">
                                    {((movie as any).lang_tag || movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                                </div>
                            </div>

                            {/* Titles */}
                            <div className="space-y-1">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight font-montserrat tracking-tight drop-shadow-md">
                                    {decodeHtml(movie.name)}
                                </h1>
                                <p className="text-white/60 text-sm sm:text-base font-medium italic">
                                    {decodeHtml(movie.origin_name)}
                                </p>
                            </div>

                            {/* Genres */}
                            {movie.category && movie.category.length > 0 && (
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 pt-0.5">
                                    {movie.category.map((cat, idx) => {
                                        const finalSlug = generateCategorySlug(cat.slug, cat.name);
                                        return (
                                            <TransitionLink
                                                key={finalSlug || idx}
                                                href={`/the-loai/${finalSlug}`}
                                                className={`px-3 py-1 text-xs font-semibold bg-white/5 hover:bg-white/15 border border-white/10 ${categoryStyles[idx]?.text || 'text-white/80'} rounded-full transition-all`}
                                            >
                                                {cat.name}
                                            </TransitionLink>
                                        );
                                    })}
                                </div>
                            )}

                            {/* CTA Action Buttons */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                                {/* Watch Now */}
                                <TransitionLink
                                    href={`/phim/${movie.slug}/${watchEpisodeSlug}`}
                                    className="h-11 sm:h-12 px-6 sm:px-8 rounded-full bg-[#D497FF] hover:brightness-110 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,151,255,0.35)] hover:shadow-[0_0_30px_rgba(212,151,255,0.6)] transition-all duration-300 transform-gpu active:scale-95 cursor-pointer"
                                >
                                    <Play size={16} fill="currentColor" className="ml-0.5" />
                                    <span>Xem Ngay</span>
                                </TransitionLink>

                                {/* Trailer Button */}
                                {movie.trailer_url && (
                                    <button
                                        onClick={() => setShowTrailerModal(true)}
                                        className="h-11 sm:h-12 px-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                        <Video size={16} />
                                        <span>Trailer</span>
                                    </button>
                                )}
                                <div className="flex items-center gap-3">
                                    {/* Favorite Button */}
                                    <div className="h-11 sm:h-12 w-11 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-all">
                                        <FavoriteButton movie={movie} iconSize={18} />
                                    </div>

                                    {/* Watchlist Button */}
                                    <div className="h-11 sm:h-12 w-11 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-all">
                                        <WatchlistButton movie={movie} iconSize={18} />
                                    </div>

                                    {/* Share Button */}
                                    <button
                                        onClick={() => setShowShareModal(true)}
                                        className="h-11 sm:h-12 w-11 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                                        title="Chia sẻ"
                                    >
                                        <Share2 size={18} />
                                    </button>

                                    {/* Scroll to Comment */}
                                    <button
                                        onClick={() => {
                                            document.getElementById('comment-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }}
                                        className="h-11 sm:h-12 w-11 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                                        title="Bình luận"
                                    >
                                        <MessageSquare size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </div>

            {/* === 2. MAIN CONTENT BODY WITH 3 TABS === */}
            <Container className="mt-6 lg:mt-8 space-y-6 lg:space-y-8">
                {/* 2.0. TAB NAVIGATION BAR */}
                <div className="flex items-center justify-start border-b border-white/10 pb-4">
                    <div className="bg-[#12151C]/90 backdrop-blur-md border border-white/10 p-1 rounded-2xl flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar shadow-xl">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer select-none whitespace-nowrap ${activeTab === "overview"
                                ? "bg-gradient-to-r from-[#D497FF] to-[#c07bf7] text-black shadow-lg shadow-[#D497FF]/20"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Film size={16} className={activeTab === "overview" ? "text-black" : "text-[#D497FF]"} />
                            <span>Tập Phim & Nội Dung</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("actors")}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer select-none whitespace-nowrap ${activeTab === "actors"
                                ? "bg-gradient-to-r from-[#D497FF] to-[#c07bf7] text-black shadow-lg shadow-[#D497FF]/20"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <User size={16} className={activeTab === "actors" ? "text-black" : "text-[#FAD078]"} />
                            <span>Dàn Diễn Viên</span>
                            {(tmdbActors.length > 0 || (movie.actor && movie.actor.length > 0)) && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${activeTab === "actors" ? "bg-black/20 text-black" : "bg-white/10 text-white/70"
                                    }`}>
                                    {tmdbActors.length > 0 ? tmdbActors.length : movie.actor?.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab("related")}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer select-none whitespace-nowrap ${activeTab === "related"
                                ? "bg-gradient-to-r from-[#D497FF] to-[#c07bf7] text-black shadow-lg shadow-[#D497FF]/20"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Sparkles size={16} className={activeTab === "related" ? "text-black" : "text-[#D497FF]"} />
                            <span>Phim Tương Tự</span>
                            {filteredSuggestions.length > 0 && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${activeTab === "related" ? "bg-black/20 text-black" : "bg-white/10 text-white/70"
                                    }`}>
                                    {filteredSuggestions.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* 2.1. TAB CONTENT PANELS */}
                <div className="min-h-[280px]">
                    {/* TAB 1: NỘI DUNG & TẬP PHIM */}
                    {activeTab === "overview" && (
                        <div className="space-y-6 sm:space-y-8 animate-fade-in">
                            {/* BENTO METADATA & STORY SYNOPSIS (Đặt lên trước) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left 2 Cols: Synopsis Story */}
                                <div className="lg:col-span-2 bg-[#12151C]/60 border border-white/10 rounded-2xl p-5 sm:p-7 flex flex-col justify-between transition-all">
                                    <div className="space-y-3">
                                        {/* Header có toggle trên Mobile & Tablet */}
                                        <div
                                            onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                                            className="flex items-center justify-between cursor-pointer lg:cursor-default select-none"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-[#D497FF] rounded-full" />
                                                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                                                    Nội Dung Phim
                                                </h3>
                                            </div>

                                            {/* Nút bấm mở/thu gọn chỉ hiện trên Mobile & Tablet */}
                                            <div className="flex items-center gap-1 text-xs font-bold text-[#D497FF] lg:hidden">
                                                <span>{isSynopsisExpanded ? "Thu gọn" : "Xem nội dung"}</span>
                                                <ChevronRight
                                                    size={16}
                                                    className={`transform transition-transform duration-300 ${isSynopsisExpanded ? "-rotate-90" : "rotate-90"}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Nội dung phim */}
                                        <div className={`${isSynopsisExpanded ? "block animate-fade-in" : "hidden lg:block"} pt-1`}>
                                            <p className="text-white/75 text-sm sm:text-base leading-relaxed">
                                                {cleanContent(movie.content) || "Bộ phim hấp dẫn đang được phát sóng với chất lượng cao trên LoFilm..."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right 1 Col: Quick Bento Info */}
                                <div className="bg-[#12151C]/60 border border-white/10 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                        <div className="w-1.5 h-4 bg-[#A7F3D0] rounded-full" />
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                            Thông Tin Chi Tiết
                                        </h3>
                                    </div>

                                    <div className="space-y-3 text-xs sm:text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white/50 font-medium">Trạng thái:</span>
                                            <span className={`font-bold ${isCompleted ? 'text-emerald-400' : 'text-pink-400'}`}>
                                                {statusText}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-white/50 font-medium">Thời lượng:</span>
                                            <span className="text-white font-semibold">{movie.time || "Đang cập nhật"}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-white/50 font-medium">Quốc gia:</span>
                                            <div className="flex gap-1.5">
                                                {movie.country && movie.country.length > 0 ? (
                                                    movie.country.map((c) => (
                                                        <TransitionLink key={c.slug} href={`/quoc-gia/${c.slug}`} className="text-[#D497FF] font-semibold hover:underline">
                                                            {c.name}
                                                        </TransitionLink>
                                                    ))
                                                ) : (
                                                    <span className="text-white font-semibold">Đang cập nhật</span>
                                                )}
                                            </div>
                                        </div>

                                        {movie.director && movie.director.length > 0 && movie.director[0] !== "" && (
                                            <div className="flex items-start justify-between gap-2 pt-1 border-t border-white/5">
                                                <span className="text-white/50 font-medium whitespace-nowrap">Đạo diễn:</span>
                                                <span className="text-white/90 font-semibold text-right">{movie.director.join(", ")}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* EPISODE HUB */}
                            {processedEpisodes && processedEpisodes.length > 0 ? (
                                <section className="bg-[#12151C]/60 border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl">
                                    <EpisodeList
                                        slug={slug}
                                        movieName={movie.name}
                                        currentEpisode=""
                                        episodes={processedEpisodes}
                                        activeServer={activeServerIndex}
                                        onServerChange={handleServerChange}
                                        showServers={true}
                                    />
                                </section>
                            ) : (
                                <section className="bg-[#12151C]/60 border border-white/10 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
                                    <div className="max-w-md mx-auto space-y-4">
                                        <div className="w-14 h-14 bg-[#D497FF]/10 border border-[#D497FF]/20 rounded-2xl flex items-center justify-center mx-auto text-[#D497FF]">
                                            <Film size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                                                {isTrailerOnly ? "Phim Đang Ở Bản Trailer / Sắp Chiếu" : "Tập Phim Đang Cập Nhật"}
                                            </h3>
                                            <p className="text-sm text-white/50 mt-1">
                                                {isTrailerOnly
                                                    ? "Bộ phim hiện đang trong giai đoạn giới thiệu trailer. Các tập phim chính thức sẽ được cập nhật sớm nhất!"
                                                    : "Hệ thống đang đồng bộ và cập nhật các tập phim mới nhất. Bạn vui lòng quay lại sau nhé!"}
                                            </p>
                                        </div>
                                        {movie.trailer_url && (
                                            <button
                                                onClick={() => setShowTrailerModal(true)}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D497FF] hover:bg-[#D497FF]/90 text-black font-bold rounded-xl transition-all shadow-lg text-sm"
                                            >
                                                <Play size={16} className="fill-black" />
                                                Xem Trailer Ngay
                                            </button>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {/* TAB 2: DÀN DIỄN VIÊN */}
                    {activeTab === "actors" && (
                        <div className="space-y-6 animate-fade-in bg-[#12151C]/60 border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl">
                            <div className="flex items-center gap-2.5">
                                <div className="w-1.5 h-5 bg-[#FAD078] rounded-full" />
                                <h2 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-wider">
                                    Dàn Diễn Viên
                                </h2>
                            </div>

                            {isLoadingActors ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    {Array.from({ length: 8 }).map((_, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <Skeleton className="aspect-[3/4] w-full" rounded="lg" />
                                            <Skeleton className="h-3 w-3/4 mx-auto" rounded="md" />
                                        </div>
                                    ))}
                                </div>
                            ) : tmdbActors.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
                                    {tmdbActors.map((actor) => (
                                        <div key={actor.id} className="group flex flex-col items-center text-center space-y-1.5">
                                            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#12151C] border border-white/10 group-hover:border-[#D497FF]/50 transition-all duration-300 shadow-md">
                                                {actor.profile_path ? (
                                                    <SmartImage
                                                        r2Src={getR2ActorUrl(actor.id)}
                                                        src={getImageUrl(`https://image.tmdb.org/t/p/w200${actor.profile_path}`, { width: 160, quality: 75 })}
                                                        rawSrc={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                                                        alt={actor.name}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        sizes="(max-width: 768px) 30vw, 150px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                                        <User size={32} />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-white/90 group-hover:text-[#D497FF] transition-colors truncate w-full px-1">
                                                {actor.name}
                                            </span>
                                            {actor.character && (
                                                <span className="text-[10px] text-white/40 truncate w-full px-1">
                                                    {actor.character}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : movie.actor && movie.actor.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {movie.actor.map((act, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-[#12151C] border border-white/10 rounded-lg text-xs font-semibold text-white/80">
                                            {act}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-white/40 italic">Đang cập nhật danh sách diễn viên...</p>
                            )}
                        </div>
                    )}

                    {/* TAB 3: PHIM TƯƠNG TỰ */}
                    {activeTab === "related" && (
                        <div className="space-y-6 animate-fade-in bg-[#12151C]/60 border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl">
                            <div className="flex items-center gap-2.5">
                                <div className="w-1.5 h-5 bg-[#D497FF] rounded-full" />
                                <h2 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-wider">
                                    Phim Cùng Thể Loại Có Thể Bạn Thích
                                </h2>
                            </div>

                            {filteredSuggestions.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-4">
                                    {filteredSuggestions.map((sug) => (
                                        <MoviePosterCard key={sug._id} movie={sug} priority={false} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-white/40 italic">Đang cập nhật các bộ phim tương tự...</p>
                            )}
                        </div>
                    )}
                </div>

                {/* === 3. COMMUNITY COMMENTS (Bình Luận - Luôn ở dưới cùng) === */}
                <section id="comment-section" className="pt-6 border-t border-white/10">
                    <CommentSection movieSlug={movie.slug} />
                </section>
            </Container>

            {/* === TRAILER POPUP MODAL === */}
            <TrailerModal
                isOpen={showTrailerModal}
                onClose={() => setShowTrailerModal(false)}
                movieName={movie.name}
                trailerUrl={movie.trailer_url || ""}
            />

            {/* === SHARE MODAL === */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                movieName={movie.name}
                shareUrl={typeof window !== "undefined" ? window.location.href : `https://lofilm.fun/phim/${movie.slug}`}
            />
        </div>
    );
}
