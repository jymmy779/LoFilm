"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

import axios from "axios";
import Image from "next/image";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import Container from "@/app/components/Container";
import MoviePosterCard from "@/app/components/MovieCard/MoviePosterCard";
import FavoriteButton from "@/app/components/Common/FavoriteButton";
import WatchlistButton from "@/app/components/Common/WatchlistButton";
import { MessageSquare } from "lucide-react";
import { Movie, EpisodeServer } from "@/app/types/movie";
import {
    getImageUrl,
    getRawImageUrl,
    getEpisodeStatus,
    isMovieCompleted,
    getFriendlyEpisodeSlug,
    filterDuplicateMovies,
    parseEpNumber,
    getYoutubeEmbedUrl
} from "@/app/utils/movieUtils";
import SmartImage from "@/app/components/Common/SmartImage";
import { fetchTotalEpisodesFromTMDB } from "@/app/utils/tmdbUtils";
import Skeleton from "@/app/components/Skeleton/Skeleton";
import { decodeHtml, cleanContent } from "@/app/utils/textUtils";
import dynamic from "next/dynamic";
import { TMDBActor } from "@/app/utils/tmdbUtils";
import { globalCache } from "@/app/utils/globalCache";
import EpisodeList from "./[episodeSlug]/EpisodeList";
import LazyRow from "@/app/components/Common/LazyRow";
import { getR2ActorUrl, getR2MoviePosterUrl, getR2MovieThumbUrl } from "@/app/utils/r2ImageUrl";
const CommentSection = dynamic(() => import("@/app/components/Comments/CommentSection"), {
    loading: () => <Skeleton className="h-40" rounded="2xl" />,
    ssr: false
});

interface MovieDetailClientProps {
    movie: Movie;
    episodes: EpisodeServer[];
    suggestedMovies: Movie[];
}

export default function MovieDetailClient({ movie: initialMovie, episodes, suggestedMovies }: MovieDetailClientProps) {
    const [movie, setMovie] = useState<Movie>(initialMovie);
    const [activeTab, setActiveTab] = useState('Tập phim');
    const [activeServerIndex, setActiveServerIndex] = useState(0);
    const [isChangingEpisode, setIsChangingEpisode] = useState(false);
    const handleEpisodeClick = useCallback(() => setIsChangingEpisode(true), []);
    const [suggestedMoviesState, setSuggestedMoviesState] = useState<Movie[]>(suggestedMovies);
    const filteredSuggestions = useMemo(() => filterDuplicateMovies(suggestedMoviesState), [suggestedMoviesState]);
    const [weeklyMovies, setWeeklyMovies] = useState<Movie[]>(() => globalCache.getRaw<Movie[]>("top_weekly_detail") || []);
    const [isLoadingWeekly, setIsLoadingWeekly] = useState(!globalCache.has("top_weekly_detail"));
    const [tmdbActors, setTmdbActors] = useState<TMDBActor[]>([]);
    const [isLoadingActors, setIsLoadingActors] = useState(false);
    const [isThumbLoaded, setIsThumbLoaded] = useState(false);
    const [hasFetchedSuggestions, setHasFetchedSuggestions] = useState(false);
    const [hasFetchedActors, setHasFetchedActors] = useState(false);

    // Đảm bảo luôn cuộn lên đầu khi vào chi tiết phim
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        setMovie(initialMovie); // Reset when prop changes
        setIsThumbLoaded(false); // Reset loading state when movie changes
        setHasFetchedSuggestions(false);
        setHasFetchedActors(false);
    }, [initialMovie.slug]);

    // Client-side fetch suggested movies (Lazy loaded when tab becomes active)
    useEffect(() => {
        if (activeTab !== 'Đề xuất' || hasFetchedSuggestions) return;

        const fetchSuggestions = async () => {
            const firstCategory = initialMovie.category?.[0]?.slug;
            if (!firstCategory) return;

            try {
                const res = await axios.get(`/api/proxy?url=${encodeURIComponent(`https://phimapi.com/v1/api/the-loai/${firstCategory}?page=1&limit=20`)}&revalidate=60`);
                const items: Movie[] = res.data?.data?.items || [];
                const filtered = items.filter((m: Movie) => m.slug !== initialMovie.slug).slice(0, 18);
                if (filtered.length > 0) {
                    setSuggestedMoviesState(filtered);
                }
                setHasFetchedSuggestions(true);
            } catch (err) {
                console.error("Failed to fetch suggestions:", err);
            }
        };

        // Chỉ fetch nếu server không truyền sẵn
        if (suggestedMovies.length === 0) {
            fetchSuggestions();
        } else {
            setHasFetchedSuggestions(true);
        }
    }, [activeTab, initialMovie.slug, initialMovie.category, suggestedMovies, hasFetchedSuggestions]);

    const CHUNK_SIZE = 100;


    // Effect to correct the MAIN movie metadata if inaccurate
    useEffect(() => {
        const correctMainMovie = () => {
            const episodesList = episodes?.[0]?.server_data || [];
            const realEpisodesCount = episodesList.length;

            // Lấy số từ episode_total (ví dụ "169" từ "Tập 169" hoặc "169")
            // episode_total có thể là number (sau update API kkphim), dùng String() để an toàn
            const totNum = parseInt(String(movie.episode_total ?? "").match(/\d+/)?.[0] || "0");

            // Nếu số tập thực tế có sẵn lớn hơn episode_total hiển thị, 
            // hoặc episode_total không phải là số hợp lệ
            if (realEpisodesCount > 0 && (realEpisodesCount > totNum || !totNum)) {
                setMovie(prev => ({
                    ...prev,
                    episode_total: realEpisodesCount.toString()
                }));
            }
        };
        correctMainMovie();
    }, [movie.slug, episodes, movie.episode_total]);

    // Effect to fetch Weekly Top movies (Deferred & Desktop-only to limit requests on mobile/mount)
    useEffect(() => {
        const fetchTopWeekly = async () => {
            try {
                // Sử dụng API phim bộ đồng nhất với Sidebar
                const res = await axios.get(`/api/proxy?url=${encodeURIComponent('https://phimapi.com/v1/api/danh-sach/phim-bo?limit=40')}`);
                let items = res.data?.data?.items || res.data?.items || [];

                if (items.length > 0) {
                    // 1. Lọc trùng (mỗi phim chỉ hiện 1 phần) và chuẩn hóa dữ liệu
                    const seenNames = new Set();
                    let processed = items
                        .map((m: any) => ({
                            ...m,
                            rating: m.tmdb?.vote_average || 0
                        }))
                        .filter((m: any) => {
                            const name = m.name?.split(' (')[0]?.split(' - ')[0]?.trim() || m.name;
                            if (seenNames.has(name)) return false;
                            seenNames.add(name);
                            return true;
                        });

                    // 2. Sắp xếp theo đánh giá (TMDB Rating) - Đồng bộ với Top phim bộ ở Sidebar
                    processed.sort((a: any, b: any) => b.rating - a.rating);

                    // 3. Lấy 10 phim đứng đầu cho trang chi tiết
                    const finalItems = processed.slice(0, 10);
                    setWeeklyMovies(finalItems);
                    globalCache.set("top_weekly_detail", finalItems);
                }
            } catch (err) {
                console.error("Error fetching top weekly (synced with sidebar):", err);
            } finally {
                setIsLoadingWeekly(false);
            }
        };

        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1280;
        if (!isDesktop) {
            setIsLoadingWeekly(false);
            return;
        }

        // Defer sidebar request by 1.5 seconds to prioritize main content loading
        const timer = setTimeout(() => {
            if (!globalCache.get("top_weekly_detail")) {
                fetchTopWeekly();
            } else {
                setIsLoadingWeekly(false);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    // Effect to fetch Actors images (Lazy loaded when tab becomes active)
    useEffect(() => {
        if (activeTab !== 'Diễn viên' || hasFetchedActors) return;
        if (!movie.slug) return;

        const getActors = async () => {
            setIsLoadingActors(true);
            try {
                const res = await fetch(`https://phimapi.com/v1/api/phim/${movie.slug}/peoples`);
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
                setHasFetchedActors(true);
            } catch (error) {
                console.error("Failed to fetch actors images from PhimAPI:", error);
            } finally {
                setIsLoadingActors(false);
            }
        };

        getActors();
    }, [activeTab, movie.slug, hasFetchedActors]);

    // Build tabs dynamically based on available data
    const tabs = useMemo(() => {
        const t = ['Tập phim', 'Tổng quan'];
        if (movie.trailer_url) t.push('Trailer');
        if (movie.actor && movie.actor.length > 0) t.push('Diễn viên');
        // Luôn hiện tab Đề xuất — data sẽ load client-side
        t.push('Đề xuất');
        return t;
    }, [movie.trailer_url, movie.actor]);

    // Get first server episodes
    const firstServerEpisodes = episodes?.[0]?.server_data || [];

    const isTrailerOnly = useMemo(() => {
        return (movie.episode_current || '').toLowerCase().includes('trailer') ||
            (movie.quality || '').toLowerCase().includes('trailer');
    }, [movie.episode_current, movie.quality]);

    const watchEpisodeSlug = useMemo(() => {
        if (isTrailerOnly) return 'trailer';
        return getFriendlyEpisodeSlug(firstServerEpisodes[0]?.slug || 'tap-01');
    }, [isTrailerOnly, firstServerEpisodes]);

    // Status text
    // Status logic: Check both API status and common sense (episode count)
    const isCompleted = isMovieCompleted(movie);
    const statusText = isCompleted ? 'Hoàn thành' : 'Đang cập nhật';

    // TMDB rating
    const rating = movie.tmdb?.vote_average ? movie.tmdb.vote_average.toFixed(1) : null;

    return (
        <main className="min-h-screen pb-20 animate-fade-in">
            {/* Background Cover */}
            <div className="relative w-full h-[40vh] md:h-[50vh] xl:h-[80vh] overflow-hidden transform-gpu xl:-ml-[100px] xl:w-[calc(100%+100px)]">
                <div className="absolute inset-0 scale-105 will-change-transform">
                    {/* Instant blurred placeholder - priority must be TRUE for 0s loading */}
                    <SmartImage
                        r2Src={getR2MoviePosterUrl(movie.slug)}
                        className="absolute blur-2xl inset-0 w-full h-full object-cover object-top"
                        src={getImageUrl(movie.poster_url, { width: 300, quality: 80 })}
                        rawSrc={getRawImageUrl(movie.poster_url)}
                        alt={movie.name}
                        fill
                        sizes="(max-width: 768px) 120px, 160px"
                    />

                    {/* Main Background Thumb - Sharp image that fades in on top */}
                    <SmartImage
                        r2Src={getR2MovieThumbUrl(movie.slug)}
                        src={getImageUrl(movie.thumb_url, { width: 1200, quality: 75 })}
                        rawSrc={getRawImageUrl(movie.thumb_url)}
                        alt=""
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-top transform-gpu"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.35)_0.8px,transparent_0.8px)] [background-size:3px_3px] opacity-30 z-10 pointer-events-none" />
                </div>
                {/* Balanced Spotlight: Soft natural darkness on sides, bright center */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,#0F1115_100%)] z-10 opacity-85" />
                <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#0F1115] via-[#0F1115]/20 to-transparent z-10" />
                <div className="absolute inset-x-0 top-0 h-[15%] bg-gradient-to-b from-[#0F1115]/40 to-transparent z-10" />
            </div>

            {/* Main Content Container */}
            <Container className="lg:-mt-32 -mt-45 p-[20px] lg:-mt-48 relative z-30">
                <div className="flex flex-col xl:flex-row gap-6 md:gap-8">

                    {/* DC SIDE - Movie Info Column */}
                    <div className="dc-side w-full xl:w-[440px] shrink-0">
                        <div className="ds-info p-[20px] lg:p-[40px] bg-[#0F1115]/50 border border-white/5 rounded-3xl relative transform-gpu will-change-[filter]">

                            <div className="v-thumb-l xl:block flex justify-center mb-6">
                                <div className="v-thumbnail relative w-[120px] h-[180px] lg:w-[160px] lg:h-[240px] rounded-2xl overflow-hidden transform-gpu">
                                    <SmartImage
                                        r2Src={getR2MoviePosterUrl(movie.slug)}
                                        className="absolute inset-0 w-full h-full object-cover object-top"
                                        src={getImageUrl(movie.poster_url, { width: 300, quality: 80 })}
                                        rawSrc={getRawImageUrl(movie.poster_url)}
                                        alt={movie.name}
                                        fill
                                        sizes="(max-width: 768px) 120px, 160px"
                                    />
                                </div>
                            </div>

                            <h2 className="text-xl line-clamp-1 md:text-2xl text-center xl:text-left font-bold text-white mb-1 leading-tight font-montserrat">
                                {decodeHtml(movie.name)}
                            </h2>
                            <div className="text-sm text-white/40 line-clamp-1 text-center xl:text-left mb-5 font-medium">
                                {decodeHtml(movie.origin_name)}
                            </div>

                            <div className="detail-more xl:block hidden space-y-5">
                                <div className="hl-tags flex flex-wrap gap-2">
                                    {rating && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#f5c518]/10 rounded-md text-[#f5c518] font-bold text-[10px]">
                                            <span className="text-[9px]">★</span>
                                            <span>{rating}</span>
                                        </div>
                                    )}
                                    <div className="px-2 py-1 bg-white/5 rounded-md text-white/60 text-[11px] font-medium">{movie.year}</div>
                                    <div className="px-2 py-1 bg-white/5 rounded-md text-white/60 text-[11px] font-medium">{getEpisodeStatus(movie)}</div>
                                </div>

                                {movie.category && movie.category.length > 0 && (
                                    <div className="hl-tags flex flex-wrap gap-2">
                                        {movie.category.map((cat) => (
                                            <TransitionLink key={cat.slug} href={`/the-loai/${cat.slug}`} className="px-3 py-1 bg-white/5 text-white/50 rounded-full text-xs font-medium hover:bg-white/10 hover:text-white transition-all">
                                                {cat.name}
                                            </TransitionLink>
                                        ))}
                                    </div>
                                )}

                                <div className={`status-box p-3 ${isCompleted ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'} border rounded-xl flex items-center gap-3`}>
                                    {isCompleted && (
                                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="18" width="18"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path></svg>
                                    )}
                                    <span className="text-xs font-bold leading-none">
                                        {statusText}: {getEpisodeStatus(movie)} / {movie.episode_total || '??'} Tập
                                    </span>
                                </div>

                                {movie.content && (
                                    <div className="detail-line">
                                        <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Giới thiệu:</div>
                                        <p className="text-[13px] text-white/70 leading-relaxed line-clamp-4">
                                            {cleanContent(movie.content)}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3 pt-2">
                                    {movie.time && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-white/40 font-medium font-bold uppercase tracking-wider">Thời lượng:</span>
                                            <span className="text-white font-medium">{movie.time}</span>
                                        </div>
                                    )}
                                    {movie.country && movie.country.length > 0 && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-white/40 font-medium font-bold uppercase tracking-wider">Quốc gia:</span>
                                            <div className="flex gap-2">
                                                {movie.country.map((c) => (
                                                    <TransitionLink key={c.slug} href={`/quoc-gia/${c.slug}`} className="text-blue-400 font-medium hover:underline">
                                                        {c.name}
                                                    </TransitionLink>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {movie.director && movie.director.length > 0 && movie.director[0] !== '' && (
                                    <div className="detail-line pt-2">
                                        <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">Đạo diễn:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {movie.director.map((d, idx) => (
                                                <span key={idx} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-white/50 transition-all">{d}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top phim tuần này - Added as requested */}
                        {!isLoadingWeekly && weeklyMovies.length > 0 && (
                            <div className="hidden xl:block child-box child-top mt-6 bg-[#0F1115]/50 border border-white/5 rounded-3xl overflow-hidden relative transform-gpu">
                                <div className="child-header flex items-center gap-3 px-6 py-5 border-b border-white/5 bg-white/5">
                                    <div className="inc-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 25" fill="none">
                                            <g clipPath="url(#clip0_137_1522)">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M1.88063 16.9893C1.85433 14.5926 3.02764 11.8941 5.01236 10.0083C6.37475 8.71478 9.24978 6.77138 13.4408 7.83575L12.9199 8.87882C12.8072 9.09921 12.5893 9.25197 12.3376 9.28829L8.75391 9.81296C8.44337 9.84426 8.15161 9.98951 7.93247 10.2199C7.67577 10.4879 7.53929 10.8385 7.54805 11.2092C7.55682 11.5761 7.70708 11.9154 7.97004 12.1646L10.5758 14.6715C10.7536 14.838 10.835 15.0847 10.7937 15.3289L10.7499 15.5793C8.00009 14.1844 4.54279 15.2888 1.88063 16.9893ZM23.5748 12.1671C23.799 11.9555 23.9455 11.6675 23.988 11.3532C24.0356 10.9863 23.938 10.6244 23.7151 10.3351C23.4909 10.0459 23.1666 9.86054 22.8047 9.81421L19.2097 9.28829C18.958 9.25197 18.7401 9.09921 18.6299 8.88133L17.0221 5.66319L17.0208 5.66069C16.8869 5.39773 16.6777 5.19112 16.4198 5.06214C16.0867 4.88934 15.7085 4.85678 15.3517 4.96823C14.9935 5.07967 14.7018 5.32635 14.5277 5.66319L14.2986 6.12275C10.4356 5.00955 6.58762 5.92114 3.71885 8.64591C0.810006 11.4095 -0.591196 15.5255 0.233998 18.8876C0.310382 19.1982 0.539533 19.4473 0.841311 19.5513C0.941486 19.5863 1.04417 19.6026 1.14685 19.6026C1.35471 19.6026 1.56132 19.5325 1.72912 19.3998C3.68629 17.8521 7.69831 15.7096 10.3216 17.4977C10.3492 17.5165 10.3805 17.519 10.4093 17.5352L10.1776 18.8601C10.1275 19.1493 10.1776 19.4599 10.3216 19.7366C10.6797 20.4128 11.5225 20.672 12.2012 20.3189L15.4143 18.6547C15.6384 18.537 15.9101 18.5357 16.1343 18.6535L19.3562 20.3226C19.5703 20.4266 19.7919 20.4792 20.0098 20.4792C20.0812 20.4792 20.1513 20.4729 20.2202 20.4616C20.9778 20.3326 21.4949 19.6164 21.371 18.8601L20.7574 15.3289C20.7148 15.0835 20.795 14.838 20.9765 14.669L23.5748 12.1671Z" fill="currentColor"></path>
                                            </g>
                                            <defs>
                                                <clipPath id="clip0_137_1522">
                                                    <rect width="24" height="24" fill="white" transform="translate(0 0.5)"></rect>
                                                </clipPath>
                                            </defs>
                                        </svg>
                                    </div>
                                    <span className="text-[14px] font-bold uppercase tracking-wider text-white/90">Top phim tuần này</span>
                                </div>
                                <div className="child-content p-5">
                                    <div className="cc-top space-y-5">
                                        {weeklyMovies.map((m, index) => (
                                            <div key={m._id} className="item flex items-center gap-2 group border-b border-white/5 pb-4 last:border-0">
                                                <div className="position-outline flex-shrink-0 w-[45px] text-left leading-none select-none transition-transform duration-500 group-hover:scale-110"
                                                    style={{
                                                        fontSize: '2.5em',
                                                        fontWeight: 900,
                                                        color: '#13213a',
                                                        textShadow: '-1px 0 #fff, 0 1px #fff, 1px 0 #fff, 0 -1px #fff',
                                                        fontFamily: 'var(--font-montserrat), sans-serif',
                                                        opacity: index < 3 ? 1 : 0.5
                                                    }}>
                                                    {index + 1}
                                                </div>
                                                <div className="h-item flex flex-1 gap-4 overflow-hidden">
                                                    <TransitionLink href={`/phim/${m.slug}`} className="v-thumb-m relative w-[52px] h-[72px] shrink-0 rounded-xl overflow-hidden bg-white/5">
                                                        <SmartImage
                                                            src={getImageUrl(m.poster_url || m.thumb_url || "", { width: 120, quality: 70 })}
                                                            rawSrc={getRawImageUrl(m.poster_url || m.thumb_url || "")}
                                                            alt={m.name}
                                                            fill
                                                            sizes="52px"
                                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                                    </TransitionLink>
                                                    <div className="info flex-1 min-w-0 flex flex-col justify-center">
                                                        <h4 className="item-title truncate text-[14px] font-bold text-white group-hover:text-amber-400 transition-colors mb-0.5">
                                                            <TransitionLink href={`/phim/${m.slug}`} title={m.name}>{decodeHtml(m.name)}</TransitionLink>
                                                        </h4>
                                                        <div className="alias-title text-[11px] text-white/40 font-medium italic truncate mb-2">{decodeHtml(m.origin_name)}</div>
                                                        <div className="info-line flex gap-2">
                                                            <div className="tag-small px-1.5 py-0.5 bg-white/5 rounded text-[9.5px] font-bold text-white/30">{m.year}</div>
                                                            <div className="tag-small px-1.5 py-0.5 bg-amber-500/10 rounded text-amber-400 text-[9.5px] font-bold tracking-tighter">
                                                                {(() => {
                                                                    const cur = m.episode_current || "";
                                                                    const slashMatch = cur.match(/(\d+\/\d+)/);
                                                                    if (slashMatch) return `HT (${slashMatch[1]})`;
                                                                    if (cur.toLowerCase().includes('hoàn tất') || cur.toLowerCase().includes('full')) {
                                                                        const numMatch = cur.match(/\d+/);
                                                                        return numMatch ? `HT (${numMatch[0]}/${numMatch[0]})` : "HT (Full)";
                                                                    }
                                                                    const numOnly = cur.match(/\d+/);
                                                                    return numOnly ? `Tập ${numOnly[0]}` : (m.quality || "HD");
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Tabs Content */}
                    <div className="dc-side w-full flex-1 shrink-0">
                        <div className="ds-info p-[20px] lg:p-[40px] bg-[#0F1115]/50 border border-white/5 rounded-3xl relative transform-gpu will-change-[filter]">
                            {/* DM Bar: Watch Now & Rating */}
                            <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                                <div className="flex flex-wrap items-center gap-3">
                                    <TransitionLink
                                        href={`/phim/${movie.slug}/${watchEpisodeSlug}`}
                                        className="group flex items-center gap-3 bg-gradient-to-r from-[#f5a623] to-[#ffcc33] hover:from-[#ffcc33] hover:to-[#f5a623] text-[#0F1115] py-2 px-6 md:py-4 md:px-8 rounded-full font-bold transition-all transform cursor-pointer shadow-[0_0_20px_rgba(245,166,35,0.4)] hover:shadow-[0_0_30px_rgba(245,166,35,0.6)]"
                                    >
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                            <i className="fa-solid fa-play text-sm ml-0.5"></i>
                                        </div>
                                        <span className="tracking-wider text-lg">Xem Ngay</span>
                                    </TransitionLink>

                                    <div className="flex items-center gap-3">
                                        <FavoriteButton
                                            movie={movie}
                                            className="cursor-pointer transition-all duration-300 flex items-center justify-center w-10 h-10 md:w-[50px] md:h-[50px] rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-lg"
                                            iconSize={18}
                                        />

                                        <WatchlistButton
                                            movie={movie}
                                            className="cursor-pointer transition-all duration-300 flex items-center justify-center w-10 h-10 md:w-[50px] md:h-[50px] rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-lg"
                                            iconSize={18}
                                        />

                                        <button
                                            onClick={() => {
                                                document.getElementById('comment-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }}
                                            className="w-10 h-10 md:w-[50px] md:h-[50px] rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white border border-white/10 transition-colors cursor-pointer group"
                                            title="Bình luận"
                                        >
                                            <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 md:gap-4 bg-white/5 md:px-4 md:py-2 px-2 py-1 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-1 md:gap-2">
                                        <i className="text-yellow-500 text-xl">★</i>
                                        <span className="text-sm font-black text-white tracking-tighter">
                                            {rating || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="h-8 w-px bg-white/10"></div>
                                    <span className="text-gray-400 text-xs tracking-widest">Đánh giá</span>
                                </div>
                            </div>

                            <div className="flex overflow-none items-center flex-wrap gap-4 lg:gap-8 xl:gap-12 border-b border-white/5 mb-8 pb-2 md:pb-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-2 md:pb-4 text-xs font-bold cursor-pointer uppercase tracking-[0.2em] transition-all relative shrink-0 ${activeTab === tab ? 'text-[#f5a623]' : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f5a623] rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="tab-content">
                                {/* Episodes Tab */}
                                {activeTab === 'Tập phim' && (
                                    <EpisodeList
                                        slug={movie.slug}
                                        currentEpisode=""
                                        episodes={episodes}
                                        activeServer={activeServerIndex}
                                        onServerChange={setActiveServerIndex}
                                        onEpisodeClick={handleEpisodeClick}
                                        showServers={episodes.length > 1}
                                    />
                                )}

                                {/* Overview Tab */}
                                {activeTab === 'Tổng quan' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                            {([
                                                { label: 'Trạng thái', value: statusText, color: isCompleted ? 'text-green-400' : 'text-yellow-400' },
                                                { label: 'Số tập', value: `${getEpisodeStatus(movie)} / ${movie.episode_total || '??'} Tập` },
                                                { label: 'Thời lượng', value: movie.time || 'N/A' },
                                                { label: 'Chất lượng', value: `${movie.quality || 'HD'} - ${movie.lang || 'Vietsub'}` },
                                                { label: 'Năm', value: String(movie.year) },
                                                { label: 'Quốc gia', value: movie.country?.map(c => c.name).join(', ') || 'N/A' },
                                                { label: 'Thể loại', value: movie.category?.map(c => c.name).join(', ') || 'N/A' },
                                                { label: 'Đạo diễn', value: movie.director?.filter(d => d !== '').join(', ') || 'N/A' }
                                            ] as any[]).map((item, idx) => (
                                                <div key={idx} className="flex items-start justify-between border-b border-white/5 pb-3 gap-4">
                                                    <span className="text-gray-500 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap shrink-0 pt-0.5">{item.label}</span>
                                                    {item.isTag ? (
                                                        <span className="px-2 py-0.5 bg-white/10 rounded text-[11px] text-white/80 text-right">{item.value}</span>
                                                    ) : item.isLink ? (
                                                        <span className="text-[#f5a623] text-sm font-medium hover:underline cursor-pointer text-right">{item.value}</span>
                                                    ) : (
                                                        <span className={`text-sm font-medium ${item.color || 'text-white/80'} text-right`}>{item.value}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {movie.content && (
                                            <div className="pt-4 mt-6 border-t border-white/5">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-1 h-4 bg-[#f5a623] rounded-full"></div>
                                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Nội dung phim</h3>
                                                </div>
                                                <p className="text-gray-400 leading-8 text-[15px] font-light">
                                                    {cleanContent(movie.content)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Trailer Tab */}
                                {activeTab === 'Trailer' && movie.trailer_url && (
                                    <div className="relative aspect-video rounded-3xl overflow-hidden">
                                        <iframe
                                            src={getYoutubeEmbedUrl(movie.trailer_url)}
                                            className="absolute inset-0 w-full h-full"
                                            allowFullScreen
                                            allow="autoplay; encrypted-media"
                                        />
                                    </div>
                                )}

                                {/* Actors Tab */}
                                {activeTab === 'Diễn viên' && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 lg:gap-5">
                                        {tmdbActors.length > 0 ? (
                                            tmdbActors.map((actor) => (
                                                <div key={actor.id} className="group w-full cursor-pointer">
                                                    <div className="aspect-[3/4] bg-white/5 rounded-2xl mb-3 flex items-center justify-center group-hover:border-[#f5a623]/30 transition-all overflow-hidden relative">
                                                        {actor.profile_path ? (
                                                            <SmartImage
                                                                r2Src={getR2ActorUrl(actor.id)}
                                                                src={getImageUrl(`https://image.tmdb.org/t/p/w200${actor.profile_path}`, { width: 160, quality: 75 })}
                                                                rawSrc={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                                                                alt={actor.name}
                                                                fill
                                                                className="object-cover transition-transform duration-500"
                                                                sizes="(max-width: 160px) 100px, 150px"
                                                            />
                                                        ) : (
                                                            <i className="fa-solid fa-user text-3xl text-white/10 group-hover:text-[#f5a623]/30 transition-colors"></i>
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs font-bold text-gray-200 group-hover:text-[#f5a623] transition-colors truncate px-1">
                                                            {actor.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : movie.actor && movie.actor.length > 0 ? (
                                            // Fallback to name-only if TMDB fails or loading
                                            movie.actor.map((actor, idx) => (
                                                <div key={idx} className="group cursor-pointer">
                                                    <div className="aspect-[3/4] bg-white/5 rounded-2xl mb-3 flex items-center justify-center border border-white/5 group-hover:border-[#f5a623]/30 transition-all overflow-hidden relative">
                                                        <i className="fa-solid fa-user text-3xl text-white/10 group-hover:text-[#f5a623]/30 transition-colors"></i>
                                                        {isLoadingActors && (
                                                            <Skeleton className="absolute inset-0" rounded="none" />
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors truncate px-1">
                                                            {actor}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-10 text-center text-gray-500">
                                                Chưa cập nhật thông tin diễn viên.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Suggestions Tab */}
                                {activeTab === 'Đề xuất' && (
                                    filteredSuggestions.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-x-2 gap-y-8 md:gap-x-3 md:gap-y-10">
                                            {filteredSuggestions.map((m) => (
                                                <div key={m._id} className="transform hover:scale-[1.02] transition-transform">
                                                    <MoviePosterCard movie={m} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-x-2 gap-y-8 md:gap-x-3 md:gap-y-10">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="space-y-3">
                                                    <Skeleton className="aspect-[2/3]" rounded="2xl" />
                                                    <Skeleton className="h-4 w-3/4 mx-auto" />
                                                    <Skeleton className="h-3 w-1/2 mx-auto opacity-50" />
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Phần bình luận */}
                        <div id="comment-section" className="mt-8 pt-8 border-t border-white/5">
                            <LazyRow
                                id={`comments-${movie.slug}`}
                                estimatedHeight="200px"
                                skeleton={<Skeleton className="h-40" rounded="2xl" />}
                            >
                                <CommentSection movieSlug={movie.slug} />
                            </LazyRow>
                        </div>
                    </div>

                </div>
            </Container>
        </main >
    );
}
