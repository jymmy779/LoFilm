"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Container from "@/app/components/Container";
import MoviePosterCard from "@/app/components/MovieCard/MoviePosterCard";
import { Movie, EpisodeServer } from "@/app/types/movie";
import { getImageUrl, getEpisodeStatus } from "@/app/utils/movieUtils";
import { decodeHtml } from "@/app/utils/textUtils";

interface MovieDetailClientProps {
    movie: Movie;
    episodes: EpisodeServer[];
    suggestedMovies: Movie[];
}

export default function MovieDetailClient({ movie, episodes, suggestedMovies }: MovieDetailClientProps) {
    const [activeTab, setActiveTab] = useState('Tập phim');
    const [isEpisodesCollapsed, setIsEpisodesCollapsed] = useState(false);

    // Build tabs dynamically based on available data
    const tabs = useMemo(() => {
        const t = ['Tập phim', 'Tổng quan'];
        if (movie.trailer_url) t.push('Trailer');
        if (movie.actor && movie.actor.length > 0) t.push('Diễn viên');
        if (suggestedMovies.length > 0) t.push('Đề xuất');
        return t;
    }, [movie.trailer_url, movie.actor, suggestedMovies.length]);

    // Get poster & thumb URLs
    const posterUrl = getImageUrl(movie.poster_url);
    const thumbUrl = getImageUrl(movie.thumb_url);

    // Parse trailer YouTube ID
    const getYoutubeEmbedUrl = (url?: string) => {
        if (!url) return '';
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : '';
    };

    // Get first server episodes
    const firstServerEpisodes = episodes?.[0]?.server_data || [];

    // Parse episode number from name like "Tập 01" => 1
    const parseEpNumber = (name: string) => {
        const match = name.match(/\d+/);
        return match ? parseInt(match[0]) : name;
    };

    // Status text
    const statusText = movie.status === 'completed' ? 'Hoàn thành' : 'Đang cập nhật';
    const isCompleted = movie.status === 'completed';

    // TMDB rating
    const rating = movie.tmdb?.vote_average ? movie.tmdb.vote_average.toFixed(1) : null;

    // Strip HTML tags from content
    const stripHtml = (html?: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    };

    return (
        <main className="min-h-screen pb-20">
            {/* Background Cover */}
            <div className="relative w-full h-[30vh] md:h-[50vh] xl:h-[80vh] overflow-hidden transform-gpu">
                <div className="absolute inset-0 scale-105 will-change-transform">
                    <Image
                        src={thumbUrl}
                        alt={movie.name}
                        fill
                        priority
                        className="object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                </div>
                <div className="absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-[#0a1628]/80 to-transparent z-10" />
                <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#0a1628] to-transparent z-10" />
                <div className="absolute inset-y-0 left-0 w-[15%] bg-gradient-to-r from-[#0a1628] to-transparent z-10 hidden md:block" />
                <div className="absolute inset-y-0 right-0 w-[15%] bg-gradient-to-l from-[#0a1628] to-transparent z-10 hidden md:block" />
            </div>

            {/* Main Content Container */}
            <Container className="lg:-mt-32 -mt-45 p-[20px] lg:-mt-48 relative z-30">
                <div className="flex flex-col xl:flex-row gap-6 md:gap-8">

                    {/* DC SIDE - Movie Info Column */}
                    <div className="dc-side w-full xl:w-[440px] shrink-0">
                        <div className="ds-info p-[20px] lg:p-[40px] lg:backdrop-blur-md rounded-3xl shadow-2xl relative transform-gpu will-change-[filter]">

                            {/* Thumbnail */}
                            <div className="v-thumb-l xl:block flex justify-center mb-6">
                                <div className="v-thumbnail relative w-[120px] h-[180px] lg:w-[160px] lg:h-[240px] rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/20 transform-gpu">
                                    <Image
                                        className="absolute inset-0 w-full h-full object-cover"
                                        src={posterUrl}
                                        alt={movie.name}
                                        fill
                                        priority
                                        sizes="(max-width: 768px) 120px, 160px"
                                    />
                                </div>
                            </div>

                            {/* Title & Alias */}
                            <h2 className="text-xl line-clamp-1 md:text-2xl text-center xl:text-left font-bold text-white mb-1 leading-tight">
                                {decodeHtml(movie.name)}
                            </h2>
                            <div className="text-sm text-white/40 line-clamp-1 text-center xl:text-left mb-5 font-medium">
                                {decodeHtml(movie.origin_name)}
                            </div>

                            <div className="detail-more xl:block hidden space-y-5">
                                {/* Rating & Badges */}
                                <div className="hl-tags flex flex-wrap gap-2">
                                    {rating && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#f5c518] rounded-md text-black font-bold text-[10px]">
                                            <span className="text-[9px]">★</span>
                                            <span>{rating}</span>
                                        </div>
                                    )}
                                    <div className="px-2 py-1 bg-white/10 rounded-md text-white/80 text-[11px] font-medium">{movie.year}</div>
                                    <div className="px-2 py-1 bg-white/10 rounded-md text-white/80 text-[11px] font-medium">{getEpisodeStatus(movie)}</div>
                                </div>

                                {/* Genre Tags */}
                                {movie.category && movie.category.length > 0 && (
                                    <div className="hl-tags flex flex-wrap gap-2">
                                        {movie.category.map((cat) => (
                                            <a key={cat.slug} href={`/the-loai/${cat.slug}`} className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium hover:bg-blue-500/30 transition-colors">
                                                {cat.name}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Status Box */}
                                <div className={`status-box p-3 ${isCompleted ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'} border rounded-xl flex items-center gap-3`}>
                                    {isCompleted && (
                                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="18" width="18"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path></svg>
                                    )}
                                    <span className="text-xs font-bold leading-none">
                                        {statusText}: {getEpisodeStatus(movie)} / {movie.episode_total || '??'} Tập
                                    </span>
                                </div>

                                {/* Introduction */}
                                {movie.content && (
                                    <div className="detail-line">
                                        <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Giới thiệu:</div>
                                        <p className="text-[13px] text-white/70 leading-relaxed line-clamp-4">
                                            {stripHtml(movie.content)}
                                        </p>
                                    </div>
                                )}

                                {/* Key Info */}
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
                                                    <a key={c.slug} href={`/quoc-gia/${c.slug}`} className="text-blue-400 font-medium hover:underline">{c.name}</a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Director */}
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
                    </div>

                    {/* Right Column - Tabs Content */}
                    <div className="dc-side w-full flex-1 shrink-0">
                        <div className="ds-info p-[20px] lg:p-[40px] lg:backdrop-blur-md rounded-3xl shadow-2xl relative transform-gpu will-change-[filter]">
                            {/* DM Bar: Watch Now & Rating */}
                            <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                                <button className="group flex items-center gap-3 bg-gradient-to-r from-[#f5a623] to-[#ffcc33] hover:from-[#ffcc33] hover:to-[#f5a623] text-[#0a1628] py-2 px-6 md:py-4 md:px-8 rounded-full font-bold transition-all transform cursor-pointer shadow-[0_0_20px_rgba(245,166,35,0.4)] hover:shadow-[0_0_30px_rgba(245,166,35,0.6)]">
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                        <i className="fa-solid fa-play text-sm ml-0.5"></i>
                                    </div>
                                    <span className="tracking-wider text-lg">Xem Ngay</span>
                                </button>
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

                            {/* Tab Navigation */}
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
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f5a623] rounded-full shadow-[0_0_10px_rgba(245,166,35,0.8)]" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="tab-content">
                                {/* Episodes Tab */}
                                {activeTab === 'Tập phim' && (
                                    <>
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#ffcc33] animate-pulse"></div>
                                                <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">Danh sách tập</h3>
                                            </div>
                                            <button
                                                onClick={() => setIsEpisodesCollapsed(!isEpisodesCollapsed)}
                                                className="group flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest cursor-pointer"
                                            >
                                                <span>{isEpisodesCollapsed ? 'Mở rộng' : 'Rút gọn'}</span>
                                                <i className={`fa-solid ${isEpisodesCollapsed ? 'fa-chevron-down group-hover:translate-y-0.5' : 'fa-chevron-up group-hover:-translate-y-0.5'} transition-transform`}></i>
                                            </button>
                                        </div>
                                        {/* Episode Grid with Animation */}
                                        <AnimatePresence initial={false}>
                                            {!isEpisodesCollapsed && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0, y: -5 }}
                                                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                                                    exit={{ height: 0, opacity: 0, y: -5 }}
                                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                                    className="overflow-hidden"
                                                    style={{ willChange: "height, opacity, transform", transform: "translateZ(0)" }}
                                                >
                                                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                                        {firstServerEpisodes.map((ep, idx) => (
                                                            <a
                                                                key={idx}
                                                                href="#"
                                                                className="px-1 py-3 md:py-4 flex items-center justify-center rounded-xl text-sm transition-all transform border bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20"
                                                            >
                                                                {parseEpNumber(ep.name)}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
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
                                                <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-3">
                                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{item.label}</span>
                                                    {item.isTag ? (
                                                        <span className="px-2 py-0.5 bg-white/10 rounded text-[11px] text-white/80">{item.value}</span>
                                                    ) : item.isLink ? (
                                                        <span className="text-[#f5a623] text-sm font-medium hover:underline cursor-pointer">{item.value}</span>
                                                    ) : (
                                                        <span className={`text-sm font-medium ${item.color || 'text-white/80'}`}>{item.value}</span>
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
                                                    {stripHtml(movie.content)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Trailer Tab */}
                                {activeTab === 'Trailer' && movie.trailer_url && (
                                    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                                        <iframe
                                            src={getYoutubeEmbedUrl(movie.trailer_url)}
                                            className="absolute inset-0 w-full h-full"
                                            allowFullScreen
                                            allow="autoplay; encrypted-media"
                                        />
                                    </div>
                                )}

                                {/* Actors Tab */}
                                {activeTab === 'Diễn viên' && movie.actor && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                                        {movie.actor.map((actor, idx) => (
                                            <div key={idx} className="group cursor-pointer">
                                                <div className="aspect-[3/4] bg-white/5 rounded-2xl mb-3 flex items-center justify-center border border-white/5 group-hover:border-[#f5a623]/30 transition-all overflow-hidden relative">
                                                    <i className="fa-solid fa-user text-3xl text-white/10 group-hover:text-[#f5a623]/30 transition-colors"></i>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors truncate px-1">
                                                        {actor}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Suggestions Tab */}
                                {activeTab === 'Đề xuất' && suggestedMovies.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                        {suggestedMovies.map((m) => (
                                            <div key={m._id} className="transform hover:scale-[1.02] transition-transform">
                                                <MoviePosterCard movie={m} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </Container>
        </main>
    );
}
