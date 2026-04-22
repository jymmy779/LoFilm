"use client";

import React from "react";
import { CreditCard, Calendar, ShieldCheck, CheckCircle2, ChevronRight, Mail } from "lucide-react";
import { toast } from "react-hot-toast";

interface OverviewTabProps {
  user: any;
  displayName: string;
  setShowPremiumModal: (show: boolean) => void;
}

export default function OverviewTab({ user, displayName, setShowPremiumModal }: OverviewTabProps) {
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-lg lg:text-xl font-bold text-white tracking-tighter uppercase">Trung tâm điều khiển</h1>
          <p className="text-white/40 text-sm mt-1">Chào mừng {displayName}, quản lý mọi thứ ngay tại đây.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
          <CheckCircle2 size={16} className="text-green-500" />
          <span className="text-green-500 text-xs font-bold tracking-wider">Đã xác minh</span>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl hover:border-amber-400/30 transition-all group">
          <div className="w-10 md:w-12 h-10 md:h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
            <CreditCard size={24} />
          </div>
          <h3 className="text-white/40 text-xs font-medium tracking-widest mb-1">Thành viên</h3>
          <p className="text-md font-medium text-white italic">LoFilm Free+</p>
          <button
            onClick={() => setShowPremiumModal(true)}
            className="text-amber-400 text-xs font-medium mt-4 hover:underline cursor-pointer flex items-center gap-1 group/btn"
          >
            <span className="">Nâng cấp Premium</span>
          </button>
        </div>

        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl hover:border-blue-400/30 transition-all group">
          <div className="w-10 md:w-12 h-10 md:h-12 bg-blue-400/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
            <Calendar size={24} />
          </div>
          <h3 className="text-white/40 text-xs font-medium tracking-widest mb-1">Ngày tham gia</h3>
          <p className="text-md font-medium text-white ">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            }) : "Đang cập nhật"}
          </p>
          <p className="text-white/20 text-[10px] mt-4 tracking-widest">Thành viên chính thức</p>
        </div>

        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl hover:border-purple-400/30 transition-all group lg:col-span-1">
          <div className="w-10 md:w-12 h-10 md:h-12 bg-purple-400/10 rounded-2xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-white/40 text-xs font-medium tracking-widest mb-1">Bảo mật</h3>
          <p className="text-md font-medium text-white">Độ an toàn: Cao</p>
          <p className="text-white/20 text-[10px] mt-4 tracking-widest">
            Cập nhật: {user?.last_sign_in_at ? (() => {
              const diff = Math.floor((new Date().getTime() - new Date(user.last_sign_in_at).getTime()) / 1000);
              if (diff < 60) return "vừa xong";
              if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
              if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
              return `${Math.floor(diff / 86400)} ngày trước`;
            })() : "Gần đây"}
          </p>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white/5 rounded-3xl p-8 border border-white/5">
        <h3 className="text-md lg:text-lg font-bold text-white mb-6 flex items-center gap-2">
          <ShieldCheck size={20} className="text-amber-400" />
          Chi tiết tài khoản
        </h3>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-[#111b33]/50 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 italic text-[10px]">UID</div>
              <div className="flex-1 min-w-0">
                <p className="text-white/40 text-[10px] font-medium tracking-widest">User ID chính thức</p>
                <p className="text-xs font-mono text-white/80 break-all">{user?.id}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (user?.id) {
                  navigator.clipboard.writeText(user.id);
                  toast.success("Đã sao chép ID vào bộ nhớ tạm!");
                }
              }}
              className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-white/40 font-medium transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              Sao chép
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-[#111b33]/50 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40"><Mail size={18} /></div>
              <div>
                <p className="text-white/40 text-[10px] font-medium tracking-widest">Link Telegram</p>
                <p className="text-sm text-amber-400/80 font-medium">Chưa kết nối</p>
              </div>
            </div>
            <button className="text-[10px] bg-amber-400/10 text-amber-400 hover:bg-amber-400 hover:text-black px-4 py-2 rounded-lg font-medium transition-all cursor-pointer">Kết nối ngay</button>
          </div>
        </div>
      </div>
    </div>
  );
}
