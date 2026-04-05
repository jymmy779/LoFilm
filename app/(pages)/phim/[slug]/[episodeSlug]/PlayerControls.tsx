"use client";

import React, { useState } from "react";
import {
  Server,
  ChevronDown,
  Maximize2,
  Flag,
  Play,
  Monitor,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerControlsProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isTheaterMode: boolean;
  onToggleTheater: () => void;
  isAutoNext: boolean;
  onToggleAutoNext: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  episodes: Array<{
    server_name: string;
  }>;
  activeServer: number;
  onServerChange: (index: number) => void;
  onReport?: () => void;
}

const PlayerControls = ({
  isExpanded,
  onToggleExpanded,
  isTheaterMode,
  onToggleTheater,
  isAutoNext,
  onToggleAutoNext,
  isFavorited,
  onToggleFavorite,
  episodes,
  activeServer,
  onServerChange,
  onReport
}: PlayerControlsProps) => {
  const [showServers, setShowServers] = useState(false);

  return (
    <div className={`w-full bg-white/5 border border-white/10 p-3 md:p-4 mt-4 backdrop-blur-md transition-all duration-500 ${isExpanded ? 'rounded-none border-x-0' : 'rounded-xl'}`}>
      <div className="flex flex-wrap items-center gap-4 md:gap-6 max-w-[1900px] mx-auto px-5 lg:px-12">

        {/* Đổi Server - Chỉ hiện nếu có nhiều hơn 1 server */}
        {episodes && episodes.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowServers(!showServers)}
              className="flex items-center cursor-pointer gap-2 text-white/80 hover:text-white transition-colors py-1 pl-1 pr-2"
            >
              <Server size={14} className="text-amber-400" />
              <span className="md:text-sm text-xs font-medium">Đổi server</span>
              <ChevronDown size={12} className={`transition-transform duration-300 ${showServers ? 'rotate-180' : ''}`} />
            </button>

            {/* Server Dropdown */}
            <AnimatePresence>
              {showServers && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute bottom-full left-0 mb-3 w-48 bg-[#1a2b4b] border border-white/10 rounded-lg shadow-2xl p-1 z-50 overflow-hidden"
                >
                  {episodes.map((server, index) => {
                    const isActive = activeServer === index;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          onServerChange(index);
                          setShowServers(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 md:text-sm text-xs rounded-md transition-all text-left cursor-pointer ${isActive
                          ? "bg-amber-400/10 border border-amber-400/20 text-amber-400"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                      >
                        <Play size={10} fill={isActive ? "currentColor" : "none"} className={isActive ? "text-amber-400" : "text-white/40"} />
                        <span className="font-medium">{server.server_name}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Chuyển tập (Toggle) */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={onToggleAutoNext}
        >
          <span className="md:text-sm text-xs font-medium text-white/80 group-hover:text-white transition-colors">Chuyển tập</span>
          <div className={`md:w-9 md:h-5 w-7 h-4 rounded-full relative transition-colors duration-300 ${isAutoNext ? 'bg-amber-500' : 'bg-white/20'}`}>
            <div className={`absolute md:top-1 top-[3px] md:w-3 md:h-3 w-2.5 h-2.5 rounded-full bg-white transition-all duration-300 ${isAutoNext ? 'md:left-5 left-[15px]' : 'md:left-1 left-[3px]'}`} />
          </div>
        </div>

        {/* Rạp phim (Toggle) */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={onToggleTheater}
        >
          <span className={`md:text-sm text-xs font-medium transition-colors ${isTheaterMode ? "text-amber-400" : "text-white/80 group-hover:text-white"}`}>Rạp phim</span>
          <div className={`md:w-9 md:h-5 w-7 h-4 rounded-full relative transition-colors duration-300 ${isTheaterMode ? 'bg-amber-500' : 'bg-white/20'}`}>
            <div className={`absolute md:top-1 top-[3px] md:w-3 md:h-3 w-2.5 h-2.5 rounded-full bg-white transition-all duration-300 ${isTheaterMode ? 'md:left-5 left-[15px]' : 'md:left-1 left-[3px]'}`} />
          </div>
        </div>

        {/* Mở rộng */}
        <button
          onClick={onToggleExpanded}
          className="flex items-center cursor-pointer gap-2 text-white/80 hover:text-white transition-colors group"
        >
          <Maximize2 className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-colors ${isExpanded ? 'text-amber-400' : 'text-white/60 group-hover:text-amber-400'}`} />
          <span className={`md:text-sm text-xs font-medium ${isExpanded ? 'text-amber-400' : ''}`}>Mở rộng</span>
        </button>

        {/* Thêm vào yêu thích (New Style) */}
        <button 
          onClick={onToggleFavorite}
          className={`
            md:w-10 md:h-10 w-9 h-9 flex items-center justify-center rounded-full border transition-all cursor-pointer shadow-lg 
            ${isFavorited 
              ? "bg-rose-500 border-rose-500 text-white shadow-rose-500/20" 
              : "bg-white/5 border-white/10 text-white/60 hover:text-rose-400 hover:border-rose-400/30"
            }
          `}
          title={isFavorited ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
        >
          <Heart size={20} className={isFavorited ? "fill-white" : ""} />
        </button>

        {/* Reaction (Emoji Picker) */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-full">
          {[
            { id: 'laugh', emoji: '😂', title: 'Hài hước' },
            { id: 'wow', emoji: '😮', title: 'Thú vị' },
            { id: 'cry', emoji: '😢', title: 'Buồn' },
            { id: 'fire', emoji: '🔥', title: 'Hấp dẫn' },
            { id: 'poo', emoji: '💩', title: 'Tệ' },
          ].map((item) => (
            <button
              key={item.id}
              title={item.title}
              className="md:w-8 md:h-8 w-6 h-6 flex items-center cursor-pointer justify-center text-lg hover:scale-125 hover:-translate-y-1 transition-all duration-200 active:scale-90"
            >
              {item.emoji}
            </button>
          ))}
        </div>

        {/* Báo lỗi (Float Right on MD+) */}
        <div className="flex-grow" />
        <button 
          onClick={onReport}
          className="flex items-center cursor-pointer gap-2 text-white/60 hover:text-red-400 transition-colors group"
        >
          <Flag size={14} />
          <span className="md:text-sm text-xs font-medium">Báo lỗi</span>
        </button>

      </div>
    </div>
  );
};

export default PlayerControls;
