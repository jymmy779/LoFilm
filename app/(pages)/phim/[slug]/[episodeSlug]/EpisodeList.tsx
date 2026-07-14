"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { Server, Search, ArrowUpDown, ChevronDown } from "lucide-react";
import { getFriendlyEpisodeSlug, parseEpNumber } from "@/app/utils/movieUtils";
import axios from "axios";

interface EpisodeListProps {
  slug: string;
  movieName: string;
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

// Custom Part Dropdown component
const PartDropdown = ({ parts, currentPart, baseSlug }: { parts: number[]; currentPart: number; baseSlug: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold text-white cursor-pointer focus:outline-none focus:border-amber-500/50 focus:bg-white/15 transition-all hover:bg-white/15 hover:border-white/20"
      >
        <span>Phần {currentPart}</span>
        <span className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▾</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[120px] bg-[#1e2028] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-dropdown-in origin-top">
            {parts.map((p, i) => {
              const isSelected = p === currentPart;
              return (
                <button
                  key={p}
                  onClick={() => {
                    setIsOpen(false);
                    if (p !== currentPart) {
                      router.push(`/phim/${baseSlug}-phan-${p}`, { scroll: false });
                    }
                  }}
                  className={`
                    w-full flex items-center px-4 py-2.5 text-xs md:text-sm font-semibold transition-all cursor-pointer
                    ${isSelected
                      ? "bg-amber-500/15 text-amber-400"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }
                    ${i !== 0 ? "border-t border-white/5" : ""}
                  `}
                >
                  <span>Phần {p}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const EpisodeList = ({
  slug,
  movieName,
  currentEpisode,
  episodes,
  activeServer = 0,
  onServerChange,
  onEpisodeClick,
  onEpisodeSelect,
  showServers = true
}: EpisodeListProps) => {
  const [activeRangeIndex, setActiveRangeIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const CHUNK_SIZE = 100;

  // Parse part info from slug (e.g., "naruto-phan-2" → base="naruto", part=2)
  const partInfo = useMemo(() => {
    const match = slug.match(/^(.+?)(?:-phan-(\d+))$/i);
    if (match) return { base: match[1], part: parseInt(match[2], 10) };
    const seasonMatch = slug.match(/^(.+?)(?:-season-(\d+))$/i);
    if (seasonMatch) return { base: seasonMatch[1], part: parseInt(seasonMatch[2], 10) };
    return null;
  }, [slug]);

  const [availableParts, setAvailableParts] = useState<number[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);

  // Check existence of nearby parts (cache in sessionStorage)
  useEffect(() => {
    if (!partInfo) return;

    const { base, part } = partInfo;
    const cacheKey = `parts_${base}`;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.includes(part)) {
          setAvailableParts(parsed);
          return;
        }
      }
    } catch { /* ignore */ }

    const partsToCheck: number[] = [];
    for (let i = Math.max(1, part - 2); i <= part + 2; i++) {
      if (i !== part) partsToCheck.push(i);
    }

    if (partsToCheck.length === 0) return;

    setIsLoadingParts(true);

    const fetchPart = async (p: number) => {
      const partSlug = `${base}-phan-${p}`;
      try {
        const res = await axios.get(`/api/proxy?url=${encodeURIComponent(`https://phimapi.com/v1/api/phim/${partSlug}`)}`);
        const exists = !!(res.data?.status === "success" || res.data?.status === true);
        return { part: p, exists };
      } catch {
        return { part: p, exists: false };
      }
    };

    Promise.allSettled(partsToCheck.map(fetchPart)).then(results => {
      const valid: number[] = [part]; // always include current part
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.exists) {
          valid.push(r.value.part);
        }
      });
      setAvailableParts(valid);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(valid));
      } catch { /* ignore */ }
    }).finally(() => {
      setIsLoadingParts(false);
    });
  }, [partInfo]);

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

  // Filtered + sorted episodes
  const filteredEpisodes = useMemo(() => {
    let list = episodeData;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter(ep => {
        const epNum = parseEpNumber(ep.name);
        // Search by episode number or name
        return ep.name.toLowerCase().includes(query) ||
          (typeof epNum === 'number' && String(epNum).includes(query));
      });
    }

    // Sort
    const sorted = [...list].sort((a, b) => {
      const numA = parseEpNumber(a.name);
      const numB = parseEpNumber(b.name);
      const valA = typeof numA === 'number' ? numA : -1;
      const valB = typeof numB === 'number' ? numB : -1;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return sorted;
  }, [episodeData, searchQuery, sortOrder]);

  // Current displayed episodes based on active range selection (only when no search)
  const displayedEpisodes = useMemo(() => {
    // If search is active, show filtered results (no range filter)
    if (searchQuery.trim()) return filteredEpisodes;

    // Otherwise apply range filter
    if (episodeRanges.length === 0) return filteredEpisodes;
    const range = episodeRanges[activeRangeIndex];

    return filteredEpisodes.filter(ep => {
      const num = parseEpNumber(ep.name);
      if (typeof num === 'number') {
        return num >= range.startValue && num <= range.endValue;
      }
      return activeRangeIndex === 0;
    });
  }, [filteredEpisodes, episodeRanges, activeRangeIndex, searchQuery]);

  // Find latest episode number for "Xem tập mới nhất" link
  const latestEpisode = useMemo(() => {
    let maxNum = -1;
    let latestEp: (typeof episodeData)[0] | undefined;
    episodeData.forEach(ep => {
      const num = parseEpNumber(ep.name);
      if (typeof num === 'number' && num > maxNum) {
        maxNum = num;
        latestEp = ep;
      }
    });
    return latestEp;
  }, [episodeData]);

  // Tự động chuyển tab (range) sang phần chứa tập phim đang phát
  useEffect(() => {
    if (!currentEpisode || episodeRanges.length === 0 || searchQuery.trim()) return;

    const curEp = episodeData.find(ep => getFriendlyEpisodeSlug(ep.slug) === currentEpisode);
    if (!curEp) return;

    const epNum = parseEpNumber(curEp.name);
    if (typeof epNum !== 'number') return;

    const matchedRangeIndex = episodeRanges.findIndex(range =>
      epNum >= range.startValue && epNum <= range.endValue
    );

    if (matchedRangeIndex !== -1 && matchedRangeIndex !== activeRangeIndex) {
      setActiveRangeIndex(matchedRangeIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisode, episodeRanges, episodeData, searchQuery]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="w-full">
      {/* Header with "Danh sách tập" on left, Search/Sort on right */}
      <div className="flex items-center justify-between gap-3 mb-0 pb-4">
        <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">Danh sách tập</h3>

        {/* Search & Sort Bar */}
        <div className="flex items-center gap-3 flex-1 md:flex-none min-w-0 justify-end">
          <div className="relative w-27">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveRangeIndex(0);
              }}
              placeholder="Tìm tập..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-[10px] md:text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all"
            />
          </div>
          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all cursor-pointer border bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white whitespace-nowrap flex-shrink-0"
            title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
          >
            <ArrowUpDown size={12} />
            {sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
          </button>
        </div>
      </div>

      {/* Server buttons - full width inside collapsed area */}
      {showServers && episodes.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {episodes.map((server, index) => (
            <button
              key={index}
              onClick={() => {
                onServerChange?.(index);
                setActiveRangeIndex(0);
                setSearchQuery("");
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
      )}


      {/* Latest Episode Link */}
      {latestEpisode && !searchQuery.trim() && (
        <div className="mb-4 text-[12px] flex gap-1 items-center md:text-sm text-gray-400">
          <span>Xem tập mới nhất tại</span>
          <TransitionLink
            href={`/phim/${slug}/${getFriendlyEpisodeSlug(latestEpisode.slug)}`}
            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors group font-bold"
          >
            <span className="">👉</span>
            <span>{movieName} - Tập {latestEpisode.name.replace(/Tập\s*/i, "").trim()}</span>
          </TransitionLink>
        </div>
      )}

      {/* Part Selector - only show if slug has -phan-X suffix and other parts exist */}
      {partInfo && !searchQuery.trim() && (
        <div className="mb-4 pt-2">
          {isLoadingParts ? (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 animate-pulse border border-white/5">
              <div className="w-16 h-4 bg-white/10 rounded" />
              <div className="w-4 h-4 bg-white/10 rounded" />
            </div>
          ) : availableParts.length > 1 ? (
            <PartDropdown
              parts={[...new Set([...availableParts, partInfo.part])].sort((a, b) => a - b)}
              currentPart={partInfo.part}
              baseSlug={partInfo.base}
            />
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400/60">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M12 2v20" />
              </svg>
              <span className="text-xs md:text-sm text-gray-400 font-semibold">Phần {partInfo.part}</span>
            </div>
          )}
        </div>
      )}

      {/* Episode Ranges Selection (hide when searching) */}
      {episodeRanges.length > 0 && !searchQuery.trim() && (
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

      {/* No results message */}
      {displayedEpisodes.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-xs md:text-sm">
          Không tìm thấy tập nào
        </div>
      )}

      <div
        key={activeRangeIndex + searchQuery + sortOrder}
        className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 pt-2 animate-fade-in"
      >
        {displayedEpisodes.map((ep, i) => {
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
  );
};

export default React.memo(EpisodeList);