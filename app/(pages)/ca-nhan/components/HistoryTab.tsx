"use client";
import { useState } from "react";
import { Play, X, ChartColumn, Clock, TrendingUp, Flame, Trophy } from "lucide-react";
import Image from "next/image";

import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import { getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";

interface HistoryTabProps {
  watchHistory: any[];
  isHistoryLoading: boolean;
  onDeleteItem?: (id: string) => void;
  onClearAll?: () => void;
  watchStats?: any[];
  watchRank?: number | null;
  totalWatchTime?: number;
}

export default function HistoryTab({ watchHistory, isHistoryLoading, onDeleteItem, onClearAll, watchStats, watchRank, totalWatchTime }: HistoryTabProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const markLoaded = (id: string) => setLoadedImages(prev => new Set(prev).add(id));

  // Xử lý dữ liệu 7 ngày qua
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(dateStr => {
    const stat = watchStats?.find(s => s.watch_date === dateStr);
    const d = new Date(dateStr);
    const day = d.getDay();
    const dayName = day === 0 ? 'CN' : `T${day + 1}`;

    return {
      date: dateStr,
      dayName: dayName,
      seconds: stat ? stat.watched_seconds : 0
    };
  });

  const totalSeconds7Days = chartData.reduce((acc, curr) => acc + curr.seconds, 0);
  const avgSecondsPerDay = Math.floor(totalSeconds7Days / 7);

  const maxDay = [...chartData].sort((a, b) => b.seconds - a.seconds)[0];
  const maxSeconds = maxDay ? maxDay.seconds : 0;

  const formatMinutes = (secs: number) => Math.floor(secs / 60);

  // Lấy giá trị lớn nhất làm mốc 100%, tối thiểu 3600s (1 giờ) để tránh biểu đồ quá cao khi số phút thấp
  const maxChartSeconds = Math.max(maxSeconds, 3600);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm p-6 space-y-6">
      <div className="w-full space-y-8">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-600 rounded-xl shadow-lg shadow-orange-500/20">
              <ChartColumn className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Thống Kê Giờ Xem</h2>
              <p className="text-xs text-zinc-400">Xu hướng xem phim của bạn trong 7 ngày qua</p>
            </div>
          </div>
        </div>

        <div className="relative h-40 md:h-60 w-full mb-6 md:mb-8 z-10 flex items-end justify-between px-1 md:px-2 border-b border-white/5">
          {chartData.map((data, idx) => {
            const heightPercent = data.seconds > 0 ? Math.max(5, (data.seconds / maxChartSeconds) * 100) : 0;
            const height = `${heightPercent}%`;
            return (
              <div key={data.date} className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer relative" title={`${formatMinutes(data.seconds)} phút`}>
                <div className="w-8 sm:w-10 md:w-14 lg:w-16 h-full flex items-end justify-center relative">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-orange-500/80 to-rose-500/90 hover:from-amber-400 hover:to-rose-600 transition-all duration-300 relative"
                    style={{ height }}
                  >
                    {data.seconds > 0 && <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/40 rounded-t-lg"></div>}
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-400 mt-3 group-hover:text-white transition-colors duration-200">{data.dayName}</span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 relative z-10">
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:bg-white/10 hover:border-white/10 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Tổng thời gian</span>
              <Clock className="w-4 h-4 text-orange-400 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white tracking-tight">{formatMinutes(totalSeconds7Days)} phút</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">7 ngày qua</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:bg-white/10 hover:border-white/10 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Trung bình ngày</span>
              <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white tracking-tight">{formatMinutes(avgSecondsPerDay)} phút</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">mỗi ngày</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:bg-white/10 hover:border-white/10 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Kỷ lục tuần</span>
              <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white tracking-tight">{maxSeconds > 0 ? maxDay.dayName : "Chưa có"}</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">{maxSeconds > 0 ? `${formatMinutes(maxSeconds)} phút` : "0 phút"}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:bg-white/10 hover:border-white/10 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Hạng server</span>
              <Trophy className="w-4 h-4 text-yellow-500 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-yellow-500 tracking-tight">{watchRank ? `#${watchRank}` : "Chưa có"}</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">toàn hệ thống</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
