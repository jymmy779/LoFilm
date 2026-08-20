"use client";

import React, { useState } from "react";
import {
  Server,
  ChevronDown,
  Flag,
  Play,
  Heart,
  Bookmark,
  Share2,
} from "lucide-react";
import { SubtitleTrack } from "@/app/types/movie";

interface PlayerControlsProps {
  isAutoNext: boolean;
  onToggleAutoNext: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: () => void;
  episodes: Array<{
    server_name: string;
  }>;
  activeServer: number;
  onServerChange: (index: number) => void;
  onReport?: () => void;
  onShare?: () => void;
  // Subtitle props
  subtitles?: SubtitleTrack[];
  subtitleSlot1: string | null;
  subtitleSlot2: string | null;
  onSubtitleSlot1Change: (lang: string | null) => void;
  onSubtitleSlot2Change: (lang: string | null) => void;
}

const PlayerControls = ({
  isAutoNext,
  onToggleAutoNext,
  isFavorited,
  onToggleFavorite,
  isInWatchlist,
  onToggleWatchlist,
  episodes,
  activeServer,
  onServerChange,
  onReport,
  onShare,
}: PlayerControlsProps) => {
  const [showServers, setShowServers] = useState(false);

  return (
    <div className="w-full bg-[#12151C]/60 backdrop-blur-md border border-white/10 p-2.5 sm:p-3 mt-3 sm:mt-4 rounded-2xl transition-all duration-300 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-5 w-full px-1 sm:px-2">

        {/* Left Side: Server Selection & Auto Next */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Đổi Server */}
          {episodes && episodes.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowServers(!showServers)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${showServers
                    ? "bg-[#D497FF]/20 border-[#D497FF] text-[#D497FF]"
                    : "bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20"
                  }`}
              >
                <Server size={14} className="text-[#D497FF]" />
                <span>
                  {episodes[activeServer]?.server_name
                    ?.replace(/Thuyết Minh/gi, "TM")
                    ?.replace(/Lồng Tiếng/gi, "LT") || "Server"}
                </span>
                <ChevronDown size={13} className={`transition-transform duration-300 ${showServers ? 'rotate-180' : ''}`} />
              </button>

              {/* Server Dropdown */}
              <div
                className={`absolute bottom-full left-0 mb-3 min-w-[13rem] bg-[#12151C] border border-white/15 rounded-xl p-1.5 z-50 shadow-2xl backdrop-blur-xl transition-all duration-200 ease-out ${showServers
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-2 scale-95 pointer-events-none"
                  }`}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-white/40 uppercase tracking-wider border-b border-white/5 mb-1">
                  Chọn Nguồn Phát
                </div>
                {episodes.map((server, index) => {
                  const isActive = activeServer === index;
                  const displayName = server.server_name
                    .replace(/Thuyết Minh/gi, "TM")
                    .replace(/Lồng Tiếng/gi, "LT");

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        onServerChange(index);
                        setShowServers(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg transition-all text-left cursor-pointer ${isActive
                          ? "bg-[#D497FF]/15 border border-[#D497FF]/30 text-[#D497FF] font-bold"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Play size={11} fill={isActive ? "currentColor" : "none"} className={isActive ? "text-[#D497FF]" : "text-white/30"} />
                        <span>{displayName}</span>
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1.5 pl-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D497FF] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D497FF]"></span>
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tự chuyển tập (Toggle) */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={onToggleAutoNext}
            title="Tự động phát tập kế tiếp khi xem xong"
          >
            <span className="text-xs sm:text-sm font-medium text-white/80 select-none">Tự chuyển tập</span>
            <div className={`w-7 sm:w-8 h-4 sm:h-4.5 rounded-full relative transition-colors duration-300 ${isAutoNext ? 'bg-[#D497FF]' : 'bg-white/20'}`}>
              <div className={`absolute top-0.5 w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-white shadow-sm transition-all duration-300 ${isAutoNext ? 'left-3.5 sm:left-4' : 'left-0.5'}`} />
            </div>
          </div>
        </div>

        {/* Right Side: Social, Bookmarks & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Yêu thích (Favorite) */}
          <button
            onClick={onToggleFavorite}
            className={`w-8 sm:w-9 h-8 sm:h-9 flex items-center justify-center rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 ${isFavorited
                ? "bg-rose-500 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                : "bg-white/5 border-white/10 text-white/60 hover:text-rose-400 hover:border-rose-400/40 hover:bg-rose-500/10"
              }`}
            title={isFavorited ? "Xóa khỏi yêu thích" : "Yêu thích phim này"}
          >
            <Heart size={16} className={isFavorited ? "fill-white" : ""} />
          </button>

          {/* Danh sách xem sau (Watchlist) */}
          <button
            onClick={onToggleWatchlist}
            className={`w-8 sm:w-9 h-8 sm:h-9 flex items-center justify-center rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 ${isInWatchlist
                ? "bg-[#D497FF] border-[#D497FF] text-black shadow-[0_0_15px_rgba(212,151,255,0.4)]"
                : "bg-white/5 border-white/10 text-white/60 hover:text-[#D497FF] hover:border-[#D497FF]/40 hover:bg-[#D497FF]/10"
              }`}
            title={isInWatchlist ? "Xóa khỏi danh sách xem sau" : "Lưu vào danh sách xem sau"}
          >
            <Bookmark size={16} className={isInWatchlist ? "fill-black" : ""} />
          </button>

          {/* Chia sẻ */}
          <button
            onClick={onShare}
            className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-[#D497FF] hover:border-[#D497FF]/30 hover:bg-[#D497FF]/10 transition-all text-xs sm:text-sm font-medium"
            title="Chia sẻ phim với bạn bè"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>

          {/* Báo lỗi */}
          <button
            onClick={onReport}
            className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-500/10 transition-all text-xs sm:text-sm font-medium"
            title="Báo cáo video lỗi hoặc hỏng tập"
          >
            <Flag size={13} />
            <span className="hidden sm:inline">Báo lỗi</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default React.memo(PlayerControls);
