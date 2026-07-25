"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, X, Trash2, History, Bookmark, Heart } from "lucide-react";
import Image from "next/image";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { createClient } from "@/app/utils/supabase/client";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import { getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";
import { toast } from "react-hot-toast";
import CommonModal from "@/app/components/UI/Modals/CommonModal";
import { useSearchParams, useRouter } from "next/navigation";

export default function LibraryPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "history");
  
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
    confirmText: ""
  });

  // Xóa param trên URL nếu có
  useEffect(() => {
    if (searchParams.has('tab')) {
      router.replace('/thu-vien', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      setUser(currentUser);

      // Fetch History
      let combinedHistory: any[] = [];
      const { data: hData, error: hError } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });
      if (!hError && hData) combinedHistory = hData;

      try {
        const HISTORY_KEY = `lofilm-watch-history-${currentUser.id}`;
        const localDataStr = localStorage.getItem(HISTORY_KEY);
        if (localDataStr) {
          const localHistory = JSON.parse(localDataStr);
          const localItems = Object.values(localHistory)
            .filter((item: any) => !combinedHistory.some(sh => sh.movie_slug === item.movie_slug && sh.episode_slug === item.episode_slug))
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
      const finalHistory = Array.from(groupedMap.values()).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setWatchHistory(finalHistory);

      // Fetch Watchlist
      const { data: wData } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (wData) setWatchlist(wData);

      // Fetch Favorites
      const { data: fData } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (fData) setFavorites(fData);

      setIsLoading(false);
    };

    init();
  }, [supabase]);

  const deleteItem = (id: string, type: 'history' | 'watchlist' | 'favorites', movieSlug: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    const titles = {
      history: 'Xóa lịch sử?',
      watchlist: 'Xóa khỏi xem sau?',
      favorites: 'Xóa khỏi yêu thích?'
    };

    setConfirmModal({
      isOpen: true,
      title: titles[type],
      message: "Bạn có chắc chắn muốn xóa bộ phim này?",
      confirmText: "Xóa ngay",
      onConfirm: async () => {
        if (type === 'history') {
          const isLocal = id.toString().startsWith('local-');
          if (isLocal) {
            try {
              const HISTORY_KEY = `lofilm-watch-history-${user.id}`;
              const localDataStr = localStorage.getItem(HISTORY_KEY);
              if (localDataStr) {
                const history = JSON.parse(localDataStr);
                Object.keys(history).forEach(key => {
                  if (key.startsWith(`${movieSlug}/`)) {
                    delete history[key];
                  }
                });
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
              }
              setWatchHistory(prev => prev.filter(item => item.movie_slug !== movieSlug));
              toast.success("Đã xóa khỏi lịch sử máy");
            } catch (e) {
              console.error("Error deleting local item:", e);
            }
          } else {
            const { error } = await supabase.from('watch_history').delete().eq('user_id', user.id).eq('movie_slug', movieSlug);
            if (!error) {
              setWatchHistory(prev => prev.filter(item => item.movie_slug !== movieSlug));
              try {
                const HISTORY_KEY = `lofilm-watch-history-${user.id}`;
                const localDataStr = localStorage.getItem(HISTORY_KEY);
                if (localDataStr) {
                  const history = JSON.parse(localDataStr);
                  Object.keys(history).forEach(key => {
                    if (key.startsWith(`${movieSlug}/`)) {
                      delete history[key];
                    }
                  });
                  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
                }
              } catch (e) { }
              toast.success("Đã xóa khỏi lịch sử");
            }
          }
        } else if (type === 'watchlist') {
          const { error } = await supabase.from('watchlist').delete().eq('user_id', user.id).eq('id', id);
          if (!error) {
            setWatchlist(prev => prev.filter(item => item.id !== id));
            toast.success("Đã xóa khỏi Xem sau");
          }
        } else if (type === 'favorites') {
          const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('id', id);
          if (!error) {
            setFavorites(prev => prev.filter(item => item.id !== id));
            toast.success("Đã xóa khỏi Yêu thích");
          }
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const formatMinutes = (seconds: number) => {
    if (!seconds) return 0;
    return Math.floor(seconds / 60);
  };

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

  const markLoaded = (id: string) => setLoadedImages(prev => new Set(prev).add(id));

  const getCurrentData = () => {
    if (activeTab === 'watchlist') return watchlist;
    if (activeTab === 'favorites') return favorites;
    return watchHistory;
  };

  const currentData = getCurrentData();

  return (
    <div className="min-h-screen pt-0 pb-10 bg-zinc-950 w-full xl:w-[calc(100%+100px)] xl:-ml-[100px]">
      <div className="relative py-10 md:py-20 px-4 xl:pl-[132px] xl:pr-8 -mb-16 overflow-hidden min-h-[250px] md:min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 opacity-40 bg-gradient-to-b from-transparent to-zinc-950" style={{ backgroundColor: '#f97316' }}></div>
        <div className="relative z-20 w-full py-2 space-y-0 text-left">
          <TransitionLink className="inline-flex items-center text-zinc-400 hover:text-white mb-2 transition-colors" href="/ca-nhan">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Quay lại
          </TransitionLink>
          <h1 className="text-2xl md:text-4xl font-black text-white mb-6 drop-shadow-xl tracking-tighter">Thư viện của bạn</h1>
          
          <div className="flex gap-4 border-b border-white/10 w-full overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'history' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white hover:border-white/50'}`}
            >
              <History className="w-4 h-4" /> Lịch sử
            </button>
            <button 
              onClick={() => setActiveTab('watchlist')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'watchlist' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white hover:border-white/50'}`}
            >
              <Bookmark className="w-4 h-4" /> Xem sau
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'favorites' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white hover:border-white/50'}`}
            >
              <Heart className="w-4 h-4" /> Yêu thích
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full px-4 xl:pl-[132px] xl:pr-8 py-2 space-y-0 mt-4">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-white/10 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
        ) : currentData.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-3 gap-y-3">
            {currentData.map((item) => (
              <div key={item.id} className="w-full">
                <div className="group/item relative block w-full h-full">
                  <TransitionLink className="block w-full" href={activeTab === 'history' ? `/phim/${item.movie_slug}/${item.episode_slug || 'tap-full'}` : `/phim/${item.movie_slug}`}>
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-[#0F1115] z-0 transition-opacity duration-300">
                      <SmartImage 
                        alt={item.movie_name} 
                        className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover/item:scale-110 transform-gpu ${loadedImages.has(item.id) ? 'opacity-100' : 'opacity-0'}`} 
                        r2Src={getR2MoviePosterUrl(item.movie_slug)}
                        src={getImageUrl(item.movie_poster, { width: 300, quality: 70 })}
                        rawSrc={getRawImageUrl(item.movie_poster)}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
                        onLoad={() => markLoaded(item.id)}
                      />
                      <div className="absolute top-2 right-2 z-20">
                        <button 
                          onClick={(e) => deleteItem(item.id, activeTab as any, item.movie_slug, e)}
                          className="group flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:bg-rose-500 hover:border-rose-500 transition-all shadow-lg" 
                          title="Xóa"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {activeTab === 'history' && (
                        <div className="absolute bottom-1 left-1 z-10 pointer-events-none">
                           <span className="rounded-[4px] bg-orange-600/90 px-1 py-[2px] text-[8px] md:text-[11px] font-bold text-white shadow-sm border border-white/10 tracking-wide">
                            {formatEpisode(item.episode_name)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </TransitionLink>
                  <div className="mt-2.5 px-0.5">
                    <h3 className="truncate text-[10px] md:text-[14px] font-semibold text-zinc-100 leading-snug transition-colors" title={item.movie_name}>
                      {item.movie_name}
                    </h3>
                    {activeTab === 'history' && (
                      <div className="mt-1 flex flex-col gap-1.5 opacity-90">
                        <div className="flex items-center justify-between text-[10px] font-medium text-zinc-400 leading-none">
                          <span>{formatMinutes(item.watched_seconds)}p</span>
                          <span>{formatMinutes(item.duration)}p</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600 rounded-full" style={{ width: `${calculateProgressPercent(item.watched_seconds, item.duration)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            Danh sách trống.
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
