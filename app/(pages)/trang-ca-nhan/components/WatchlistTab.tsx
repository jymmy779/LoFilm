"use client";
import { useState } from "react";
import { Bookmark, Play, Trash2, X } from "lucide-react";
import Image from "next/image";

import TransitionLink from "@/app/components/Transition/TransitionLink";
import { getImageUrl } from "@/app/utils/movieUtils";
import Skeleton from "@/app/components/Skeleton/Skeleton";

interface WatchlistTabProps {
  watchlist: any[];
  isWatchlistLoading: boolean;
  onDeleteItem?: (id: string) => void;
  onClearAll?: () => void;
}

export default function WatchlistTab({ watchlist, isWatchlistLoading, onDeleteItem, onClearAll }: WatchlistTabProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const markLoaded = (id: string) => setLoadedImages(prev => new Set(prev).add(id));
  return (
    <div className="space-y-8 min-h-[400px]">
      <div className="flex items-center flex-col justify-between border-b border-white/5 pb-6">
        <div className="flex w-full justify-between mb-2 items-center gap-4">
          <h2 className="text-lg lg:text-xl font-bold text-white uppercase italic tracking-tighter text-amber-400">Xem sau</h2>
          {watchlist.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-[10px] font-medium text-white/20 hover:text-amber-400 tracking-widest transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-amber-400/20 text-nowrap active:scale-95 cursor-pointer"
            >
              <Trash2 size={12} />
              Xóa tất cả
            </button>
          )}
        </div>
        <p className="text-white/40 text-xs w-full">{watchlist.length} bộ phim đang chờ bạn</p>
      </div>

      {isWatchlistLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] mb-3" rounded="2xl" />
              <div className="space-y-0.5">
                <Skeleton className="w-3/4 h-3" />
                <Skeleton className="w-1/2 h-2 opacity-50" />
              </div>
            </div>
          ))}
        </div>
      ) : watchlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="relative group block"
            >
              <TransitionLink
                href={`/phim/${item.movie_slug}`}
                className="block cursor-pointer"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-[#0F1115]">
                  <Image
                    src={getImageUrl(item.movie_poster, { width: 400, quality: 70 })}
                    alt={item.movie_name}
                    fill
                    sizes="25vw"
                    className={`object-cover object-top transition-all duration-500 group-hover:scale-110 ${loadedImages.has(item.id) ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => markLoaded(item.id)}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-black transition-all duration-300">
                      <Play size={24} className="fill-current ml-1" />
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-white font-bold text-xs line-clamp-1 group-hover:text-amber-400 transition-colors">{item.movie_name}</h4>
                </div>
              </TransitionLink>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteItem?.(item.id);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-lg transition-all opacity-100 z-30 cursor-pointer border border-white/10"
                title="Xóa khỏi danh sách xem sau"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-8 lg:pt-16 pb-12">
          <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white/5 rounded-full flex items-center justify-center text-white/10 mb-4 lg:mb-8">
            <Bookmark className="w-8 h-8 lg:w-12 lg:h-12" />
          </div>
          <div className="text-center px-4">
            <h3 className="text-md md:text-lg lg:text-xl font-bold text-white mb-2 italic uppercase tracking-tight">Danh sách xem sau rỗng...</h3>
            <p className="text-white/30 text-[10px] md:text-xs lg:text-sm max-w-[280px] lg:max-w-lg mx-auto leading-relaxed">
              Lưu lại những bộ phim thú vị để thưởng thức khi bạn có thời gian rảnh nhé!
            </p>
            <TransitionLink
              href="/"
              className="mt-6 md:mt-10 inline-block bg-amber-500 text-black px-6 py-3 md:px-10 md:py-4 rounded-full text-[10px] md:text-xs font-medium tracking-[0.2em] hover:bg-amber-400 active:scale-95 transition-all cursor-pointer text-center"
            >
              Khám phá ngay
            </TransitionLink>
          </div>
        </div>
      )}
    </div>
  );
}
