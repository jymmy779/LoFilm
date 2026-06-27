"use client";

import { useEffect, useState, useRef } from "react";
import { User, LogOut, Settings } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import LogoutModal from "@/app/components/Modals/LogoutModal";
import ComingSoonModal from "@/app/components/Modals/ComingSoonModal";
import { Crown } from "lucide-react";
import Skeleton from "@/app/components/Skeleton/Skeleton";

interface MemberButtonProps {
    flatten?: boolean;
    onClick?: () => void;
}

export default function MemberButton({ flatten = false, onClick }: MemberButtonProps) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            setLoading(false);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside, true);
            document.addEventListener("touchstart", handleClickOutside, { capture: true, passive: true });
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside, true);
            document.removeEventListener("touchstart", handleClickOutside, true);
        };
    }, [showMenu]);

    const handleLogout = async () => {
        if (typeof window !== "undefined" && !navigator.onLine) {
            setShowLogoutModal(false);
            toast.error("Vui lòng kết nối mạng để đăng xuất an toàn!", { id: "logout-error" });
            return;
        }
        setLoading(true);
        await supabase.auth.signOut();
        setUser(null); // Ép state về null ngay lập tức
        setShowMenu(false);
        setShowLogoutModal(false);
        setLoading(false);

        // Làm mới trang hiện tại để cập nhật trạng thái auth mà không chuyển hướng
        window.location.reload();
    };

    if (pathname === '/dang-nhap' || pathname === '/dat-lai-mat-khau') {
        return null;
    }

    if (loading && !showLogoutModal) {
        return (
            <Skeleton className="w-24 h-10" rounded="full" />
        );
    }

    if (!user) {
        return (
            <TransitionLink
                href="/dang-nhap"
                onClick={() => { if (pathname !== "/dang-nhap") onClick?.(); }}
                className="flex items-center cursor-pointer gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-gradient-to-r from-[#FED877] to-[#F5A623] text-[#0A1628] font-bold text-xs md:text-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-300 whitespace-nowrap shrink-0 overflow-hidden relative group/btn"
            >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="14" height="14" fill="currentColor" className="relative z-10">
                    <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7c0-98.5-79.8-178.3-178.3-178.3H178.3z" />
                </svg>
                <span className="relative z-10">Thành viên</span>
            </TransitionLink>
        );
    }

    const displayName = user.user_metadata?.full_name || user.email?.split("@")[0];

    // Using centralized LogoutModal...

    if (flatten) {
        return (
            <>
                <div className="w-full flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-1 py-1 rounded-full bg-white/5 border border-white/10 w-max mx-auto animate-fade-in">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm border border-white/20 overflow-hidden shrink-0">
                            {user?.user_metadata?.avatar_url ? (
                                <Image
                                    src={user.user_metadata.avatar_url}
                                    alt={displayName}
                                    width={36}
                                    height={36}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                displayName.charAt(0).toUpperCase()
                            )}
                        </div>
                        <span className="text-xs font-bold text-white/90 pr-3">{displayName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <TransitionLink
                            href="/trang-ca-nhan"
                            onClick={() => { if (pathname !== "/trang-ca-nhan") { setShowMenu(false); onClick?.(); } }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 hover:bg-white/10 transition-all font-semibold"
                        >
                            <User size={14} className="text-amber-400" />
                            Cá nhân
                        </TransitionLink>
                        <TransitionLink
                            href="/trang-ca-nhan?tab=settings"
                            onClick={() => { if (pathname !== "/trang-ca-nhan?tab=settings") { setShowMenu(false); onClick?.(); } }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 hover:bg-white/10 transition-all font-semibold"
                        >
                            <Settings size={14} className="text-amber-400" />
                            Cài đặt
                        </TransitionLink>
                    </div>

                    <div className="w-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <button
                            onClick={() => setShowPremiumModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-xl text-[11px] text-amber-400 hover:from-amber-500/30 hover:to-amber-600/30 transition-all font-bold cursor-pointer"
                        >
                            <Crown size={14} className="animate-pulse" />
                            NÂNG CẤP LOFILM PREMIUM
                        </button>
                    </div>

                    <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 hover:bg-red-500/20 transition-all font-semibold mt-1 cursor-pointer"
                        >
                            <LogOut size={14} />
                            Đăng xuất
                        </button>
                    </div>
                </div>
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
            </>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center cursor-pointer gap-2 pr-1 pl-1 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
            >
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm transition-all overflow-hidden border border-white/20 shrink-0">
                    {user?.user_metadata?.avatar_url ? (
                        <Image
                            src={user.user_metadata.avatar_url}
                            alt={displayName}
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        displayName.charAt(0).toUpperCase()
                    )}
                </div>
                <span className="hidden md:block text-xs font-semibold text-white/80 max-w-[100px] truncate pr-2">
                    {displayName}
                </span>
            </button>

            {/* Member Dropdown Menu */}
            <div
                className={`absolute right-0 mt-3 w-48 bg-[#0d1b2e] border border-white/10 rounded-2xl p-2 z-[100] overflow-hidden transition-all duration-200 origin-top-right ${
                    showMenu
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-2 scale-[0.98] pointer-events-none"
                }`}
            >
                        <div className="px-3 py-2 border-b border-white/5 mb-1">
                            <p className="text-[10px] text-white/40 tracking-widest uppercase">Thành viên</p>
                            <p className="text-sm font-bold text-white/90 truncate mt-1">{displayName}</p>
                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    setShowPremiumModal(true);
                                }}
                                className="mt-2 flex items-center gap-2 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-bold text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer w-full"
                            >
                                <Crown size={12} className="animate-pulse" />
                                Nâng cấp Premium
                            </button>
                        </div>

                        <TransitionLink
                            href="/trang-ca-nhan"
                            onClick={() => { if (pathname !== "/trang-ca-nhan") { setShowMenu(false); onClick?.(); } }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                        >
                            <User size={16} className="text-white/40" />
                            Trang cá nhân
                        </TransitionLink>

                        <TransitionLink
                            href="/trang-ca-nhan?tab=settings"
                            onClick={() => { if (pathname !== "/trang-ca-nhan?tab=settings") { setShowMenu(false); onClick?.(); } }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                        >
                            <Settings size={16} className="text-white/40" />
                            Cài đặt
                        </TransitionLink>

                        <div className="h-[1px] bg-white/5 my-1 mx-2" />

                        <button
                            onClick={() => {
                                setShowMenu(false);
                                setShowLogoutModal(true);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                        >
                            <LogOut size={16} />
                            Đăng xuất
                        </button>
            </div>
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
            />
            <ComingSoonModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                title="LOFILM Premium"
                message="Tính năng nâng cấp tài khoản Premium đang được hoàn thiện."
            />
        </div>
    );
}
