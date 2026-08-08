"use client";

import LoadingSpinner from "@/app/components/UI/Common/LoadingSpinner";
import { useEffect, useState } from "react";
import { ChevronLeft, X, Trash2, Play } from "lucide-react";
import Image from "next/image";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { createClient } from "@/app/utils/supabase/client";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import { getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";
import { toast } from "react-hot-toast";
import CommonModal from "@/app/components/UI/Modals/CommonModal";

export default function HistoryPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [displayLimit, setDisplayLimit] = useState(24);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
    confirmText: ""
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      setUser(currentUser);

      let combinedHistory: any[] = [];
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        combinedHistory = data;
      }

      try {
        const HISTORY_KEY = `lofilm-watch-history-${currentUser.id}`;
        const localDataStr = localStorage.getItem(HISTORY_KEY);
        if (localDataStr) {
          const localHistory = JSON.parse(localDataStr);
          const localItems = Object.values(localHistory)
            .filter((item: any) => {
              const isDuplicate = combinedHistory.some(sh =>
                sh.movie_slug === item.movie_slug && sh.episode_slug === item.episode_slug
              );
              return !isDuplicate;
            })
            .map((item: any) => ({
              ...item,
              id: `local-${item.movie_slug}-${item.episode_slug}`,
              updated_at: new Date(item.updated_at).toISOString()
            }));

          combinedHistory = [...combinedHistory, ...localItems];
        }
      } catch (e) {
        console.error("Error merging local history:", e);
      }

      combinedHistory.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      const groupedMap = new Map<string, any>();
      combinedHistory.forEach(item => {
        const key = item.movie_slug;
        const existing = groupedMap.get(key);
        if (!existing || new Date(item.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
          groupedMap.set(key, item);
        }
      });
      
      const finalHistory = Array.from(groupedMap.values()).sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setWatchHistory(finalHistory);
      setIsLoading(false);
    };

    init();
  }, [supabase]);

  const deleteHistoryItem = (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const itemToDelete = watchHistory.find(i => i.id === id);
    if (!itemToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: "Xóa lịch sử?",
      message: "Bạn có chắc chắn muốn xóa bộ phim này khỏi lịch sử xem không?",
      confirmText: "Xóa ngay",
      onConfirm: async () => {
        const isLocal = id.toString().startsWith('local-');

        if (isLocal) {
          try {
            const HISTORY_KEY = `lofilm-watch-history-${user.id}`;
            const localDataStr = localStorage.getItem(HISTORY_KEY);
            if (localDataStr) {
              const history = JSON.parse(localDataStr);
              Object.keys(history).forEach(key => {
                if (key.startsWith(`${itemToDelete.movie_slug}/`)) {
                  delete history[key];
                }
              });
              localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            }
            setWatchHistory(prev => prev.filter(item => item.movie_slug !== itemToDelete.movie_slug));
            toast.success("Đã xóa khỏi lịch sử máy");
          } catch (e) {
            console.error("Error deleting local item:", e);
          }
        } else {
          const { error } = await supabase.from('watch_history').delete().eq('user_id', user.id).eq('movie_slug', itemToDelete.movie_slug);
          if (!error) {
            setWatchHistory(prev => prev.filter(item => item.movie_slug !== itemToDelete.movie_slug));
            try {
              const HISTORY_KEY = `lofilm-watch-history-${user.id}`;
              const localDataStr = localStorage.getItem(HISTORY_KEY);
              if (localDataStr) {
                const history = JSON.parse(localDataStr);
                Object.keys(history).forEach(key => {
                  if (key.startsWith(`${itemToDelete.movie_slug}/`)) {
                    delete history[key];
                  }
                });
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
              }
            } catch (e) { }
            toast.success("Đã xóa khỏi lịch sử");
          }
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const clearAllHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa toàn bộ lịch sử?",
      message: "Bạn có chắc chắn muốn xóa tất cả phim trong lịch sử? Hành động này không thể hoàn tác.",
      confirmText: "Xóa tất cả",
      onConfirm: async () => {
        try {
          const HISTORY_KEY = `lofilm-watch-history-${user?.id || 'guest'}`;
          localStorage.removeItem(HISTORY_KEY);
          
          if (user) {
            const { error } = await supabase.from('watch_history').delete().eq('user_id', user.id);
            if (error) throw error;
          }
          
          setWatchHistory([]);
          toast.success("Đã xóa toàn bộ lịch sử");
        } catch (e) {
          console.error("Error clearing history:", e);
          toast.error("Có lỗi xảy ra khi xóa lịch sử");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const formatMinutes = (seconds: number) => {
    if (!seconds) return 0;
    return Math.floor(seconds / 60);
  };

  const markLoaded = (id: string) => setLoadedImages(prev => new Set(prev).add(id));

  const calculateProgressPercent = (progress: number, duration: number) => {
    if (!duration || duration === 0) return 0;
    const pct = (progress / duration) * 100;
    return Math.min(Math.max(pct, 0), 100);
  };

  const formatEpisode = (name: string) => {
    if (!name || name.toLowerCase() === 'full') return 'Bản Full';
    const cleanName = name.replace(/tập\s*/i, '').replace(/^0+(?=\d)/, '');
    return `Tập ${cleanName}`;
  };

  return (
    <div className="min-h-screen pt-0 pb-10 bg-zinc-950 w-full xl:w-[calc(100%+100px)] xl:-ml-[100px]">
      <div className="relative py-10 md:py-20 px-4 xl:pl-[132px] xl:pr-8 -mb-16 overflow-hidden min-h-[250px] md:min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 opacity-40 bg-gradient-to-b from-transparent to-zinc-950" style={{ backgroundColor: '#f97316' }}></div>
        <div className="relative z-20 w-full py-2 space-y-0 text-left flex justify-between items-end">
          <div>
            <TransitionLink className="inline-flex items-center text-zinc-400 hover:text-white mb-2 transition-colors" href="/ca-nhan">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Quay lại
            </TransitionLink>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 drop-shadow-xl tracking-tighter">Lịch sử xem</h1>
          </div>
          {watchHistory.length > 0 && (
            <button
              onClick={clearAllHistory}
              className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 rounded-lg transition-colors font-medium text-[12px] md:text-sm border border-red-600/20 mb-1"
            >
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Xóa tất cả
            </button>
          )}
        </div>
      </div>
      
      <div className="relative z-20 w-full px-4 xl:pl-[132px] xl:pr-8 -mt-24 py-2 space-y-0">
          {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" style={{ animationDuration: '0.45s' }} />
              <div className="absolute w-6 h-6 border-2 border-amber-400/20 border-b-amber-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.65s' }} />
              <div className="absolute w-1.5 h-1.5 bg-orange-500 rounded-full" />
            </div>
          </div>
        ) : watchHistory.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-2 gap-y-4 md:gap-x-4 md:gap-y-6">
              {watchHistory.slice(0, displayLimit).map((item) => (
              <div key={item.id} className="w-full relative group">
                <div className="group/item relative block w-full h-full">
                  <TransitionLink className="block w-full" href={`/phim/${item.movie_slug}/${item.episode_slug || 'tap-full'}`}>
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 md:mb-3 bg-[#0F1115]">
                      <SmartImage 
                        alt={item.movie_name} 
                        className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover/item:scale-110 transform-gpu ${loadedImages.has(item.id) ? 'opacity-100' : 'opacity-0'}`} 
                        r2Src={getR2MoviePosterUrl(item.movie_slug)}
                        src={getImageUrl(item.movie_poster, { width: 300, quality: 70 })}
                        rawSrc={getRawImageUrl(item.movie_poster)}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 15vw"
                        onLoad={() => markLoaded(item.id)}
                      />
                      <div className="absolute bottom-1 left-1 z-10 pointer-events-none">
                        <div className="flex flex-wrap gap-1">
                          <span className="rounded-[4px] bg-orange-600/90 px-1 py-[2px] text-[8px] md:text-[10px] font-bold text-white shadow-sm border border-white/10 tracking-wide">
                            {formatEpisode(item.episode_name)}
                          </span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 pointer-events-none"></div>
                    </div>
                  </TransitionLink>
                  <div>
                    <h3 className="truncate text-[11px] md:text-[14px] font-semibold text-white group-hover:text-orange-400 leading-snug transition-colors" title={item.movie_name}>
                      {item.movie_name}
                    </h3>
                    <div className="mt-1 md:mt-2 flex flex-col gap-1 md:gap-1.5 opacity-90">
                      <div className="flex items-center justify-between text-[9px] md:text-[10px] font-medium text-zinc-400 leading-none">
                        <span>{formatMinutes(item.watched_seconds)}p</span>
                        <span>{formatMinutes(item.duration)}p</span>
                      </div>
                      <div className="h-[3px] md:h-1 w-full bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 rounded-full" style={{ width: `${calculateProgressPercent(item.watched_seconds, item.duration)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => deleteHistoryItem(item.id, e)}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-red-600/80 transition-colors opacity-100 z-30 backdrop-blur-sm border border-white/10" 
                  title="Xóa khỏi lịch sử"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </button>
              </div>
              ))}
            </div>
            
            {watchHistory.length > displayLimit && (
              <div className="flex justify-center mt-6 mb-12">
                <button 
                  onClick={() => setDisplayLimit(prev => prev + 24)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white text-sm font-medium transition-all"
                >
                  Xem thêm
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            Bạn chưa xem bộ phim nào.
          </div>
        )}
      </div>

      <CommonModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText={confirmModal.confirmText}
        cancelText="Hủy"
        icon={Trash2}
        variant="danger"
      />
    </div>
  );
}
