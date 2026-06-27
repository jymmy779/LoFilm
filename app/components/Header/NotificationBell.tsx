"use client"

import { useState, useEffect, useRef } from "react";
import { Bell, Heart, MessageCircle, Info, ThumbsDown } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

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

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasNew, setHasNew] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const pathname = usePathname();

    const fetchNotifications = async (currentUserId: string | null) => {
        // Fetch System Notifications
        const { data: siteData } = await supabase
            .from('site_notifications')
            .select('*')
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString());

        let formattedSiteData = (siteData || []).map((n: any) => ({
            id: n.id,
            type: 'system',
            message: n.message,
            created_at: n.created_at,
            is_read: false // System notifications use localStorage for read state
        })) as UnifiedNotification[];

        // Fetch User Notifications
        let formattedUserData: UnifiedNotification[] = [];
        if (currentUserId) {
            const { data: userData } = await supabase
                .from('user_notifications')
                .select('*')
                .eq('user_id', currentUserId)
                .order('created_at', { ascending: false })
                .limit(30);

            formattedUserData = (userData || []).map((n: any) => ({
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
        }

        // Merge and sort
        const merged = [...formattedSiteData, ...formattedUserData].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setNotifications(merged);

        // Check for unread
        const lastSeenSystemId = localStorage.getItem('last_seen_notification_id');
        const hasUnreadSystem = formattedSiteData.length > 0 && formattedSiteData[0].id !== lastSeenSystemId;
        const hasUnreadUser = formattedUserData.some(n => !n.is_read);

        setHasNew(hasUnreadSystem || hasUnreadUser);
    };

    useEffect(() => {
        let currentUserId: string | null = null;
        supabase.auth.getUser().then(({ data }) => {
            currentUserId = data?.user?.id || null;
            setUserId(currentUserId);
            fetchNotifications(currentUserId);
        });

        // Realtime for Site Notifications
        const siteChannelName = `site_notifs_${Math.random().toString(36).substring(7)}`;
        const siteChannel = supabase
            .channel(siteChannelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'site_notifications' }, () => {
                fetchNotifications(currentUserId);
            })
            .subscribe();

        // Polling for User Notifications every 60 seconds (thay vì WebSocket)
        // Giúp tiết kiệm cực kỳ nhiều RAM, CPU cho Database và API Quota
        const pollingInterval = setInterval(() => {
            if (currentUserId) {
                fetchNotifications(currentUserId);
            }
        }, 60000);

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside, true);
        document.addEventListener("touchstart", handleClickOutside, { capture: true, passive: true });

        return () => {
            supabase.removeChannel(siteChannel);
            clearInterval(pollingInterval);
            document.removeEventListener("mousedown", handleClickOutside, true);
            document.removeEventListener("touchstart", handleClickOutside, true);
        };
    }, []);

    const toggleDropdown = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && notifications.length > 0) {
            setHasNew(false);
            
            // Mark system as read in localStorage
            const systemNotifs = notifications.filter(n => n.type === 'system');
            if (systemNotifs.length > 0) {
                localStorage.setItem('last_seen_notification_id', systemNotifs[0].id);
            }

            // Mark user notifications as read in DB
            if (userId) {
                const unreadUserNotifs = notifications.filter(n => n.type !== 'system' && !n.is_read);
                if (unreadUserNotifs.length > 0) {
                    await supabase
                        .from('user_notifications')
                        .update({ is_read: true })
                        .eq('user_id', userId)
                        .eq('is_read', false);
                    
                    setNotifications(prev => prev.map(n => n.type !== 'system' ? { ...n, is_read: true } : n));
                }
            }
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "vừa xong";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const renderIcon = (type: string) => {
        switch (type) {
            case 'system': return <Info size={14} className="text-amber-500" />;
            case 'reply': return <MessageCircle size={14} className="text-blue-400" />;
            case 'like': return <Heart size={14} className="text-red-400 fill-red-400" />;
            case 'dislike': return <ThumbsDown size={14} className="text-purple-400" />;
            default: return <Bell size={14} />;
        }
    };

    const renderLabel = (type: string) => {
        switch (type) {
            case 'system': return <span className="text-[10px] md:text-[11px] lg:text-xs font-bold text-amber-500 bg-amber-500/10 px-1.5 md:px-2 py-0.5 rounded ml-2 border border-amber-500/20">Hệ thống</span>;
            default: return <span className="text-[10px] md:text-[11px] lg:text-xs font-bold text-blue-400 bg-blue-500/10 px-1.5 md:px-2 py-0.5 rounded ml-2 border border-blue-500/20">Cá nhân</span>;
        }
    };

    const renderContent = (notif: UnifiedNotification) => {
        if (notif.type === 'system') {
            return (
                <p className="text-[12px] md:text-sm lg:text-[14px] text-white/90 leading-relaxed mt-1 md:mt-1.5">
                    {notif.message}
                </p>
            );
        }

        let actionText = "";
        if (notif.type === 'reply') actionText = "đã trả lời bình luận của bạn";
        if (notif.type === 'like') actionText = "đã thích bình luận của bạn";
        if (notif.type === 'dislike') actionText = "không thích bình luận của bạn";

        return (
            <div className="mt-1 md:mt-1.5">
                <p className="text-[12px] md:text-sm lg:text-[15px] text-white/90 leading-relaxed">
                    <span className="font-bold text-white">{notif.actor_name}</span> {actionText}
                </p>
                {notif.comment_content && (
                    <div className="mt-1.5 md:mt-2 p-2 md:p-2.5 bg-black/20 rounded border border-white/5 border-l-2 border-l-white/20 text-white/50 text-[11px] md:text-[13px] lg:text-sm line-clamp-2 italic">
                        "{notif.comment_content}"
                    </div>
                )}
            </div>
        );
    };

    if (pathname === "/dang-nhap" || pathname === "/dat-lai-mat-khau") {
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-white/70 hover:text-white transition-colors duration-200 focus:outline-none cursor-pointer"
                aria-label="Thông báo"
            >
                <div className={hasNew ? "animate-bell-shake" : ""}>
                    <Bell size={20} className={hasNew ? "text-amber-400" : ""} />
                </div>

                {hasNew && (
                    <span
                        className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0d1b2e] animate-pop-in"
                    />
                )}
            </button>

            <div
                className={`absolute right-[-10px] md:right-0 mt-3 w-[280px] sm:w-[320px] md:w-[360px] lg:w-[420px] xl:w-[460px] bg-[#111e31] border border-white/10 rounded-2xl overflow-hidden z-[100] transition-all duration-200 origin-top-right shadow-xl ${
                    isOpen
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-2 scale-[0.98] pointer-events-none"
                }`}
            >
                <div className="px-4 py-3 md:px-5 md:py-4 lg:py-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h3 className="text-[13px] md:text-[15px] lg:text-base font-bold text-white flex items-center gap-2">
                        Thông báo
                    </h3>
                </div>

                <div className="max-h-[350px] md:max-h-[450px] lg:max-h-[500px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {notifications.map((notif) => {
                                const isTargetPage = notif.movie_slug && pathname === `/phim/${notif.movie_slug}`;
                                const targetUrl = notif.type !== 'system' && notif.movie_slug 
                                    ? `/phim/${notif.movie_slug}${notif.comment_id ? `#comment-${notif.comment_id}` : ''}` 
                                    : '#';
                                    
                                const Wrapper = (notif.type !== 'system' && notif.movie_slug ? Link : "div") as any;
                                
                                const handleNotifClick = (e: React.MouseEvent) => {
                                    setIsOpen(false);
                                    if (isTargetPage && notif.comment_id) {
                                        // Nếu đang ở cùng trang, chặn Next.js route và tự scroll tay cho mượt
                                        e.preventDefault();
                                        const el = document.getElementById(`comment-${notif.comment_id}`);
                                        if (el) {
                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            // Tạo hiệu ứng nháy sáng nhẹ
                                            el.style.transition = 'background-color 0.5s';
                                            const originalBg = el.style.backgroundColor;
                                            el.style.backgroundColor = 'rgba(245, 166, 35, 0.2)'; // amber-500/20
                                            setTimeout(() => {
                                                el.style.backgroundColor = originalBg;
                                            }, 2000);
                                        }
                                    }
                                };

                                const wrapperProps = notif.type !== 'system' && notif.movie_slug 
                                    ? { href: targetUrl, onClick: handleNotifClick } 
                                    : {};

                                return (
                                    <Wrapper
                                        key={notif.id}
                                        {...wrapperProps}
                                        className={`flex gap-3 p-3 md:p-4 hover:bg-white/5 transition-colors group ${
                                            notif.type !== 'system' && !notif.is_read ? 'bg-blue-500/5' : ''
                                        } ${notif.type !== 'system' && notif.movie_slug ? 'cursor-pointer' : 'cursor-default'}`}
                                    >
                                        <div className="shrink-0 mt-0.5 relative">
                                            {notif.type !== 'system' && notif.actor_avatar ? (
                                                <div className="relative w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden border border-white/10">
                                                    <Image src={notif.actor_avatar} alt="Avatar" fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <div className="scale-100 md:scale-110 lg:scale-125">
                                                        {renderIcon(notif.type)}
                                                    </div>
                                                </div>
                                            )}
                                            {notif.type !== 'system' && notif.actor_avatar && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-[#111e31] rounded-full flex items-center justify-center border border-white/10">
                                                    <div className="scale-75 md:scale-90 lg:scale-100">
                                                        {renderIcon(notif.type)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center">
                                                    <span className="text-[10px] md:text-xs lg:text-[13px] text-white/40">
                                                        {getTimeAgo(notif.created_at)}
                                                    </span>
                                                    {renderLabel(notif.type)}
                                                </div>
                                                {notif.type !== 'system' && !notif.is_read && (
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                                )}
                                            </div>
                                            {renderContent(notif)}
                                        </div>
                                    </Wrapper>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 md:py-16 px-6 text-center">
                            <Bell size={32} className="mx-auto text-white/10 mb-3 md:mb-4 md:w-10 md:h-10 lg:w-12 lg:h-12" />
                            <p className="text-xs md:text-sm lg:text-[15px] text-white/40">Hiện chưa có thông báo mới nào</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
