import { Heart, Trash2, X } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { getImageUrl } from "@/app/utils/movieUtils";

interface FavoritesTabProps {
  favorites: any[];
  isFavoritesLoading: boolean;
  onDeleteItem?: (id: string) => void;
  onClearAll?: () => void;
}

export default function FavoritesTab({ favorites, isFavoritesLoading, onDeleteItem, onClearAll }: FavoritesTabProps) {
  return (
    <div className="space-y-8 min-h-[400px]">
      <div className="flex flex-col lg:flex-row items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl lg:text-2xl font-bold text-white uppercase italic tracking-tighter text-rose-400">Kho tàng yêu thích</h2>
          {favorites.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-[10px] font-bold text-white/20 hover:text-red-400 tracking-widest transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-red-400/20 active:scale-95 cursor-pointer"
            >
              <Trash2 size={12} />
              Xóa tất cả
            </button>
          )}
        </div>
        <p className="text-white/40 text-xs">{favorites.length} tác phẩm tâm đắc</p>
      </div>

      {isFavoritesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {favorites.map((item) => (
            <div
              key={item.id}
              className="relative group block"
            >
              <TransitionLink
                href={`/phim/${item.movie_slug}`}
                className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-rose-500/30 transition-all block"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={getImageUrl(item.movie_poster, { width: 400, quality: 70 })}
                    alt={item.movie_name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Heart size={24} className="fill-current" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-white font-bold text-sm line-clamp-1 group-hover:text-rose-400 transition-colors">{item.movie_name}</h4>
                  <p className="text-[10px] text-white/20 mt-2">
                    Đã lưu vào {new Date(item.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </TransitionLink>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteItem?.(item.id);
                }}
                className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-red-500 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 z-30 cursor-pointer border border-white/10"
                title="Xóa khỏi yêu thích"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-8 lg:pt-16 pb-12">
          <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white/5 rounded-full flex items-center justify-center text-white/10 mb-4 lg:mb-8">
            <Heart className="w-8 h-8 lg:w-12 lg:h-12" />
          </div>
          <div className="text-center px-4">
            <h3 className="text-lg lg:text-2xl font-bold text-white mb-2 italic uppercase tracking-tight">Trái tim còn trống...</h3>
            <p className="text-white/30 text-xs lg:text-sm max-w-[280px] lg:max-w-lg mx-auto leading-relaxed">
              Nơi lưu giữ những tuyệt tác phim ảnh bạn yêu thích nhất. Hãy thả tim cho bộ phim bạn muốn xem lại sau!
            </p>
            <TransitionLink
              href="/"
              className="mt-6 md:mt-10 inline-block bg-rose-500 text-white px-6 py-3 md:px-10 md:py-4 rounded-full text-[10px] md:text-xs font-medium tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-500/20 cursor-pointer text-center"
            >
              Khám phá ngay
            </TransitionLink>
          </div>
        </div>
      )}
    </div>
  );
}
