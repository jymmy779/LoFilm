"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";

import { Bell, Heart, MessageCircle, Info, ThumbsDown, Trash2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import CommonModal from "@/app/components/UI/Modals/CommonModal";

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
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const fetchNotifications = async (page: number) => {
        if (!user?.id) return;
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
                .eq('user_id', user.id)
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
                const unreadUserData = formattedUserData.some(n => !n.is_read);
                if (unreadUserData) {
                    supabase
                        .from('user_notifications')
                        .update({ is_read: true })
                        .eq('user_id', user.id)
                        .eq('is_read', false)
                        .then(() => {
                            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                        });
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
        }
    }, [user, currentPage]);

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
            case 'reply': return <MessageCircle size={14} className="text-blue-500 fill-blue-500" />;
            case 'system': return <Info size={14} className="text-amber-500" />;
            default: return <Bell size={14} />;
        }
    };

    const renderLabel = (type: string) => {
        switch (type) {
            case 'like': return <span className="text-rose-500 text-[11px] md:text-xs font-semibold uppercase tracking-wider ml-2">Thích</span>;
            case 'dislike': return <span className="text-zinc-400 text-[11px] md:text-xs font-semibold uppercase tracking-wider ml-2">Không thích</span>;
            case 'reply': return <span className="text-blue-500 text-[11px] md:text-xs font-semibold uppercase tracking-wider ml-2">Phản hồi</span>;
            case 'system': return <span className="text-amber-500 text-[11px] md:text-xs font-semibold uppercase tracking-wider ml-2">Hệ thống</span>;
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

    if (!user) {
        return (
            <div className="min-h-screen pt-24 pb-10 flex items-center justify-center">
                <div className="text-center text-white/50">Vui lòng đăng nhập để xem thông báo.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 md:pt-28 pb-20 bg-zinc-950">
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
                        <div className="py-20 text-center text-zinc-500 flex flex-col items-center">
                            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
                            Đang tải thông báo...
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
                                            className={`flex gap-3 md:gap-5 p-4 md:p-6 transition-colors ${
                                                notif.type !== 'system' && !notif.is_read ? 'bg-blue-500/5 hover:bg-blue-500/10' : 'hover:bg-white/5'
                                            } ${notif.type !== 'system' && notif.movie_slug ? 'cursor-pointer' : 'cursor-default'}`}
                                        >
                                            <div className="shrink-0 mt-1 relative">
                                                {notif.type !== 'system' && notif.actor_avatar ? (
                                                    <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border border-white/10 shadow-lg">
                                                        <Image src={notif.actor_avatar} alt="Avatar" fill className="object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                                                        <div className="scale-125 md:scale-150">
                                                            {renderIcon(notif.type)}
                                                        </div>
                                                    </div>
                                                )}
                                                {notif.type !== 'system' && notif.actor_avatar && (
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-[#0F1115] rounded-full flex items-center justify-center border border-white/10 shadow-sm">
                                                        {renderIcon(notif.type)}
                                                    </div>
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
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
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
