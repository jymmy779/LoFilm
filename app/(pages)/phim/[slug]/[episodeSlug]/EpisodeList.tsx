"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, Server } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EpisodeListProps {
  slug: string;
  currentEpisode: string;
  episodes: Array<{
    server_name: string;
    server_data: Array<{
      name: string;
      slug: string;
      filename: string;
      link_embed: string;
      link_m3u8: string;
    }>;
  }>;
  activeServer?: number;
  onServerChange?: (index: number) => void;
}

const EpisodeList = ({ slug, currentEpisode, episodes, activeServer = 0, onServerChange }: EpisodeListProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!episodes || episodes.length === 0) return null;

  const currentServer = episodes[activeServer];
  const episodeData = currentServer.server_data;

  return (
    <div className="w-full pt-10">
      {/* Header with Servers and Toggle */}
      <div className="flex items-center justify-between gap-6 mb-0 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {episodes.map((server, index) => (
            <button
              key={index}
              onClick={() => onServerChange?.(index)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] md:text-xs tracking-wider transition-all cursor-pointer font-medium whitespace-nowrap ${activeServer === index
                ? "bg-amber-500 text-[#0a1628]"
                : "bg-white/5 text-gray-500 hover:text-white"
                }`}
            >
              <Server size={12} />
              {server.server_name}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="group flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest cursor-pointer flex-shrink-0"
        >
          <span className="font-medium">{isCollapsed ? "Mở rộng" : "Rút gọn"}</span>
          {isCollapsed ? (
            <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
          ) : (
            <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
          )}
        </button>
      </div>

      {/* Episodes Grid with Animation */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 pt-2">
              {episodeData.map((ep, i) => {
                const isActive = ep.slug === currentEpisode;

                return (
                  <Link
                    key={i}
                    href={`/phim/${slug}/${ep.slug}`}
                    className={`
                      py-3 md:py-4 flex items-center justify-center rounded-xl text-sm transition-all transform border
                      ${isActive
                        ? "bg-[#F0F0F0] text-[#0a1628] border-[#F0F0F0] shadow-[0_0_10px_rgba(255,255,255,0.15)] z-10"
                        : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20"
                      }
                    `}
                  >
                    {ep.name.replace(/Tập\s*/i, "").replace(/^0+/, "")}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EpisodeList;
