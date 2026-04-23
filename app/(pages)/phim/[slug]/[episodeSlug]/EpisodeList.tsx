"use client";

import React, { useState, useMemo } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { ChevronUp, ChevronDown, Server } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFriendlyEpisodeSlug, parseEpNumber } from "@/app/utils/movieUtils";

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
  onEpisodeClick?: () => void;
}

const EpisodeList = ({ slug, currentEpisode, episodes, activeServer = 0, onServerChange, onEpisodeClick }: EpisodeListProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeRangeIndex, setActiveRangeIndex] = useState(0);
  const CHUNK_SIZE = 100;

  if (!episodes || episodes.length === 0) return null;

  const currentServer = episodes[activeServer];
  const episodeData = currentServer.server_data;

  // Calculate episode ranges based on ACTUAL episode numbers
  const episodeRanges = useMemo(() => {
    let maxEpNum = 0;
    episodeData.forEach(ep => {
      const num = parseEpNumber(ep.name);
      if (typeof num === 'number' && num > maxEpNum) maxEpNum = num;
    });

    if (maxEpNum <= CHUNK_SIZE) return [];

    const ranges = [];
    for (let i = 1; i <= maxEpNum; i += CHUNK_SIZE) {
      const start = i;
      const end = i + CHUNK_SIZE - 1;

      const hasEpisodesInRange = episodeData.some(ep => {
        const num = parseEpNumber(ep.name);
        return typeof num === 'number' && num >= start && num <= end;
      });

      if (hasEpisodesInRange) {
        ranges.push({
          label: `Tập ${start} - ${Math.min(end, maxEpNum)}`,
          startValue: start,
          endValue: end
        });
      }
    }
    return ranges;
  }, [episodeData, CHUNK_SIZE]);

  // Current displayed episodes based on active range selection
  const displayedEpisodes = useMemo(() => {
    if (episodeRanges.length === 0) return episodeData;
    const range = episodeRanges[activeRangeIndex];

    return episodeData.filter(ep => {
      const num = parseEpNumber(ep.name);
      if (typeof num === 'number') {
        return num >= range.startValue && num <= range.endValue;
      }
      return activeRangeIndex === 0;
    });
  }, [episodeData, episodeRanges, activeRangeIndex]);

  return (
    <div className="w-full pt-10">
      {/* Header with Servers and Toggle */}
      <div className="flex items-center justify-between gap-6 mb-0 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {episodes.map((server, index) => (
            <button
              key={index}
              onClick={() => {
                onServerChange?.(index);
                setActiveRangeIndex(0);
              }}
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
            style={{ willChange: "height, opacity" }}
          >
            {/* Episode Ranges Selection */}
            {episodeRanges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 pt-2">
                {episodeRanges.map((range, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveRangeIndex(idx)}
                    className={`px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all cursor-pointer border ${activeRangeIndex === idx
                      ? 'bg-[#FFFFFF] text-[#0a1628] border-[#FFFFFF] shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={activeRangeIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 pt-2"
                style={{ willChange: "opacity, transform" }}
              >
                {displayedEpisodes.map((ep, i) => {
                  const isActive = getFriendlyEpisodeSlug(ep.slug) === currentEpisode;

                  return (
                    <TransitionLink
                      key={i}
                      href={`/phim/${slug}/${getFriendlyEpisodeSlug(ep.slug)}`}
                      transition={false}
                      onClick={() => {
                        if (!isActive) onEpisodeClick?.();
                      }}
                      className={`
                        py-3 md:py-4 flex items-center justify-center rounded-xl text-sm transition-all transform border
                        ${isActive
                          ? "bg-[#F0F0F0] text-[#0a1628] border-[#F0F0F0] shadow-[0_0_10px_rgba(255,255,255,0.15)] z-10"
                          : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20"
                        }
                      `}
                    >
                      {ep.name.replace(/Tập\s*/i, "").replace(/^0+/, "")}
                    </TransitionLink>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EpisodeList;
