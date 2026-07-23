import React from 'react';
import { X, Settings } from 'lucide-react';
import { useSettingsStore } from '@/app/store/useSettingsStore';

interface UtilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UtilitySettingsModal({ isOpen, onClose }: UtilitySettingsModalProps) {
  const {
    autoPlay,
    autoNext,
    theaterMode,
    newMovieNotif,
    toggleAutoPlay,
    toggleAutoNext,
    toggleTheaterMode,
    toggleNewMovieNotif
  } = useSettingsStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#12151C] w-full max-w-[500px] rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent clicking inside modal from closing it
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Settings size={20} className="text-amber-400" />
              Cài đặt tiện ích
            </h3>
            <p className="text-white/40 text-xs sm:text-sm mt-1">Tùy chỉnh trải nghiệm xem phim</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors self-start"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 sm:p-6 flex flex-col gap-4">
          
          {/* Tự động phát */}
          <div className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div>
              <h4 className="text-sm font-bold text-white">Tự động phát</h4>
              <p className="text-white/40 text-xs mt-1">Tự động phát phim khi mở trang xem.</p>
            </div>
            <button 
              onClick={toggleAutoPlay}
              className={`w-12 h-6 sm:w-14 sm:h-7 flex items-center rounded-full transition-colors shrink-0 ${autoPlay ? 'bg-amber-400' : 'bg-white/10'}`}
            >
              <div className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${autoPlay ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Tự động chuyển tập */}
          <div className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div>
              <h4 className="text-sm font-bold text-white">Tự động chuyển tập</h4>
              <p className="text-white/40 text-xs mt-1">Chuyển sang tập tiếp theo khi kết thúc.</p>
            </div>
            <button 
              onClick={toggleAutoNext}
              className={`w-12 h-6 sm:w-14 sm:h-7 flex items-center rounded-full transition-colors shrink-0 ${autoNext ? 'bg-amber-400' : 'bg-white/10'}`}
            >
              <div className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${autoNext ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Chế độ rạp phim */}
          <div className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div>
              <h4 className="text-sm font-bold text-white">Chế độ rạp phim</h4>
              <p className="text-white/40 text-xs mt-1">Mặc định bật chế độ rạp khi xem phim.</p>
            </div>
            <button 
              onClick={toggleTheaterMode}
              className={`w-12 h-6 sm:w-14 sm:h-7 flex items-center rounded-full transition-colors shrink-0 ${theaterMode ? 'bg-amber-400' : 'bg-white/10'}`}
            >
              <div className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${theaterMode ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Thông báo phim mới */}
          <div className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div>
              <h4 className="text-sm font-bold text-white">Thông báo phim mới</h4>
              <p className="text-white/40 text-xs mt-1">Nhận thông báo khi phim yêu thích có tập mới.</p>
            </div>
            <button 
              onClick={toggleNewMovieNotif}
              className={`w-12 h-6 sm:w-14 sm:h-7 flex items-center rounded-full transition-colors shrink-0 ${newMovieNotif ? 'bg-amber-400' : 'bg-white/10'}`}
            >
              <div className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${newMovieNotif ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
