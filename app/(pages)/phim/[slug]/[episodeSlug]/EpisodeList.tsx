"use client";

import React, { useState, useMemo, useEffect } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { ChevronUp, ChevronDown, Server } from "lucide-react";
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
      link_vtt?: string;
      subtitles?: any[];
    }>;
  }>;
  activeServer?: number;
  onServerChange?: (index: number) => void;
  onEpisodeClick?: () => void;
  onEpisodeSelect?: (epSlug: string) => void;
  showServers?: boolean;
}

const EpisodeList = ({
  slug,
  currentEpisode,
  episodes,
  activeServer = 0,
  onServerChange,
  onEpisodeClick,
  onEpisodeSelect,
  showServers = true
}: EpisodeListProps) => {
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

  // Tự động chuyển tab (range) sang phần chứa tập phim đang phát
  useEffect(() => {
    if (!currentEpisode || episodeRanges.length === 0) return;

    // Tìm thông tin tập phim hiện tại trong danh sách dữ liệu
    const curEp = episodeData.find(ep => getFriendlyEpisodeSlug(ep.slug) === currentEpisode);
    if (!curEp) return;

    const epNum = parseEpNumber(curEp.name);
    if (typeof epNum !== 'number') return;

    // Tìm index của range chứa tập phim này
    const matchedRangeIndex = episodeRanges.findIndex(range =>
      epNum >= range.startValue && epNum <= range.endValue
    );

    if (matchedRangeIndex !== -1 && matchedRangeIndex !== activeRangeIndex) {
      setActiveRangeIndex(matchedRangeIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisode, episodeRanges, episodeData]);

  return (
    <div className="w-full">
      {/* Header with Servers and Toggle */}
      <div className="flex items-center justify-between gap-6 mb-0 pb-4">
        {showServers ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {episodes.map((server, index) => (
              <button
                key={index}
                onClick={() => {
                  onServerChange?.(index);
                  setActiveRangeIndex(0);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] md:text-xs tracking-wider transition-all cursor-pointer font-medium whitespace-nowrap ${activeServer === index
                  ? "bg-amber-500 text-[#0F1115]"
                  : "bg-white/5 text-gray-500 hover:text-white"
                  }`}
              >
                <Server size={12} />
                {server.server_name}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
            <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">Danh sách tập</h3>
          </div>
        )}

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
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${!isCollapsed ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        {/* Episode Ranges Selection */}
        {episodeRanges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 pt-2">
            {episodeRanges.map((range, idx) => (
              <button
                key={idx}
                onClick={() => setActiveRangeIndex(idx)}
                className={`px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all cursor-pointer border ${activeRangeIndex === idx
                  ? 'bg-[#FFFFFF] text-[#0F1115] border-[#FFFFFF]'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}

        <div
          key={activeRangeIndex}
          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 pt-2 animate-fade-in"
        >
          {displayedEpisodes.map((ep, i) => {
            // Nếu slug rỗng mà tên tập là Trailer → dùng "trailer" làm slug
            const rawName = ep.name || "";
            const displayName = rawName.replace(/Tập\s*/i, "").trim();
            const isTrailerEp = !displayName || /^0+$/.test(displayName) || displayName.toLowerCase() === "trailer";
            const resolvedSlug = ep.slug ? getFriendlyEpisodeSlug(ep.slug) : (isTrailerEp ? "trailer" : "");
            const isActive = resolvedSlug === currentEpisode;

            return (
              <TransitionLink
                key={i}
                href={`/phim/${slug}/${resolvedSlug}`}
                transition={!isActive}
                onClick={() => {
                  if (!isActive) onEpisodeClick?.();
                }}
                onMouseDown={(e: React.MouseEvent) => {
                  // If onEpisodeSelect is available, use client-side navigation to preserve fullscreen
                  if (onEpisodeSelect && !isActive) {
                    e.preventDefault();
                    e.stopPropagation();
                    onEpisodeClick?.();
                    onEpisodeSelect(resolvedSlug);
                  }
                }}
                className={`
                  py-3 md:py-4 flex items-center justify-center rounded-xl text-sm transition-all transform border
                  ${isActive
                    ? "bg-[#F0F0F0] text-[#0F1115] border-[#F0F0F0] z-10"
                    : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20"
                  }
                `}
              >
                {isTrailerEp ? "Trailer" : displayName.replace(/^0+(?=\d)/, "")}
              </TransitionLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(EpisodeList);
