"use client"

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';

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
  AlertCircle,
  Activity,
  X
} from 'lucide-react';
import { createClient } from "@/app/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { logActivity } from "@/app/utils/log-activity";
import { toast } from "react-hot-toast";
import Image from "next/image";
import LoadingSpinner from "@/app/components/UI/Common/LoadingSpinner";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import LogoutModal from "@/app/components/UI/Modals/LogoutModal";
import ComingSoonModal from "@/app/components/UI/Modals/ComingSoonModal";
import CommonModal from "@/app/components/UI/Modals/CommonModal";
import AvatarCropModal from "@/app/components/UI/Modals/AvatarCropModal";

type TabType = 'overview' | 'history' | 'utilities';

import Sidebar from "@/app/components/Layout/Sidebar/Sidebar";
import { isOwner } from "@/app/utils/owner-utils";
import CatalogHeader from "@/app/components/Movies/MovieCatalog/CatalogHeader";
import OverviewTab from "./components/OverviewTab";
import HistoryTab from "./components/HistoryTab";
import FavoritesTab from "./components/FavoritesTab";
import WatchlistTab from "./components/WatchlistTab";
import SettingsTab from "./components/SettingsTab";
import ActivityTab from "./components/ActivityTab";

import ProfileSkeleton from "./components/ProfileSkeleton";

export default function ProfileContent() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'history', 'utilities'].includes(tabParam)) {
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

  // SWR for Watch History
  const { data: swrHistory, isLoading: isHistoryLoading, mutate: mutateHistory } = useSWR(
    user ? ['watch_history', user.id] : null,
    async () => {
      let combinedHistory: any[] = [];
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(40);
      if (!error && data) combinedHistory = data;
      try {
        const HISTORY_KEY = `lofilm-watch-history-${user.id}`;
        const localDataStr = localStorage.getItem(HISTORY_KEY);
        if (localDataStr) {
          const localHistory = JSON.parse(localDataStr);
          const localItems = Object.values(localHistory).filter((item: any) => {
            return !combinedHistory.some(sh => sh.movie_slug === item.movie_slug && sh.episode_slug === item.episode_slug);
          }).map((item: any) => ({
            ...item,
            id: `local-${item.movie_slug}-${item.episode_slug}`,
            updated_at: new Date(item.updated_at).toISOString()
          }));
          combinedHistory = [...combinedHistory, ...localItems];
        }
      } catch (e) { }

      const groupedMap = new Map<string, any>();
      combinedHistory.forEach(item => {
        const key = item.movie_slug;
        const existing = groupedMap.get(key);
        if (!existing || new Date(item.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
          groupedMap.set(key, item);
        }
      });
      combinedHistory = Array.from(groupedMap.values());
      combinedHistory.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      return combinedHistory;
    },
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  );

  const watchHistory = swrHistory || [];
  const setWatchHistory = (updater: ((prev: any[]) => any[]) | any[]) => {
    if (typeof updater === 'function') {
      mutateHistory((prev: any[] = []) => updater(prev), false);
    } else {
      mutateHistory(updater, false);
    }
  };

  // SWR for Watch Stats & Rank
  const { data: swrStats } = useSWR(
    user ? ['watch_stats', user.id] : null,
    async () => {
      const { data: statsData } = await supabase.from('daily_watch_time').select('watch_date, watched_seconds').eq('user_id', user.id).order('watch_date', { ascending: true });
      const { data: rankData } = await supabase.from('user_watch_rank').select('rank_position, total_seconds').eq('user_id', user.id).single();
      return { stats: statsData || [], rank: rankData?.rank_position || null, totalTime: rankData?.total_seconds || 0 };
    },
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  );
  const watchStats = swrStats?.stats || [];
  const watchRank = swrStats?.rank || null;
  const totalWatchTime = swrStats?.totalTime || 0;

  // SWR for Favorites
  const { data: swrFavorites, isLoading: isFavoritesLoading, mutate: mutateFavorites } = useSWR(
    user ? ['favorites', user.id] : null,
    async () => {
      const { data } = await supabase.from('favorites').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(40);
      return data || [];
    },
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  );

  const favorites = swrFavorites || [];
  const setFavorites = (updater: ((prev: any[]) => any[]) | any[]) => {
    if (typeof updater === 'function') {
      mutateFavorites((prev: any[] = []) => updater(prev), false);
    } else {
      mutateFavorites(updater, false);
    }
  };

  // SWR for Watchlist
  const { data: swrWatchlist, isLoading: isWatchlistLoading, mutate: mutateWatchlist } = useSWR(
    user ? ['watchlist', user.id] : null,
    async () => {
      const { data } = await supabase.from('watchlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(40);
      return data || [];
    },
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  );

  const watchlist = swrWatchlist || [];
  const setWatchlist = (updater: ((prev: any[]) => any[]) | any[]) => {
    if (typeof updater === 'function') {
      mutateWatchlist((prev: any[] = []) => updater(prev), false);
    } else {
      mutateWatchlist(updater, false);
    }
  };

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

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (isEditingName || isChangingPassword) {
      setIsEditMode(true);
    }
  }, [isEditingName, isChangingPassword]);

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
              Object.keys(history).forEach(key => {
                if (key.startsWith(`${itemToDelete.movie_slug}/`)) {
                  delete history[key];
                }
              });
              localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            }
            setWatchHistory((prev: any[]) => prev.filter((item: any) => item.movie_slug !== itemToDelete.movie_slug));
            toast.success("Đã xóa khỏi lịch sử máy");
          } catch (e) {
            console.error("Error deleting local item:", e);
          }
        } else {
          const { error } = await supabase.from('watch_history').delete().eq('user_id', user.id).eq('movie_slug', itemToDelete.movie_slug);
          if (!error) {
            setWatchHistory((prev: any[]) => prev.filter((item: any) => item.movie_slug !== itemToDelete.movie_slug));
            try {
              const HISTORY_KEY = `lofilm-watch-history-${user.id}`;
              const localDataStr = localStorage.getItem(HISTORY_KEY);
              if (localDataStr) {
                const history = JSON.parse(localDataStr);
                Object.keys(history).forEach(key => {
                  if (key.startsWith(`${itemToDelete.movie_slug}/`)) {
                    delete history[key];
                  }
                });
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
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
          setFavorites((prev: any[]) => prev.filter((item: any) => item.id !== id));
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
          setWatchlist((prev: any[]) => prev.filter((item: any) => item.id !== id));
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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // States for pending changes (Preview before Save)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingCoverSrc, setPendingCoverSrc] = useState<string | null>(null);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [pendingAvatarSrc, setPendingAvatarSrc] = useState<string | null>(null);

  const handleUpdateCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    setPendingCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPendingCoverSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpdateAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước file quá lớn. Vui lòng chọn ảnh dưới 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCropImageSrc(e.target?.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCroppedImage = async (croppedBlob: Blob) => {
    setPendingAvatarBlob(croppedBlob);
    const reader = new FileReader();
    reader.onload = (e) => setPendingAvatarSrc(e.target?.result as string);
    reader.readAsDataURL(croppedBlob);
    setIsCropModalOpen(false); // Close cropper modal without uploading yet
  };

  const handleSaveAllChanges = async () => {
    const hasNameChanged = newName.trim() !== "" && newName !== user?.user_metadata?.full_name;
    const hasPasswordChanged = password !== "";

    if (!pendingCoverFile && !pendingAvatarBlob && !hasNameChanged && !hasPasswordChanged) {
      setIsEditMode(false);
      return;
    }

    if (hasPasswordChanged && password !== confirmPassword) {
      toast.error("Mật khẩu không khớp!");
      return;
    }

    if (hasPasswordChanged && password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      if (pendingCoverFile) setIsUpdatingCover(true);
      if (pendingAvatarBlob) setIsUpdatingAvatar(true);
      if (hasNameChanged || hasPasswordChanged) setIsUpdating(true);

      let newAvatarUrl = user?.user_metadata?.avatar_url;
      let newCoverUrl = user?.user_metadata?.cover_url;

      if (pendingCoverFile) {
        const fileExt = pendingCoverFile.name.split('.').pop();
        const fileName = `${user.id}_cover_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, pendingCoverFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        newCoverUrl = publicUrl;
      }

      if (pendingAvatarBlob) {
        const fileName = `${user.id}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, pendingAvatarBlob);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        newAvatarUrl = publicUrl;
      }

      const updateData: any = {
        data: {
          avatar_url: newAvatarUrl,
          cover_url: newCoverUrl
        }
      };

      if (hasNameChanged) {
        updateData.data.full_name = newName;
      }

      if (hasPasswordChanged) {
        updateData.password = password;
      }

      const { error: updateError } = await supabase.auth.updateUser(updateData);
      if (updateError) throw updateError;

      const newUserMeta = {
        ...user.user_metadata,
        avatar_url: newAvatarUrl,
        cover_url: newCoverUrl,
        ...(hasNameChanged ? { full_name: newName } : {})
      };
      setUser({ ...user, user_metadata: newUserMeta });

      if (pendingCoverFile) logActivity(user.id, "update_cover", { cover_url: newCoverUrl });
      if (pendingAvatarBlob) {
        logActivity(user.id, "update_avatar", { avatar_url: newAvatarUrl });
        supabase.from('comments').update({ user_avatar: newAvatarUrl }).eq('user_id', user.id).then();
        supabase.from('user_notifications').update({ actor_avatar: newAvatarUrl }).eq('user_id', user.id).then();
      }

      if (hasNameChanged) {
        logActivity(user.id, "update_name", { old_name: user?.user_metadata?.full_name, new_name: newName });
        supabase.from('comments').update({ user_name: newName }).eq('user_id', user.id).then();
        supabase.from('user_notifications').update({ actor_name: newName }).eq('user_id', user.id).then();
      }

      if (hasPasswordChanged) {
        logActivity(user.id, "update_password", {});
      }

      toast.success("Đã lưu thay đổi!");
      setPendingCoverFile(null);
      setPendingCoverSrc(null);
      setPendingAvatarBlob(null);
      setPendingAvatarSrc(null);
      setIsEditMode(false);
      setIsEditingName(false);
      setIsChangingPassword(false);
      setPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdatingCover(false);
      setIsUpdatingAvatar(false);
    }
  };

  const handleCancelChanges = () => {
    setIsEditMode(false);
    setPendingCoverFile(null);
    setPendingCoverSrc(null);
    setPendingAvatarBlob(null);
    setPendingAvatarSrc(null);
    setIsEditingName(false);
    setIsChangingPassword(false);
    setNewName(user?.user_metadata?.full_name || "");
    setPassword("");
    setConfirmPassword("");
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
      logActivity(user.id, "update_name", { old_name: user?.user_metadata?.full_name, new_name: newName });

      // Cập nhật tên trong tất cả bình luận cũ
      supabase
        .from('comments')
        .update({ user_name: newName })
        .eq('user_id', user.id)
        .then(({ error: updateError }) => {
          if (updateError) console.error("Không thể cập nhật tên trong bình luận cũ:", updateError);
        });

      // Cập nhật tên trong tất cả thông báo cũ
      supabase
        .from('user_notifications')
        .update({ actor_name: newName })
        .eq('user_id', user.id)
        .then(({ error: notifError }) => {
          if (notifError) console.error("Không thể cập nhật tên trong thông báo cũ:", notifError);
        });
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

      // Chuyển về trang chủ sau khi đăng xuất vì đây là trang bảo mật
      window.location.href = "/";
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0];
  const userAvatar = displayName?.charAt(0).toUpperCase();

  const tabs = [
    { id: 'overview', label: 'Thông tin cá nhân', icon: User },
    { id: 'history', label: 'Thống kê giờ xem', icon: HistoryIcon },
    { id: 'utilities', label: 'Tiện ích & hoạt động', icon: Activity },
  ];

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : "...";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24 w-full xl:w-[calc(100%+100px)] xl:-ml-[100px]">
      {/* Banner */}
      <div className="relative h-72 md:h-96 w-full overflow-hidden group">
        {pendingCoverSrc || user?.user_metadata?.cover_url ? (
          <Image
            key={pendingCoverSrc || user.user_metadata.cover_url}
            src={pendingCoverSrc || user.user_metadata.cover_url}
            alt="Cover"
            fill
            className={`object-cover transition-opacity duration-700 ease-in-out ${isCoverLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsCoverLoaded(true)}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-orange-950 via-zinc-900 to-zinc-950"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/60 via-transparent to-transparent pointer-events-none"></div>
        {/* Overlay mỏng ở phía trên để dễ đọc text/icon nếu có */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none"></div>

        {/* Nút Upload Cover Image (Chỉ hiện khi isEditMode = true) */}
        {isEditMode && (
          <label className="absolute top-1/3 md:top-1/4 right-4 md:right-8 -translate-y-1/2 z-20 cursor-pointer flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white hover:bg-black/70 transition-all backdrop-blur-md border border-white/10">
            {isUpdatingCover ? (
              <>
                <LoadingSpinner size="xs" color="white" />
                Đang tải...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Đổi ảnh bìa
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpdateCover}
              disabled={isUpdatingCover}
            />
          </label>
        )}
      </div>

      <div className="w-full xl:pl-[100px]">
        <div className="container mx-auto px-4 md:px-8 -mt-24 relative z-10 max-w-[1440px]">
          {/* Profile Header (Avatar, Name, Actions) */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
            <div className="relative group flex-shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 opacity-70 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative h-36 w-36 md:h-44 md:w-44 rounded-full border-4 border-[#0a0a0f] bg-zinc-900 overflow-hidden shadow-2xl flex items-center justify-center text-5xl font-bold text-zinc-500">
                {isUpdatingAvatar ? (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#0a0a0f]/80 z-[15]">
                    <LoadingSpinner size="md" color="orange" />
                  </div>
                ) : pendingAvatarSrc || user?.user_metadata?.avatar_url ? (
                  <Image
                    key={pendingAvatarSrc || user.user_metadata.avatar_url}
                    src={pendingAvatarSrc || user.user_metadata.avatar_url}
                    alt={displayName}
                    fill
                    className={`object-cover transition-opacity duration-500 ease-in-out ${isAvatarLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setIsAvatarLoaded(true)}
                  />
                ) : (
                  <span>{userAvatar}</span>
                )}
              </div>

              {isEditMode && (
                <label
                  className="absolute bottom-1 right-1 md:bottom-2 md:right-2 z-20 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-600 border-2 border-[#0a0a0f] shadow-lg hover:from-amber-300 hover:via-orange-400 hover:to-rose-500 cursor-pointer active:scale-95 transition-all text-white"
                  onClick={(e) => e.stopPropagation()}
                  title="Thay đổi ảnh đại diện"
                >
                  <Camera className="w-4 h-4 md:w-5 md:h-5" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpdateAvatar}
                    disabled={isUpdatingAvatar}
                  />
                </label>
              )}
            </div>

            <div className="flex-1 text-center md:text-left pb-1">
              <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${isOwner(user?.id) ? 'rgb-text' : 'bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent'}`}>
                {displayName}
              </h1>
              <p className="text-zinc-500 mt-1 text-base font-medium">{user?.email}</p>
              <p className="text-zinc-600 text-sm mt-0.5">Thành viên từ {joinDate}</p>
            </div>

            <div className="flex gap-3 pb-2">
              {isEditMode ? (
                <>
                  <button
                    onClick={handleCancelChanges}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-sm border text-sm font-semibold transition-all cursor-pointer bg-white/10 hover:bg-white/20 border-white/10 text-white"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveAllChanges}
                    disabled={isUpdatingCover || isUpdatingAvatar}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border-none text-sm font-semibold transition-all cursor-pointer bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600 hover:from-amber-300 hover:via-orange-400 hover:to-rose-500 shadow-lg shadow-orange-900/40 text-white disabled:opacity-50"
                  >
                    {isUpdatingCover || isUpdatingAvatar ? (
                      <LoadingSpinner size="xs" color="black" />
                    ) : "Lưu thay đổi"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsEditMode(true);
                    setActiveTab('overview');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-sm border text-sm font-semibold transition-all cursor-pointer bg-white/10 hover:bg-white/20 border-white/10 text-white"
                >
                  <User size={16} /> Chỉnh sửa
                </button>
              )}

              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center px-5 py-2.5 rounded-full bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 text-sm font-semibold transition-all cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-8 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[100px]">
              <div className="flex items-center justify-center gap-1 text-zinc-500 text-xs mb-1">
                <Heart size={14} className="fill-red-500 text-red-500" /> Yêu thích
              </div>
              <p className="text-xl font-black text-white">{favorites.length || 0}</p>
            </div>

            <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[100px]">
              <div className="flex items-center justify-center gap-1 text-zinc-500 text-xs mb-1">
                <Bookmark size={14} className="text-green-400 fill-green-400/20" /> Xem sau
              </div>
              <p className="text-xl font-black text-white">{watchlist.length || 0}</p>
            </div>

            <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[100px]">
              <div className="flex items-center justify-center gap-1 text-zinc-500 text-xs mb-1">
                <HistoryIcon size={14} className="text-orange-400" /> Đã xem
              </div>
              <p className="text-xl font-black text-white">{watchHistory.length || 0}</p>
            </div>
          </div>

          {/* Horizontal Tabs */}
          <div className="mt-10 w-full space-y-6">
            <div className="flex gap-2 border-b border-white/10 pb-1 scrollbar-none overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                    }}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${isActive
                      ? "border-orange-500 text-orange-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-white/20"
                      }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="w-full min-h-[400px]">
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

                {activeTab === 'overview' && (
                  <OverviewTab
                    user={user}
                    displayName={displayName}
                    setShowPremiumModal={setShowPremiumModal}
                    isEditMode={isEditMode}
                    // For editing
                    newName={newName}
                    setNewName={setNewName}
                    isUpdating={isUpdating}
                    handleUpdateName={handleUpdateName}
                    password={password}
                    setPassword={setPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    handleDirectUpdatePassword={handleDirectUpdatePassword}
                    handleDeleteAccount={handleDeleteAccount}
                    watchRank={watchRank}
                    totalWatchTime={totalWatchTime}
                  />
                )}
                {activeTab === 'history' && (
                  <HistoryTab
                    watchHistory={watchHistory}
                    isHistoryLoading={isHistoryLoading}
                    onDeleteItem={deleteHistoryItem}
                    onClearAll={clearAllHistory}
                    watchStats={watchStats}
                    watchRank={watchRank}
                    totalWatchTime={totalWatchTime}
                  />
                )}
                {activeTab === 'utilities' && (
                  <div className="space-y-8">
                    {/* Đường dẫn tới các trang tiện ích */}
                    <div className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/20 to-transparent rounded-full opacity-60 pointer-events-none"></div>
                      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 to-transparent rounded-full opacity-60 pointer-events-none"></div>

                      <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-orange-900/40">
                            <Activity className="w-5 h-5 text-white animate-pulse" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold tracking-tight text-white">Khám Phá Tiện Ích</h2>
                            <p className="text-xs text-zinc-400">Các tính năng cá nhân hóa trải nghiệm xem phim của bạn</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                        <TransitionLink href="/yeu-thich" className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:bg-white/10 hover:border-white/10 transition-all duration-300 group">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Bộ sưu tập</span>
                            <Heart className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="mt-4">
                            <span className="text-lg font-extrabold text-white tracking-tight group-hover:text-red-400 transition-colors">Phim Yêu Thích</span>
                            <p className="text-[10px] text-zinc-500 mt-1">Những bộ phim bạn tâm đắc nhất</p>
                          </div>
                        </TransitionLink>

                        <TransitionLink href="/xem-sau" className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:bg-white/10 hover:border-white/10 transition-all duration-300 group">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Chờ đón xem</span>
                            <Bookmark className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="mt-4">
                            <span className="text-lg font-extrabold text-white tracking-tight group-hover:text-emerald-400 transition-colors">Phim Xem Sau</span>
                            <p className="text-[10px] text-zinc-500 mt-1">Danh sách phim đã đánh dấu</p>
                          </div>
                        </TransitionLink>

                        <TransitionLink href="/lich-su" className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:bg-white/10 hover:border-white/10 transition-all duration-300 group">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Dấu vết</span>
                            <HistoryIcon className="w-4 h-4 text-orange-400 group-hover:-rotate-12 transition-transform" />
                          </div>
                          <div className="mt-4">
                            <span className="text-lg font-extrabold text-white tracking-tight group-hover:text-orange-400 transition-colors">Lịch Sử Toàn Diện</span>
                            <p className="text-[10px] text-zinc-500 mt-1">Quản lý mọi bộ phim bạn đã xem</p>
                          </div>
                        </TransitionLink>
                      </div>
                    </div>

                    {/* Hoạt động */}
                    <div className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent rounded-full opacity-60 pointer-events-none"></div>

                      <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-tr from-zinc-700 to-zinc-500 rounded-xl shadow-lg shadow-zinc-500/20">
                            <Activity className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold tracking-tight text-white">Lịch Sử Hoạt Động</h2>
                            <p className="text-xs text-zinc-400">Các tương tác gần đây của bạn trên hệ thống</p>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10">
                        <ActivityTab user={user} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
        message="Thực ra không có dịch vụ Premium nào cả đâuuu"
      />

      <AvatarCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={cropImageSrc || ""}
        onCropComplete={handleUploadCroppedImage}
      />
    </div>
  );
};