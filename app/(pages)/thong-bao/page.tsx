"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";

import { Bell, Heart, MessageCircle, Info, ThumbsDown, Trash2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import CommonModal from "@/app/components/UI/Modals/CommonModal";
import NotificationLoading from "./loading";

interface UnifiedNotification {
    id: string;
    type: 'system' | 'reply' | 'like' | 'dislike';
    message?: string; // For system
    actor_name?: string; // For user
    actor_avatar?: string; // For user
    movie_slug?: string; // For user
    comment_content?: string; // For user
    comment_id?: string; // For user
    created_at: string;
    is_read?: boolean;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const ITEMS_PER_PAGE = 15;

    const [user, setUser] = useState<any>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data } = await supabase.auth.getUser();
                if (data?.user) {
                    setUser(data.user);
                    await fetchNotifications(1, data.user.id);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra đăng nhập:', error);
            } finally {
                setIsCheckingAuth(false);
            }
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const sessionUser = session?.user || null;
            setUser(sessionUser);
            if (!sessionUser) {
                setIsCheckingAuth(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const fetchNotifications = async (page: number, userId?: string) => {
        const targetUserId = userId || user?.id;
        if (!targetUserId) return;
        setIsLoading(true);

        try {
            // Lấy thông báo hệ thống (Luôn lấy toàn bộ vì thường ít và quan trọng)
            const { data: siteData } = await supabase
                .from('site_notifications')
                .select('*')
                .eq('is_active', true)
                .gt('expires_at', new Date().toISOString());

            const formattedSiteData = (siteData || []).map((n: any) => ({
                id: n.id,
                type: 'system',
                message: n.message,
                created_at: n.created_at,
                is_read: false
            })) as UnifiedNotification[];

            // Lấy thông báo cá nhân với phân trang
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data: userData, count } = await supabase
                .from('user_notifications')
                .select('*', { count: 'exact' })
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false })
                .range(from, to);

            const formattedUserData = (userData || []).map((n: any) => ({
                id: n.id,
                type: n.type,
                actor_name: n.actor_name,
                actor_avatar: n.actor_avatar,
                movie_slug: n.movie_slug,
                comment_content: n.content,
                comment_id: n.comment_id,
                created_at: n.created_at,
                is_read: n.is_read
            })) as UnifiedNotification[];

            // Ghép và sắp xếp
            // Nếu ở trang 1 thì ghép cả thông báo hệ thống, các trang sau chỉ hiện thông báo cá nhân
            const merged = page === 1
                ? [...formattedSiteData, ...formattedUserData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                : formattedUserData;

            setNotifications(merged);

            if (count !== null) {
                setTotalCount(count);
                setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
            }

            // Tự động đánh dấu tất cả là đã đọc khi vào trang
            if (page === 1) {
                if (formattedSiteData.length > 0) {
                    localStorage.setItem('last_seen_notification_id', formattedSiteData[0].id);
                }

                const unreadUserData = formattedUserData.some(n => !n.is_read);
                if (unreadUserData) {
                    supabase
                        .from('user_notifications')
                        .update({ is_read: true })
                        .eq('user_id', targetUserId)
                        .eq('is_read', false)
                        .then(() => {
                            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                            window.dispatchEvent(new CustomEvent('notifications_updated'));
                        });
                } else {
                    window.dispatchEvent(new CustomEvent('notifications_updated'));
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải thông báo:', error);
            toast.error('Không thể tải thông báo');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchNotifications(currentPage);

            // Realtime for User Notifications
            const userChannelName = `page_user_notifs_${user.id}_${Math.random().toString(36).substring(7)}`;
            const userChannel = supabase
                .channel(userChannelName)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${user.id}` }, () => {
                    fetchNotifications(currentPage);
                })
                .subscribe();

            // Realtime for Site Notifications
            const siteChannelName = `page_site_notifs_${Math.random().toString(36).substring(7)}`;
            const siteChannel = supabase
                .channel(siteChannelName)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'site_notifications' }, () => {
                    fetchNotifications(currentPage);
                })
                .subscribe();

            const handleNotificationsUpdated = () => {
                fetchNotifications(currentPage);
            };
            window.addEventListener('notifications_updated', handleNotificationsUpdated);

            return () => {
                supabase.removeChannel(userChannel);
                supabase.removeChannel(siteChannel);
                window.removeEventListener('notifications_updated', handleNotificationsUpdated);
            };
        }
    }, [user?.id, currentPage]);

    const handleDeleteAllConfirm = async () => {
        if (!user?.id) return;

        try {
            await supabase
                .from('user_notifications')
                .delete()
                .eq('user_id', user.id);

            toast.success('Đã xóa tất cả thông báo');
            fetchNotifications(1);
            setCurrentPage(1);
            setIsDeleteModalOpen(false);
            window.dispatchEvent(new CustomEvent('notifications_updated'));
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user?.id) return;

        try {
            await supabase
                .from('user_notifications')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Đã xóa thông báo');
            window.dispatchEvent(new CustomEvent('notifications_updated'));
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    // Helper functions for rendering
    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds} giây trước`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} ngày trước`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} tháng trước`;
        return `${Math.floor(months / 12)} năm trước`;
    };

    const renderIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={14} className="text-rose-500 fill-rose-500" />;
            case 'dislike': return <ThumbsDown size={14} className="text-zinc-400 fill-zinc-400" />;
            case 'reply': return <MessageCircle size={14} className="text-[#D497FF] fill-[#D497FF]" />;
            case 'system': return <Info size={14} className="text-amber-500" />;
            default: return <Bell size={14} />;
        }
    };

    const renderLabel = (type: string) => {
        switch (type) {
            case 'like': return <span className="text-rose-500 text-[11px] md:text-xs font-semibold uppercase tracking-wider ml-2">Thích</span>;
            case 'dislike': return <span className="text-zinc-400 text-[11px] md:text-xs font-semibold uppercase tracking-wider ml-2">Không thích</span>;
            case 'reply': return <span className="text-[#D497FF] text-[11px] md:text-xs font-semibold uppercase tracking-wider ml-2">Phản hồi</span>;
            case 'system': return <span className="text-amber-500 text-[11px] md:text-xs font-semibold uppercase tracking-wider ml-2">Admin</span>;
            default: return null;
        }
    };

    const renderContent = (notif: UnifiedNotification) => {
        if (notif.type === 'system') {
            return <p className="text-sm md:text-base text-white/90 mt-1 line-clamp-3">{notif.message}</p>;
        }

        const actionText = notif.type === 'like' ? 'thích' : notif.type === 'dislike' ? 'không thích' : 'trả lời';

        return (
            <div className="mt-1.5 md:mt-2">
                <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                    <span className="font-bold text-white">{notif.actor_name}</span> đã {actionText} bình luận của bạn.
                </p>
                {notif.comment_content && (
                    <div className="mt-2 pl-3 border-l-2 border-white/10 text-xs md:text-sm text-white/50 italic line-clamp-2">
                        "{notif.comment_content}"
                    </div>
                )}
            </div>
        );
    };

    if (isCheckingAuth) {
        return <NotificationLoading />;
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-24 pb-10 flex items-center justify-center w-full xl:w-[calc(100%+100px)] xl:-ml-[100px]">
                <div className="text-center text-white/50">Vui lòng đăng nhập để xem thông báo.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 md:pt-28 pb-20 bg-zinc-950 w-full xl:w-[calc(100%+100px)] xl:-ml-[100px]">
            <div className="max-w-4xl mx-auto px-4 md:px-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                            <Bell className="text-amber-400 w-6 h-6 md:w-8 md:h-8" />
                            Thông báo của bạn
                        </h1>
                        <p className="text-sm text-white/50 mt-2">Quản lý và xem lại tất cả các thông báo.</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg md:rounded-xl transition-colors text-[12px] md:text-sm font-medium border border-red-500/20"
                        >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Xóa tất cả</span>
                            <span className="sm:hidden">Xóa hết</span>
                        </button>
                    </div>
                </div>

                {/* Danh sách thông báo */}
                <div className="bg-[#0F1115] border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                    {isLoading ? (
                        <div className="p-4 md:p-6 space-y-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/[0.01] border border-white/5 animate-pulse">
                                    <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                                    <div className="flex-1 space-y-2.5">
                                        <div className="h-4 w-40 bg-white/10 rounded" />
                                        <div className="h-4 w-full bg-white/5 rounded" />
                                        <div className="h-3 w-24 bg-white/5 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {notifications.map((notif) => {
                                const targetUrl = notif.type !== 'system' && notif.movie_slug
                                    ? `/phim/${notif.movie_slug}${notif.comment_id ? `#comment-${notif.comment_id}` : ''}`
                                    : '#';

                                const Wrapper = (notif.type !== 'system' && notif.movie_slug ? Link : "div") as any;

                                return (
                                    <div key={notif.id} className="relative group">
                                        <Wrapper
                                            href={targetUrl !== '#' ? targetUrl : undefined}
                                            className={`flex gap-3 md:gap-5 p-4 md:p-6 transition-colors ${notif.type !== 'system' && !notif.is_read ? 'bg-[#111419]/5 hover:bg-[#111419]/10' : 'hover:bg-white/5'
                                                } ${notif.type !== 'system' && notif.movie_slug ? 'cursor-pointer' : 'cursor-default'}`}
                                        >
                                            <div className="shrink-0 mt-1 relative">
                                                {notif.type === 'system' ? (
                                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg">
                                                        <div className="scale-125 md:scale-150">
                                                            {renderIcon(notif.type)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border border-white/10 bg-gradient-to-br from-orange-950 via-zinc-900 to-zinc-950 flex items-center justify-center shadow-lg text-white/90 font-bold text-sm md:text-lg shrink-0">
                                                            {notif.actor_avatar ? (
                                                                <Image src={notif.actor_avatar} alt="Avatar" fill className="object-cover" />
                                                            ) : (
                                                                (notif.actor_name || "U").charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-[#0F1115] rounded-full flex items-center justify-center border border-white/10 shadow-sm">
                                                            {renderIcon(notif.type)}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 pr-8">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center">
                                                        <span className="text-xs md:text-sm text-white/40 font-medium">
                                                            {getTimeAgo(notif.created_at)}
                                                        </span>
                                                        {renderLabel(notif.type)}
                                                    </div>
                                                    {notif.type !== 'system' && !notif.is_read && (
                                                        <span className="w-2 h-2 bg-[#D497FF] rounded-full shrink-0 shadow-[0_0_8px_rgba(212,151,255,0.6)]" />
                                                    )}
                                                </div>
                                                {renderContent(notif)}
                                            </div>
                                        </Wrapper>

                                        {notif.type !== 'system' && (
                                            <button
                                                onClick={(e) => deleteNotification(notif.id, e)}
                                                className="absolute top-1/2 -translate-y-1/2 right-4 md:right-6 p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                                                title="Xóa thông báo"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-24 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell size={32} className="text-white/20" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Không có thông báo</h3>
                            <p className="text-zinc-500 max-w-sm mx-auto">Bạn chưa có thông báo nào. Các thông báo mới sẽ xuất hiện ở đây.</p>
                        </div>
                    )}
                </div>

                {/* Phân trang (Pagination) */}
                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl border border-white/10 text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm text-white/60 font-medium">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-xl border border-white/10 text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            <CommonModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAllConfirm}
                title="Xóa tất cả thông báo"
                message="Bạn có chắc chắn muốn xóa TẤT CẢ thông báo cá nhân không? Hành động này không thể hoàn tác."
                confirmText="Xóa tất cả"
                icon={Trash2}
                variant="danger"
            />
        </div>
    );
}
