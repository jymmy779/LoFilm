"use client"

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, History, Heart, Settings, LogOut,
  ChevronRight, Camera, CreditCard, ShieldCheck,
  Play, Trash2, Calendar, Mail, CheckCircle2
} from 'lucide-react';
import { createClient } from "@/app/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Suspense } from 'react';
import { getImageUrl } from "@/app/utils/movieUtils";
import Image from "next/image";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import LogoutModal from "@/app/components/Modals/LogoutModal";
import ComingSoonModal from "@/app/components/Modals/ComingSoonModal";

type TabType = 'overview' | 'history' | 'favorites' | 'settings';

export default function ProfileContent() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'history', 'favorites', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        toast.error("Bạn cần đăng nhập để xem trang này!");
        router.push("/dang-nhap");
        return;
      }
      setUser(user);
      setNewName(user?.user_metadata?.full_name || "");
      setLoading(false);
    };
    fetchUser();
  }, [supabase, router]);

  useEffect(() => {
    if (activeTab === 'history' && user) {
      const fetchHistory = async () => {
        setIsHistoryLoading(true);
        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          setWatchHistory(data);
        }
        setIsHistoryLoading(false);
      };
      fetchHistory();
    }

    if (activeTab === 'favorites' && user) {
      const fetchFavorites = async () => {
        setIsFavoritesLoading(true);
        const { data, error } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setFavorites(data);
        }
        setIsFavoritesLoading(false);
      };
      fetchFavorites();
    }
  }, [activeTab, user, supabase]);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  const handleUpdateAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
      return;
    }

    setIsUpdatingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;

    try {
      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        if (uploadError.message.includes("not found")) {
          throw new Error("Bucket 'avatars' chưa được tạo trong Supabase Storage.");
        }
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 3. Update Auth Metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      toast.success("Đã cập nhật ảnh đại diện!");
      setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: publicUrl } });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: newName }
    });

    if (error) {
      toast.error("Không thể cập nhật tên: " + error.message);
    } else {
      toast.success("Cập nhật tên thành công!");
      setIsEditingName(false);
      setUser({ ...user, user_metadata: { ...user.user_metadata, full_name: newName } });
    }
    setIsUpdating(false);
  };

  const handleDirectUpdatePassword = async () => {
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast.error("Lỗi: " + error.message);
    } else {
      toast.success("Đã đổi mật khẩu thành công!");
      setIsChangingPassword(false);
      setPassword("");
      setConfirmPassword("");
    }
    setIsUpdating(false);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    toast.error("Chức năng bảo mật cao: Vui lòng liên hệ Admin để xóa vĩnh viễn tài khoản.");
    setShowDeleteModal(false);
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      toast.error("Vui lòng kết nối mạng để đăng xuất an toàn!", { id: "logout-error" });
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast.success("Đã đăng xuất thành công!");
      setUser(null);
      
      // Giữ người dùng ở nguyên trang và làm mới dữ liệu
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#111b33] to-[#0d162b] pt-32 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-72 h-[400px] bg-white/5 animate-pulse rounded-[32px]" />
          <div className="flex-1 h-[600px] bg-white/5 animate-pulse rounded-[32px]" />
        </div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0];
  const userAvatar = displayName?.charAt(0).toUpperCase();

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: User },
    { id: 'history', label: 'Lịch sử xem', icon: History },
    { id: 'favorites', label: 'Yêu thích', icon: Heart },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111b33] to-[#0d162b] pt-24 md:pt-32 pb-16 md:pb-20 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 md:gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-[#16213e] border border-white/5 rounded-3xl md:rounded-[32px] p-5 md:p-6 sticky lg:top-32 shadow-2xl overflow-hidden group">
            {/* User Profile Summary */}
            <div className="text-center mb-6 md:mb-8 relative">
              <div className="relative inline-block group/avatar">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black text-3xl md:text-4xl font-bold shadow-xl shadow-amber-400/20 border-4 border-[#111b33] relative z-10 overflow-hidden">
                  {isUpdatingAvatar ? (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#111b33]/80 rounded-full z-[15]">
                      <div className="w-8 h-8 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
                    </div>
                  ) : user?.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt={displayName}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userAvatar
                  )}
                </div>

                <label className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full shadow-lg border-2 border-[#111b33] z-20 opacity-0 group-hover/avatar:opacity-100 translate-y-2 group-hover/avatar:translate-y-0 transition-all cursor-pointer hover:bg-amber-400">
                  <Camera size={14} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpdateAvatar}
                    disabled={isUpdatingAvatar}
                  />
                </label>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white mt-3 md:mt-4 truncate px-2">{displayName}</h2>
              <p className="text-white/40 text-[10px] md:text-xs mt-0.5 md:mt-1 truncate px-2 tracking-widest">{user?.email}</p>
            </div>

            {/* Nav Menu */}
            <nav className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-1 mb-4 md:mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                      // Update URL without full refresh to persist tab state on reload
                      router.push(`/trang-ca-nhan?tab=${tab.id}`, { scroll: false });
                    }}
                    className={`w-full flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl transition-all cursor-pointer ${activeTab === tab.id
                      ? "bg-amber-400 text-black font-bold shadow-lg shadow-amber-400/10"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                      <span className="text-xs md:text-sm">{tab.label}</span>
                    </div>
                    {activeTab === tab.id && <ChevronRight size={14} className="hidden lg:block md:w-4 md:h-4" />}
                  </button>
                );
              })}
            </nav>

            <div className="h-[1px] bg-white/5 mb-3 md:mb-4 hidden lg:block" />

            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-center lg:justify-start gap-2 md:gap-3 px-4 py-2.5 md:py-3 text-red-400 hover:bg-red-500/10 rounded-xl md:rounded-2xl transition-all cursor-pointer text-xs md:text-sm font-medium"
            >
              <LogOut size={16} className="md:w-[18px] md:h-[18px]" />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Main Content Area - Optimized for performance */}
        <div className="flex-1 min-h-[400px] md:min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "linear" }}
              className="bg-[#16213e] border border-white/5 rounded-3xl md:rounded-[40px] p-6 md:p-12 shadow-2xl min-h-full"
            >
              {activeTab === 'overview' && (
                <div className="space-y-10">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-white tracking-tighter uppercase">Trung tâm điều khiển</h1>
                      <p className="text-white/40 text-sm mt-1">Chào mừng {displayName}, quản lý mọi thứ ngay tại đây.</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span className="text-green-500 text-xs font-bold uppercase tracking-wider">Đã xác minh</span>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-amber-400/30 transition-all group">
                      <div className="w-12 h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                        <CreditCard size={24} />
                      </div>
                      <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Thành viên</h3>
                      <p className="text-xl font-bold text-white uppercase italic">LoFilm Free+</p>
                      <button 
                        onClick={() => setShowPremiumModal(true)}
                        className="text-amber-400 text-xs font-bold mt-4 hover:underline cursor-pointer flex items-center gap-1 group/btn"
                      >
                        Nâng cấp Premium <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-blue-400/30 transition-all group">
                      <div className="w-12 h-12 bg-blue-400/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                        <Calendar size={24} />
                      </div>
                      <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Ngày tham gia</h3>
                      <p className="text-xl font-bold text-white">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        }) : "Đang cập nhật"}
                      </p>
                      <p className="text-white/20 text-[10px] mt-4 uppercase tracking-widest font-bold">Thành viên chính thức</p>
                    </div>

                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-purple-400/30 transition-all group lg:col-span-1">
                      <div className="w-12 h-12 bg-purple-400/10 rounded-2xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={24} />
                      </div>
                      <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Bảo mật</h3>
                      <p className="text-xl font-bold text-white">Độ an toàn: Cao</p>
                      <p className="text-white/20 text-[10px] mt-4 uppercase tracking-widest font-bold">
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
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <ShieldCheck size={20} className="text-amber-400" />
                      Chi tiết tài khoản
                    </h3>
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-[#111b33]/50 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 italic text-[10px]">UID</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">User ID chính thức</p>
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
                          className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-white/40 font-bold uppercase transition-all cursor-pointer whitespace-nowrap active:scale-95"
                        >
                          Sao chép
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-[#111b33]/50 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40"><Mail size={18} /></div>
                          <div>
                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Link Telegram</p>
                            <p className="text-sm text-amber-400/80 font-bold">Chưa kết nối</p>
                          </div>
                        </div>
                        <button className="text-[10px] bg-amber-400/10 text-amber-400 hover:bg-amber-400 hover:text-black px-4 py-2 rounded-lg font-bold uppercase transition-all">Kết nối ngay</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-8 min-h-[400px]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <h2 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Dấu vết điện ảnh</h2>
                    <p className="text-white/40 text-xs">{watchHistory.length} bộ phim đã xem</p>
                  </div>

                  {isHistoryLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl" />
                      ))}
                    </div>
                  ) : watchHistory.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {watchHistory.map((item) => {
                        const progress = (item.watched_seconds / item.duration) * 100;
                        return (
                          <TransitionLink
                            key={item.id}
                            href={`/phim/${item.movie_slug}/${item.episode_slug}`}
                            className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden group cursor-pointer hover:border-amber-400/30 transition-all block"
                          >
                            <div className="relative aspect-video overflow-hidden">
                               <Image
                                src={getImageUrl(item.movie_poster, { width: 400, quality: 70 })}
                                alt={item.movie_name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-black shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                  <Play size={24} className="fill-current ml-1" />
                                </div>
                              </div>
                              <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10 z-20">
                                <div className="h-full bg-amber-400" style={{ width: `${progress}%` }} />
                              </div>
                              {item.episode_name && (
                                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded-lg text-[10px] font-bold text-white border border-white/10 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] z-20">
                                  {item.episode_name}
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="text-white font-bold text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">{item.movie_name}</h4>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-white/40 tracking-widest">
                                  Đã xem {Math.floor(item.watched_seconds / 60)} phút
                                </span>
                                <span className="text-[10px] text-white/20">
                                  {new Date(item.updated_at).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </TransitionLink>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-12">
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/10 mb-6">
                        <History size={40} />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-2 italic uppercase">Dấu tích trống trơn...</h3>
                        <p className="text-white/30 text-sm max-w-sm mx-auto">Bạn chưa xem bộ phim nào gần đây trên hệ thống LoFilm. Hãy bắt đầu chuyến phiêu lưu của mình ngay!</p>
                        <TransitionLink
                          href="/"
                          className="mt-8 inline-block bg-amber-400 text-black px-8 py-3 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-400/20 cursor-pointer text-center"
                        >
                          BẮT ĐẦU XEM PHIM
                        </TransitionLink>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="space-y-8 min-h-[400px]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <h2 className="text-2xl font-bold text-white uppercase italic tracking-tighter text-rose-400">Kho tàng yêu thích</h2>
                    <p className="text-white/40 text-xs">{favorites.length} tác phẩm tâm đắc</p>
                  </div>

                  {isFavoritesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl" />
                      ))}
                    </div>
                  ) : favorites.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {favorites.map((item) => (
                        <TransitionLink
                          key={item.id}
                          href={`/phim/${item.movie_slug}`}
                          className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden group cursor-pointer hover:border-rose-500/30 transition-all block"
                        >
                          <div className="relative aspect-video overflow-hidden">
                            <Image
                              src={getImageUrl(item.movie_poster, { width: 400, quality: 70 })}
                              alt={item.movie_name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                              <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                <Heart size={24} className="fill-current" />
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="text-white font-bold text-sm line-clamp-1 group-hover:text-rose-400 transition-colors">{item.movie_name}</h4>
                            <p className="text-[10px] text-white/20 mt-2">
                              Đã lưu vào {new Date(item.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </TransitionLink>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-12">
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/10 mb-6">
                        <Heart size={40} />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-2 italic uppercase">Trái tim còn trống...</h3>
                        <p className="text-white/30 text-sm max-w-sm mx-auto">Nơi lưu giữ những tuyệt tác phim ảnh bạn yêu thích nhất. Hãy thả tim cho bộ phim bạn muốn xem lại sau!</p>
                        <TransitionLink
                          href="/"
                          className="mt-8 inline-block bg-rose-500 text-white px-8 py-3 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-500/20 cursor-pointer text-center"
                        >
                          KHÁM PHÁ NGAY
                        </TransitionLink>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-10">
                  <div className="border-b border-white/5 pb-6">
                    <h1 className="text-3xl text-white tracking-tighter uppercase italic">Cài đặt LoFilm+</h1>
                    <p className="text-white/40 text-sm mt-1">Quản trị các tùy chọn cá nhân và bảo mật tài khoản.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-5 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-sm md:text-base font-bold text-white">Tên hiển thị</h4>
                          <p className="text-white/30 text-[10px] md:text-xs">
                            Họ tên hiện tại: <span className="text-white/50 font-bold ml-1">{user?.user_metadata?.full_name || "Chưa đặt"}</span>
                          </p>
                        </div>
                        {!isEditingName && (
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="px-4 md:px-5 py-2 bg-white/5 hover:bg-white text-white hover:text-black text-[10px] md:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                          >
                            Thay đổi
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {isEditingName && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 flex flex-col sm:flex-row gap-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                              <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="flex-1 bg-[#111b33] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
                                placeholder="Nhập tên mới..."
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={handleUpdateName}
                                  disabled={isUpdating}
                                  className="px-6 py-2 bg-amber-400 text-black text-[10px] font-bold rounded-xl hover:bg-amber-300 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                  {isUpdating ? "..." : "Lưu"}
                                </button>
                                <button
                                  onClick={() => { setIsEditingName(false); setNewName(user?.user_metadata?.full_name || ""); }}
                                  className="px-4 py-2 bg-white/5 text-white text-[10px] font-bold rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="p-5 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm md:text-base font-bold text-white">Mật khẩu</h4>
                          <p className="text-white/30 text-[10px] md:text-xs">Nên cập nhật thường xuyên</p>
                        </div>
                        {!isChangingPassword && (
                          <button
                            onClick={() => setIsChangingPassword(true)}
                            className="px-4 md:px-5 py-2 bg-white/5 hover:bg-white text-white hover:text-black text-[10px] md:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                          >
                            Đổi mật khẩu
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {isChangingPassword && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                              <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                                className="w-full bg-[#111b33] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
                              />
                              <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Xác nhận mật khẩu mới"
                                className="w-full bg-[#111b33] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setIsChangingPassword(false)}
                                  className="px-4 py-2 text-[10px] font-bold text-white/50 hover:text-white transition-all cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={handleDirectUpdatePassword}
                                  disabled={isUpdating}
                                  className="px-6 py-2 bg-amber-400 text-black text-[10px] font-bold rounded-xl hover:bg-amber-300 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                  {isUpdating ? "..." : "Cập nhật mật khẩu"}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="p-5 md:p-6 bg-red-500/5 rounded-2xl md:rounded-3xl border border-red-500/10 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-red-400">Xóa tài khoản</h4>
                        <p className="text-red-500/40 text-[10px] md:text-xs italic">Cảnh báo: Dữ liệu sẽ mất vĩnh viễn</p>
                      </div>
                      <button
                        onClick={handleDeleteAccount}
                        className="px-4 md:px-5 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[10px] md:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                      >
                        Xóa vĩnh viễn
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#1a1c1e] border border-white/5 rounded-3xl p-8 shadow-2xl text-center"
            >
              <h3 className="text-xl font-bold text-white mb-3">Xác nhận xóa tài khoản?</h3>
              <p className="text-white/40 text-sm mb-8">
                Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteAccount}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all cursor-pointer"
                >
                  XÁC NHẬN XÓA
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-3 bg-white/5 text-white/60 rounded-xl font-bold text-sm hover:bg-white/10 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
      <ComingSoonModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="LOFILM Premium"
        message="Dịch vụ nâng cấp Premium đang được triển khai. Bạn sẽ sớm được tận hưởng đặc quyền xem phim không quảng cáo, chất lượng 4K và nhiều tính năng độc quyền khác!"
      />
    </div>
  );
}
