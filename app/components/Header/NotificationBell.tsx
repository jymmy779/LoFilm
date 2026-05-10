"use client"

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";

interface Notification {
    id: string;
    message: string;
    type: string;
    created_at: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasNew, setHasNew] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const fetchNotifications = async () => {
        const { data, error } = await supabase
            .from('site_notifications')
            .select('*')
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (!error && data) {
            setNotifications(data);
            
            // Check for new notifications against localStorage
            const lastSeenId = localStorage.getItem('last_seen_notification_id');
            if (data.length > 0 && data[0].id !== lastSeenId) {
                setHasNew(true);
            } else if (data.length === 0) {
                setHasNew(false);
            }
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Optional: Realtime subscription
        const channelName = `site_notifications_${Math.random().toString(36).substring(7)}`;
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'site_notifications' 
            }, (payload) => {
                console.log('Realtime notification received!', payload);
                fetchNotifications();
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Supabase Realtime is active for site_notifications');
                }
            });

        // Click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen && notifications.length > 0) {
            setHasNew(false);
            localStorage.setItem('last_seen_notification_id', notifications[0].id);
        }
    };

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

            {/* Dropdown panel */}
            <div
                className={`absolute right-[-10px] md:right-0 mt-3 w-[260px] xs:w-[280px] md:w-[320px] bg-[#111e31] border border-white/10 rounded-2xl overflow-hidden z-[100] transition-all duration-200 origin-top-right ${
                    isOpen
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-2 scale-[0.98] pointer-events-none"
                }`}
            >
                        <div className="px-4 py-3 md:px-5 md:py-4 border-b border-white/5 bg-white/5">
                            <h3 className="text-[13px] md:text-sm font-bold text-white flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                Thông báo từ LoFilm
                            </h3>
                        </div>

                        <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <div className="p-1 md:p-2">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className="p-3 md:p-4 rounded-xl hover:bg-white/5 transition-colors cursor-default border border-transparent hover:border-white/5 group"
                                        >
                                            <p className="text-[12px] md:text-[13px] text-white/80 leading-relaxed group-hover:text-white">
                                                {notif.message}
                                            </p>
                                            <span className="text-[9px] md:text-[10px] text-white/30 mt-1.5 md:mt-2 block">
                                                {new Date(notif.created_at).toLocaleDateString('vi-VN', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 px-6 text-center">
                                    <Bell size={32} className="mx-auto text-white/10 mb-3" />
                                    <p className="text-xs text-white/40">Hiện chưa có thông báo mới nào</p>
                                </div>
                            )}
                        </div>
            </div>
        </div>
    );
}
