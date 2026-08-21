"use client";
import { useState } from "react";
import { ChevronLeft, Trash2, Play } from "lucide-react";
import Image from "next/image";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { createClient } from "@/app/utils/supabase/client";
import useSWR, { mutate } from "swr";
import { useAuth } from "@/app/components/User/Auth/AuthContext";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import MovieCardSkeleton from "@/app/components/Movies/MovieCard/MovieCardSkeleton";
import LoadingSpinner from "@/app/components/UI/Common/LoadingSpinner";
import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import { getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";
import { toast } from "react-hot-toast";
import CommonModal from "@/app/components/UI/Modals/CommonModal";

export default function FavoritesPage() {
  const supabase = createClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const fetcher = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const cacheKey = user ? ['favorites', user.id] : null;
  const { data: favorites = [], isLoading: isSwrLoading } = useSWR(
    cacheKey, 
    fetcher, 
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  );

  const isLoading = isAuthLoading || isSwrLoading;
  const [displayLimit, setDisplayLimit] = useState(24);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
    confirmText: ""
  });

  // setFavorites logic has been replaced by mutate(cacheKey, newData)

  const markLoaded = (id: string) => setLoadedImages(prev => new Set(prev).add(id));

  const clearAllFavorites = () => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa toàn bộ danh sách?",
      message: "Bạn có chắc chắn muốn xóa tất cả phim khỏi danh sách yêu thích? Hành động này không thể hoàn tác.",
      confirmText: "Xóa tất cả",
      onConfirm: async () => {
        if (!user) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          return;
        }
        
        try {
          const { error } = await supabase.from('favorites').delete().eq('user_id', user.id);
          if (error) throw error;
          
          mutate(cacheKey, [], false);
          toast.success("Đã xóa toàn bộ phim yêu thích");
        } catch (e) {
          console.error("Error clearing favorites:", e);
          toast.error("Có lỗi xảy ra khi xóa danh sách");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteFavoriteItem = (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    setConfirmModal({
      isOpen: true,
      title: "Bỏ yêu thích?",
      message: "Bạn có chắc chắn muốn xóa bộ phim này khỏi kho tàng yêu thích của mình?",
      confirmText: "Xóa khỏi lưu",
      onConfirm: async () => {
        const { error } = await supabase.from('favorites').delete().eq('id', id);
        if (!error) {
          const newFavorites = favorites.filter((item: any) => item.id !== id);
          mutate(cacheKey, newFavorites, false);
          toast.success("Đã xóa khỏi yêu thích");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="min-h-screen pt-0 pb-10 bg-zinc-950 w-full xl:w-[calc(100%+100px)] xl:-ml-[100px]">
      <div className="relative py-10 md:py-20 px-4 xl:pl-[132px] xl:pr-8 -mb-16 overflow-hidden min-h-[250px] md:min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 opacity-40 bg-gradient-to-b from-transparent to-zinc-950" style={{ backgroundColor: '#ef4444' }}></div>
        <div className="relative z-20 w-full py-2 space-y-0 text-left flex justify-between items-end">
          <div>
            <TransitionLink className="inline-flex items-center text-zinc-400 hover:text-white mb-2 transition-colors" href="/ca-nhan">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Quay lại
            </TransitionLink>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 drop-shadow-xl tracking-tighter">Phim yêu thích</h1>
          </div>
          {favorites.length > 0 && (
            <button
              onClick={clearAllFavorites}
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
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-3 gap-y-3">
              {[...Array(16)].map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : favorites.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-3 gap-y-3">
              {favorites.slice(0, displayLimit).map((item) => (
              <div key={item.id} className="w-full relative group">
                <div className="group/item relative block w-full h-full">
                  <TransitionLink className="block w-full" href={`/phim/${item.movie_slug}`}>
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3 bg-[#0F1115] border border-white/5 group-hover/item:border-red-500/50 transition-all duration-300">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 pointer-events-none"></div>
                    </div>
                  </TransitionLink>
                  <div>
                    <h3 className="truncate text-[10px] md:text-[14px] font-semibold text-white group-hover:text-red-400 leading-snug transition-colors" title={item.movie_name}>
                      {item.movie_name}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={(e) => deleteFavoriteItem(item.id, e)}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-red-600/80 transition-colors opacity-100 z-30 border border-white/10" 
                  title="Xóa khỏi yêu thích"
                >
                  <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </button>
              </div>
              ))}
            </div>
            
            {favorites.length > displayLimit && (
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
            Bạn chưa thêm bộ phim nào vào danh sách yêu thích.
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
