"use client";

import { useEffect, useState, memo } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import SmartImage from "../Common/SmartImage";
import Container from "@/app/components/Container";
import { Play } from "lucide-react";
import SwiperNavButtons from "@/app/components/Common/SwiperNavButtons";
import { useAuth } from "@/app/components/Auth/AuthContext";
import { createClient } from "@/app/utils/supabase/client";
import CommonModal from "../Modals/CommonModal";
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
            } else {
                // Delete from Supabase
                const { error } = await supabase.from('watch_history').delete().eq('id', id);
                if (error) throw error;

                // Also attempt local cleanup
                try {
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
                } catch (e) { }
            }

            setHistory(prev => {
                const newHistory = prev.filter(h => h.id !== id);
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

            // 4. Lọc chỉ bỏ phim đã xem hết (< 85%), giới hạn 20 phim
            let finalHistory = combinedHistory.filter(item => {
                if (!item.duration) return true;
                const progress = (item.watched_seconds / item.duration) * 100;
                const isFinished = progress >= 85;
                return !isFinished;
            }).slice(0, 20);

            // Group by movie_slug: chỉ giữ 1 item/phim (item mới nhất), tránh spam tập phim bộ
            const groupedMap = new Map<string, any>();
            finalHistory.forEach(item => {
                const key = item.movie_slug;
                const existing = groupedMap.get(key);
                if (!existing || new Date(item.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
                    groupedMap.set(key, item);
                }
            });
            finalHistory = Array.from(groupedMap.values());
            // Sắp xếp lại sau khi gom nhóm
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
                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-400/5 blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <div className="w-full xl:w-[260px] xl:flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                    <div>
                        <h2 className="text-[20px] lg:text-[28px] font-bold !leading-tight text-white">
                            Xem Tiếp
                        </h2>
                        <p className="text-white/40 text-[10px] font-medium mt-1 tracking-[0.2em]">Lịch sử của bạn</p>
                    </div>

                    <div className="flex xl:flex-col gap-3">
                        {user && (
                            <TransitionLink
                                href="/trang-ca-nhan?tab=history"
                                className="text-amber-400/80 font-medium hover:text-amber-400 transition-colors flex items-center gap-2 text-[10px] md:text-sm tracking-widest w-max"
                            >
                                Tất cả lịch sử
                            </TransitionLink>
                        )}

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
                            1280: { spaceBetween: 12 },
                            767: { spaceBetween: 10 },
                            576: { spaceBetween: 8 },
                        }}
                        navigation={{
                            nextEl: '.btn-next-continue',
                            prevEl: '.btn-prev-continue',
                        }}
                        className="swiper-carousel"
                    >
                        {history.map((item, index) => {
                            const progress = (item.watched_seconds / item.duration) * 100;
                            const isFinished = progress >= 85;
                            const isPriority = index < 4;

                            return (
                                <SwiperSlide key={item.id} className="!w-[160px] sm:!w-[200px] md:!w-[240px] lg:!w-[280px]">
                                    <TransitionLink
                                        href={`/phim/${item.movie_slug}/${item.episode_slug}`}
                                        className="block group/item relative"
                                    >
                                        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-[#0F1115]">
                                            <SmartImage
                                                src={getImageUrl(item.movie_poster, { width: 320, quality: 75 })}
                                                rawSrc={getRawImageUrl(item.movie_poster)}
                                                alt={item.movie_name}
                                                fill
                                                priority={false}
                                                loading="lazy"
                                                sizes="(max-width: 768px) 160px, (max-width: 1024px) 180px, 200px"
                                                className="object-cover object-top transition-transform duration-700 group-hover/item:scale-110"
                                            />

                                            {/* Play overlay on hover */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-black border border-amber-500/20 transform scale-75 group-hover/item:scale-100 transition-transform">
                                                    <Play size={24} fill="black" />
                                                </div>
                                            </div>

                                            {/* Quick Delete Button */}
                                            <button
                                                onClick={(e) => handleDeleteClick(e, item)}
                                                disabled={isDeleting === item.id}
                                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-lg transition-all opacity-100 z-30 cursor-pointer border border-white/10 hover:border-white/20 active:scale-90"
                                                title="Xóa khỏi danh sách"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>

                                        <div className="space-y-0.5">
                                            <h3 className="text-white font-bold text-xs line-clamp-1 group-hover/item:text-amber-400 transition-colors">
                                                {item.movie_name}
                                            </h3>
                                            <p className="text-white/40 text-[10px]">
                                                {item.episode_name ? (
                                                    <>{item.episode_name} · {Math.floor(item.watched_seconds / 60)}ph</>
                                                ) : (
                                                    `${Math.floor(item.watched_seconds / 60)}ph`
                                                )}
                                            </p>
                                        </div>
                                    </TransitionLink>
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
