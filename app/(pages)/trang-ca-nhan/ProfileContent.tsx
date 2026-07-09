"use client"

import React, { useEffect, useState } from 'react';

import {
  User,
  Camera,
  LogOut,
  ChevronRight,
  Settings,
  History as HistoryIcon,
  LayoutDashboard,
  Heart,
  Bookmark,
  Plus,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { createClient } from "@/app/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import LogoutModal from "@/app/components/Modals/LogoutModal";
import ComingSoonModal from "@/app/components/Modals/ComingSoonModal";
import CommonModal from "@/app/components/Modals/CommonModal";

type TabType = 'overview' | 'history' | 'favorites' | 'watchlist' | 'settings';

import Sidebar from "@/app/components/Sidebar/Sidebar";
import CatalogHeader from "@/app/components/MovieCatalog/CatalogHeader";
import OverviewTab from "./components/OverviewTab";
import HistoryTab from "./components/HistoryTab";
import FavoritesTab from "./components/FavoritesTab";
import WatchlistTab from "./components/WatchlistTab";
import SettingsTab from "./components/SettingsTab";

import ProfileSkeleton from "./components/ProfileSkeleton";

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
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'history', 'favorites', 'watchlist', 'settings'].includes(tabParam)) {
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
        let combinedHistory: any[] = [];

        // 1. Fetch from Supabase
        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(40);

        if (!error && data) {
          combinedHistory = data;
        }

        // 2. Merge with LocalStorage (exactly like ContinueWatchingRow)
        try {
          const HISTORY_KEY = `lofilm-watch-history-${user.id}`;
          const localDataStr = localStorage.getItem(HISTORY_KEY);
          if (localDataStr) {
            const localHistory = JSON.parse(localDataStr);
            const localItems = Object.values(localHistory)
              .filter((item: any) => {
                // Check if already in Supabase
                const isDuplicate = combinedHistory.some(sh =>
                  sh.movie_slug === item.movie_slug && sh.episode_slug === item.episode_slug
                );
                return !isDuplicate;
              })
              .map((item: any) => ({
                ...item,
                id: `local-${item.movie_slug}-${item.episode_slug}`,
                updated_at: new Date(item.updated_at).toISOString()
              }));

            combinedHistory = [...combinedHistory, ...localItems];
          }
        } catch (e) {
          console.error("Error merging local history in profile:", e);
        }

        // 3. Sort by time
        combinedHistory.sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        setWatchHistory(combinedHistory);
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
          .order('created_at', { ascending: false })
          .limit(40);

        if (!error && data) {
          setFavorites(data);
        }
        setIsFavoritesLoading(false);
      };
      fetchFavorites();
    }

    if (activeTab === 'watchlist' && user) {
      const fetchWatchlist = async () => {
        setIsWatchlistLoading(true);
        const { data, error } = await supabase
          .from('watchlist')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(40);

        if (!error && data) {
          setWatchlist(data);
        }
        setIsWatchlistLoading(false);
      };
      fetchWatchlist();
    }
  }, [activeTab, user, supabase]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const deleteHistoryItem = (id: string) => {
    const itemToDelete = watchHistory.find(i => i.id === id);
    if (!itemToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: "Xóa lịch sử?",
      message: "Bạn có chắc chắn muốn xóa bộ phim này khỏi lịch sử xem không?",
      confirmText: "Xóa ngay",
      onConfirm: async () => {
        const isLocal = id.toString().startsWith('local-');

        if (isLocal) {
          try {
            const HISTORY_KEY = `lofilm-watch-history-${user.id}`;
            const localDataStr = localStorage.getItem(HISTORY_KEY);
            if (localDataStr) {
              const history = JSON.parse(localDataStr);
              const key = `${itemToDelete.movie_slug}/${itemToDelete.episode_slug}`;
              if (history[key]) {
                delete history[key];
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
              }
            }
            setWatchHistory(prev => prev.filter(item => item.id !== id));
            toast.success("Đã xóa khỏi lịch sử máy");
          } catch (e) {
            console.error("Error deleting local item:", e);
          }
        } else {
          const { error } = await supabase.from('watch_history').delete().eq('id', id);
          if (!error) {
            setWatchHistory(prev => prev.filter(item => item.id !== id));
            try {
              const HISTORY_KEY = `lofilm-watch-history-${user.id}`;
              const localDataStr = localStorage.getItem(HISTORY_KEY);
              if (localDataStr) {
                const history = JSON.parse(localDataStr);
                const key = `${itemToDelete.movie_slug}/${itemToDelete.episode_slug}`;
                if (history[key]) {
                  delete history[key];
                  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
                }
              }
            } catch (e) { }
            toast.success("Đã xóa khỏi lịch sử");
          }
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const clearAllHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa toàn bộ lịch sử?",
      message: "Hành động này sẽ xóa vĩnh viễn tất cả lịch sử xem phim của bạn. Bạn không thể khôi phục lại dữ liệu này.",
      confirmText: "Xoá toàn bộ",
      onConfirm: async () => {
        const { error } = await supabase.from('watch_history').delete().eq('user_id', user.id);
        if (!error) {
          setWatchHistory([]);
          localStorage.removeItem(`lofilm-watch-history-${user.id}`);
          toast.success("Đã xóa toàn bộ lịch sử");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteFavoriteItem = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Bỏ yêu thích?",
      message: "Bạn muốn xóa bộ phim này khỏi kho tàng yêu thích của mình?",
      confirmText: "Xóa khỏi lưu",
      onConfirm: async () => {
        const { error } = await supabase.from('favorites').delete().eq('id', id);
        if (!error) {
          setFavorites(prev => prev.filter(item => item.id !== id));
          toast.success("Đã xóa khỏi yêu thích");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const clearAllFavorites = () => {
    setConfirmModal({
      ...confirmModal, // Preserve other fields
      isOpen: true,
      title: "Xóa toàn bộ yêu thích?",
      message: "Tất cả những bộ phim bạn đã 'thả tim' sẽ bị xóa khỏi danh sách. Bạn có chắc chắn không?",
      confirmText: "Xóa toàn bộ",
      onConfirm: async () => {
        const { error } = await supabase.from('favorites').delete().eq('user_id', user.id);
        if (!error) {
          setFavorites([]);
          toast.success("Đã xóa toàn bộ yêu thích");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteWatchlistItem = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa xem sau?",
      message: "Bạn muốn xóa bộ phim này khỏi danh sách xem sau?",
      confirmText: "Xóa khỏi danh sách",
      onConfirm: async () => {
        const { error } = await supabase.from('watchlist').delete().eq('id', id);
        if (!error) {
          setWatchlist(prev => prev.filter(item => item.id !== id));
          toast.success("Đã xóa khỏi danh sách xem sau");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const clearAllWatchlist = () => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa toàn bộ danh sách xem sau?",
      message: "Tất cả những bộ phim bạn đã lưu để xem sau sẽ bị xóa. Bạn có chắc chắn không?",
      confirmText: "Xóa toàn bộ",
      onConfirm: async () => {
        const { error } = await supabase.from('watchlist').delete().eq('user_id', user.id);
        if (!error) {
          setWatchlist([]);
          toast.success("Đã xóa toàn bộ danh sách xem sau");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

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
    return <ProfileSkeleton />;
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0];
  const userAvatar = displayName?.charAt(0).toUpperCase();

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: User },
    { id: 'history', label: 'Lịch sử xem', icon: HistoryIcon },
    { id: 'favorites', label: 'Yêu thích', icon: Heart },
    { id: 'watchlist', label: 'Xem sau', icon: Bookmark },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1115] to-[#0F1115] pt-27 pb-16 md:pb-20 px-4">
      <div className="max-w-[1440px] mx-auto">
        {/* Page Header */}
        <div className="mb-10 md:mb-12 w-full">
          <CatalogHeader
            title={"Thành viên"}
            showTitle={true}
          />
        </div>

        <div className="flex flex-col xl:flex-row items-start gap-8">
          {/* Nội dung chính bên trái và giữa */}
          <div className="flex-1 flex flex-col lg:flex-row items-start gap-6 md:gap-8 w-full">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-72 shrink-0">
              <div className="bg-[#12151C] border border-white/5 rounded-3xl md:rounded-[32px] p-5 md:p-6 sticky lg:top-32 overflow-hidden group">
                {/* User Profile Summary */}
                <div className="text-center mb-6 md:mb-8 relative">
                  <div className="relative inline-block group/avatar">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black text-3xl md:text-4xl font-bold border-4 border-[#0F1115] relative z-10 overflow-hidden">
                      {isUpdatingAvatar ? (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#0F1115]/80 rounded-full z-[15]">
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

                    <label className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full border-2 border-[#0F1115] z-20 opacity-0 group-hover/avatar:opacity-100 translate-y-2 group-hover/avatar:translate-y-0 transition-all cursor-pointer hover:bg-amber-400">
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
                          ? "bg-amber-400 text-black font-bold"
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

            {/* Main Content Area */}
            <div className="flex-1 min-h-[400px] lg:min-h-[600px] lg:w-auto w-full">
              <div
                className="bg-[#12151C] border border-white/5 rounded-3xl md:rounded-[40px] p-6 relative overflow-hidden"
              >
                <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  {activeTab === 'overview' && (
                    <OverviewTab
                      user={user}
                      displayName={displayName}
                      setShowPremiumModal={setShowPremiumModal}
                    />
                  )}

                  {activeTab === 'history' && (
                    <HistoryTab
                      watchHistory={watchHistory}
                      isHistoryLoading={isHistoryLoading}
                      onDeleteItem={deleteHistoryItem}
                      onClearAll={clearAllHistory}
                    />
                  )}

                  {activeTab === 'favorites' && (
                    <FavoritesTab
                      favorites={favorites}
                      isFavoritesLoading={isFavoritesLoading}
                      onDeleteItem={deleteFavoriteItem}
                      onClearAll={clearAllFavorites}
                    />
                  )}

                  {activeTab === 'watchlist' && (
                    <WatchlistTab
                      watchlist={watchlist}
                      isWatchlistLoading={isWatchlistLoading}
                      onDeleteItem={deleteWatchlistItem}
                      onClearAll={clearAllWatchlist}
                    />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsTab
                      user={user}
                      newName={newName}
                      setNewName={setNewName}
                      isEditingName={isEditingName}
                      setIsEditingName={setIsEditingName}
                      isUpdating={isUpdating}
                      handleUpdateName={handleUpdateName}
                      isChangingPassword={isChangingPassword}
                      setIsChangingPassword={setIsChangingPassword}
                      password={password}
                      setPassword={setPassword}
                      confirmPassword={confirmPassword}
                      setConfirmPassword={setConfirmPassword}
                      handleDirectUpdatePassword={handleDirectUpdatePassword}
                      handleDeleteAccount={handleDeleteAccount}
                    />
                  )}
                </div>
              </div>
            </div>
            {/* Kết thúc Cột nội dung chính giữa */}
          </div>
          {/* Kết thúc Khối bọc trái + giữa */}

          {/* Cột Sidebar phim bên phải */}
          <aside className="w-full xl:w-[320px] shrink-0">
            <Sidebar />
          </aside>
        </div>
      </div>

      {/* Các Modal xác nhận */}

      {/* Common Modal for everything */}
      <CommonModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAccount}
        title="Xác nhận xóa tài khoản?"
        message="Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục."
        confirmText="XÁC NHẬN XÓA"
        icon={AlertCircle}
        variant="danger"
      />

      <CommonModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || "XÁC NHẬN"}
        icon={AlertCircle}
        variant="danger"
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      <ComingSoonModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="LOFILM Premium"
        message="Dịch vụ nâng cấp Premium đang được triển khai"
      />
    </div>
  );
};
