"use client";

import { useEffect, useState, memo } from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import SmartImage from "../../UI/Common/SmartImage";
import Container from "@/app/components/UI/Container";
import { getR2MovieThumbUrl } from "@/app/utils/r2ImageUrl";
import { Play } from "lucide-react";
import SwiperNavButtons from "@/app/components/UI/Common/SwiperNavButtons";
import { useAuth } from "@/app/components/User/Auth/AuthContext";
import { createClient } from "@/app/utils/supabase/client";
import CommonModal from "../../UI/Modals/CommonModal";
import { AlertCircle, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface ContinueWatchingRowProps {
    initialHistory?: any[];
}

import ContinueWatchingRowSkeleton from "./ContinueWatchingRowSkeleton";

// Global cache for ContinueWatchingRow
let cachedHistory: any[] = [];
let hasFetchedHistoryOnce = false;

function ContinueWatchingRow({ initialHistory }: ContinueWatchingRowProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [history, setHistory] = useState<any[]>(() => {
        if (cachedHistory.length > 0) return cachedHistory;
        return initialHistory || [];
    });
    const [isLoading, setIsLoading] = useState(() => !hasFetchedHistoryOnce && !initialHistory);
    const supabase = createClient();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isClearingAll, setIsClearingAll] = useState(false);

    const handleClearAllClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsClearingAll(true);
        setItemToDelete(null);
        setShowDeleteModal(true);
    };

    const handleDeleteClick = (e: React.MouseEvent, item: any) => {
        e.preventDefault();
        e.stopPropagation();
        setIsClearingAll(false);
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (isClearingAll) {
            setShowDeleteModal(false);
            setIsLoading(true); // Show skeleton during clear
            try {
                if (user) {
                    const { error } = await supabase.from('watch_history').delete().eq('user_id', user.id);
                    if (error) throw error;
                    localStorage.removeItem(`lofilm-watch-history-${user.id}`);
                } else {
                    localStorage.removeItem('lofilm-guest-watch-history');
                }
                setHistory([]);
                toast.success("Đã xóa toàn bộ lịch sử");
            } catch (error) {
                console.error("Lỗi khi xóa toàn bộ lịch sử:", error);
            } finally {
                setIsLoading(false);
                setIsClearingAll(false);
            }
            return;
        }

        if (!itemToDelete) return;

        const item = itemToDelete;
        const id = item.id;
        const isLocal = id.toString().startsWith('local-');

        setShowDeleteModal(false);
        setIsDeleting(id);

        try {
            if (isLocal) {
                const HISTORY_KEY = user ? `lofilm-watch-history-${user.id}` : 'lofilm-guest-watch-history';
                const localDataStr = localStorage.getItem(HISTORY_KEY);
                if (localDataStr) {
                    const localHistory = JSON.parse(localDataStr);
                    const key = `${item.movie_slug}/${item.episode_slug}`;
                    if (localHistory[key]) {
                        delete localHistory[key];
                        localStorage.setItem(HISTORY_KEY, JSON.stringify(localHistory));
                    }
                }
            } else if (user) {
                // Delete from Supabase - xóa tất cả entries của movie (không chỉ 1 tập)
                const { error } = await supabase.from('watch_history').delete().eq('user_id', user.id).eq('movie_slug', item.movie_slug);
                if (error) throw error;

                // Also attempt local cleanup - xóa tất cả entries của movie trong localStorage
                try {
                    const HISTORY_KEY = `lofilm-watch-history-${user.id}`;
                    const localDataStr = localStorage.getItem(HISTORY_KEY);
                    if (localDataStr) {
                        const localHistory = JSON.parse(localDataStr);
                        Object.keys(localHistory).forEach(key => {
                            if (key.startsWith(`${item.movie_slug}/`)) {
                                delete localHistory[key];
                            }
                        });
                        localStorage.setItem(HISTORY_KEY, JSON.stringify(localHistory));
                    }
                } catch (e) { }
            }

            setHistory(prev => {
                // Filter out ALL items with same movie_slug (không chỉ 1 id)
                const newHistory = prev.filter(h => h.movie_slug !== item.movie_slug);
                cachedHistory = newHistory;
                return newHistory;
            });
            toast.success(isLocal ? "Đã xóa khỏi lịch sử máy" : "Đã xóa khỏi lịch sử");
        } catch (error) {
            console.error("Lỗi khi xóa lịch sử:", error);
        } finally {
            setIsDeleting(null);
            setItemToDelete(null);
        }
    };

    useEffect(() => {
        const fetchHistory = async () => {
            // Wait until auth state is determined
            if (isAuthLoading) return;

            let combinedHistory: any[] = [];

            // 1. Lấy từ Supabase nếu đã đăng nhập
            if (user) {
                const { data, error } = await supabase
                    .from('watch_history')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(20);
                if (!error && data) {
                    combinedHistory = data;
                }
            }

            // 2. Lấy dữ liệu từ LocalStorage (cho khách hoặc dự phòng reload)
            try {
                const HISTORY_KEY = user ? `lofilm-watch-history-${user.id}` : 'lofilm-guest-watch-history';
                const localDataStr = localStorage.getItem(HISTORY_KEY);
                if (localDataStr) {
                    const localHistory = JSON.parse(localDataStr);
                    const now = Date.now();
                    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

                    const localItems = Object.values(localHistory)
                        .filter((item: any) => {
                            // Lọc mục quá 7 ngày
                            const isExpired = (now - item.updated_at) > SEVEN_DAYS_MS;
                            if (isExpired) return false;

                            // Tránh trùng lặp: nếu đã có trong Supabase (đã login) thì không hiện bản local nữa
                            const isDuplicate = combinedHistory.some(sh =>
                                sh.movie_slug === item.movie_slug && sh.episode_slug === item.episode_slug
                            );
                            return !isDuplicate;
                        })
                        .map((item: any) => ({
                            ...item,
                            id: `local-${item.movie_slug}-${item.episode_slug}`,
                            // Convert sang string ISO để đồng bộ kiểu dữ liệu với Supabase
                            updated_at: new Date(item.updated_at).toISOString()
                        }));

                    combinedHistory = [...combinedHistory, ...localItems];
                }
            } catch (e) {
                console.error("Error loading guest history:", e);
            }

            // 3. Sắp xếp lại toàn bộ theo thời gian mới nhất
            combinedHistory.sort((a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );

            // Helper: parse số thứ tự tập từ episode_slug hoặc episode_name
            function getEpisodeNumber(item: any): number {
                const slugMatch = item.episode_slug?.match(/(\d+)/);
                if (slugMatch) return parseInt(slugMatch[1], 10);
                const nameMatch = item.episode_name?.match(/(\d+)/);
                if (nameMatch) return parseInt(nameMatch[1], 10);
                return 0;
            }

            // 4. Group by movie_slug TRƯỚC: giữ item có số tập cao nhất (không filter completed)
            const groupedMap = new Map<string, any>();
            combinedHistory.forEach(item => {
                const key = item.movie_slug;
                const existing = groupedMap.get(key);
                if (!existing) {
                    groupedMap.set(key, item);
                } else {
                    const currentEpNum = getEpisodeNumber(item);
                    const existingEpNum = getEpisodeNumber(existing);
                    if (currentEpNum > existingEpNum) {
                        groupedMap.set(key, item);
                    } else if (currentEpNum === existingEpNum) {
                        // Cùng số tập thì giữ cái mới hơn
                        if (new Date(item.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
                            groupedMap.set(key, item);
                        }
                    }
                }
            });
            let finalHistory = Array.from(groupedMap.values());

            // 5. Giới hạn 20 phim, sắp xếp lại theo thời gian mới nhất
            finalHistory = finalHistory.slice(0, 20);
            finalHistory.sort((a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );

            setHistory(finalHistory);
            cachedHistory = finalHistory;
            hasFetchedHistoryOnce = true;
            setIsLoading(false);
        };
        fetchHistory();
    }, [user, isAuthLoading, supabase]);

    // Fix CLS: Hiển thị Skeleton ngay khi đang load trang hoặc đang load data
    // Chỉ ẩn đi khi chắc chắn không có lịch sử (isLoading = false và history = 0)
    if ((isLoading || isAuthLoading) && !hasFetchedHistoryOnce) {
        // Nếu đã xác định là khách (không login) và không load nữa thì mới return null
        if (!isAuthLoading && !user && !initialHistory && !isLoading) return null;

        // Ngược lại hiện skeleton để giữ chỗ
        return <ContinueWatchingRowSkeleton />;
    }

    if (!isLoading && !isAuthLoading && history.length === 0) return null;

    return (
        <Container as="section" className="continue-watching-section relative z-30">
            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-black/40 p-4 md:p-6 lg:p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                {/* Background Decor subtle */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-[#D497FF]/5 blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <div className="w-full xl:w-[260px] xl:flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                    <div>
                        <h2 className="text-[20px] lg:text-[28px] font-bold !leading-tight text-white">
                            Xem Tiếp
                        </h2>
                        <p className="text-white/40 text-[10px] font-medium mt-1 tracking-[0.2em]">Lịch sử của bạn</p>
                    </div>

                    <div className="flex xl:flex-col gap-3">
                        <TransitionLink
                                href="/lich-su"
                                className="text-[#D497FF]/80 font-medium hover:text-[#D497FF] transition-colors flex items-center gap-2 text-[10px] md:text-sm tracking-widest w-max"
                            >
                                Tất cả lịch sử
                            </TransitionLink>

                        {history.length > 0 && (
                            <button
                                onClick={handleClearAllClick}
                                className="text-white/20 hover:text-red-400 font-medium transition-colors flex items-center gap-2 text-[10px] md:text-sm tracking-widest w-max cursor-pointer"
                            >
                                Xóa toàn bộ
                            </button>
                        )}
                    </div>
                </div>

                {/* Swiper */}
                <div className="w-full xl:w-[calc(100%-292px)] relative group/slider">
                    <Swiper
                        modules={[Navigation]}
                        slidesPerView={2}
                        spaceBetween={8}
                        breakpoints={{
                            640: { slidesPerView: 2.5, spaceBetween: 10 },
                            768: { slidesPerView: 3.2, spaceBetween: 10 },
                            1024: { slidesPerView: 3.5, spaceBetween: 12 },
                            1280: { slidesPerView: 4.2, spaceBetween: 14 },
                            1536: { slidesPerView: 4.5, spaceBetween: 14 },
                        }}
                        navigation={{
                            nextEl: '.btn-next-continue',
                            prevEl: '.btn-prev-continue',
                        }}
                        className="swiper-carousel"
                    >
                        {history.map((item, index) => {
                            const progress = (item.watched_seconds / item.duration) * 100;
                            const isFinished = progress >= 90;
                            const isPriority = index < 4;

                            return (
                                <SwiperSlide key={item.id}>
                                    <div className="group relative block w-full h-full">
                                        <TransitionLink
                                            href={`/phim/${item.movie_slug}/${item.episode_slug}`}
                                            className="block w-full group/item relative"
                                        >
                                            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-800 relative z-0 transition-opacity duration-300">
                                                <SmartImage
                                                    r2Src={getR2MovieThumbUrl(item.movie_slug)}
                                                    src={getImageUrl(item.movie_poster, { width: 320, quality: 75 })}
                                                    rawSrc={getRawImageUrl(item.movie_poster)}
                                                    alt={item.movie_name}
                                                    fill
                                                    priority={false}
                                                    loading="lazy"
                                                    sizes="(max-width: 768px) 160px, (max-width: 1024px) 180px, 200px"
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                                                />

                                                {/* Play overlay on hover */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                    <div className="w-12 h-12 rounded-full bg-[#D497FF] flex items-center justify-center text-black shadow-lg shadow-[#D497FF]/50 transform scale-75 group-hover/item:scale-100 transition-transform">
                                                        <Play size={24} fill="currentColor" />
                                                    </div>
                                                </div>

                                                <div className="absolute bottom-1 left-1 z-10 pointer-events-none transition-opacity duration-200 opacity-100">
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.episode_name && (
                                                            <span className="rounded-[4px] bg-[#F5CAE3] px-1 py-[2px] text-[8px] md:text-[11px] font-bold text-pink-950 shadow-sm border border-pink-500/20 tracking-wide">
                                                                {item.episode_name.toLowerCase().includes('tập') ? item.episode_name : `Tập ${item.episode_name}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 pointer-events-none"></div>

                                                {/* Quick Delete Button */}
                                                <button
                                                    onClick={(e) => handleDeleteClick(e, item)}
                                                    disabled={isDeleting === item.id}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-lg transition-[background-color,border-color,transform] will-change-transform opacity-100 z-30 cursor-pointer border border-white/10 hover:border-white/20 active:scale-90"
                                                    title="Xóa khỏi danh sách"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                        </TransitionLink>

                                        <div className="mt-2.5 px-0.5 transition-opacity duration-200 opacity-100">
                                            <h3 className="truncate text-[13px] font-semibold text-zinc-100 leading-snug hover:text-[#D497FF] transition-colors cursor-pointer" title={item.movie_name}>
                                                <TransitionLink href={`/phim/${item.movie_slug}/${item.episode_slug}`}>
                                                    {item.movie_name}
                                                </TransitionLink>
                                            </h3>
                                            <div className="mt-2 flex flex-col gap-1.5 opacity-90">
                                                <div className="flex items-center justify-between text-[10px] font-medium text-zinc-400 leading-none">
                                                    <span>Đã xem: {Math.floor(item.watched_seconds / 60)}p</span>
                                                    <span>{Math.floor(item.duration / 60)}p</span>
                                                </div>
                                                <div className="h-1 w-full bg-zinc-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-red-600 rounded-full" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    <SwiperNavButtons
                        prevClassName="btn-prev-continue"
                        nextClassName="btn-next-continue"
                        variant="amber"
                    />
                </div>
            </div>

            <CommonModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title={isClearingAll ? "Xóa toàn bộ lịch sử?" : "Xóa lịch sử?"}
                message={isClearingAll
                    ? "Hành động này sẽ xóa vĩnh viễn tất cả lịch sử xem phim của bạn. Bạn không thể khôi phục lại dữ liệu này."
                    : "Bạn có chắc chắn muốn xóa bộ phim này khỏi lịch sử xem không?"}
                confirmText={isClearingAll ? "XOÁ TOÀN BỘ" : "XOÁ NGAY"}
                icon={AlertCircle}
                variant="danger"
            />
        </Container>
    );
}

export default memo(ContinueWatchingRow);

