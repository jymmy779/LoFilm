"use client";

import { useEffect, useState } from "react";
import { User, LogOut, Settings } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { useRouter } from "next/navigation";

interface MemberButtonProps {
    flatten?: boolean;
}

export default function MemberButton({ flatten = false }: MemberButtonProps) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const supabase = createClient();
    const router = useRouter();

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

    const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setShowMenu(false);
        setShowLogoutModal(false);
        setLoading(false);
        router.refresh();
    };

    if (loading && !showLogoutModal) {
        return (
            <div className="w-24 h-10 bg-white/5 animate-pulse rounded-full" />
        );
    }

    if (!user) {
        return (
            <TransitionLink
                href="/dang-nhap"
                className="flex items-center cursor-pointer gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-gradient-to-r from-[#FED877] to-[#F5A623] text-[#0A1628] font-bold text-xs md:text-sm shadow-[0_4px_15px_rgba(245,166,35,0.3)] hover:shadow-[0_8px_25px_rgba(245,166,35,0.5)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 whitespace-nowrap shrink-0 overflow-hidden relative group/btn"
            >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="14" height="14" fill="currentColor" className="relative z-10">
                    <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7c0-98.5-79.8-178.3-178.3-178.3H178.3z" />
                </svg>
                <span className="relative z-10">Đăng nhập</span>
            </TransitionLink>
        );
    }

    const displayName = user.user_metadata?.full_name || user.email?.split("@")[0];

    // Common Logout Confirmation Modal
    const renderLogoutModal = () => (
        <AnimatePresence>
            {showLogoutModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowLogoutModal(false)}
                        className="absolute inset-0 bg-black/85"
                        style={{ willChange: "opacity" }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative w-[90%] max-w-[320px] md:max-w-xs bg-[#111e31] border border-white/10 rounded-2xl p-5 md:p-6 overflow-hidden shadow-2xl"
                        style={{ willChange: "transform, opacity" }}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3 md:mb-4">
                                <LogOut size={20} className="text-red-500 md:w-6 md:h-6" />
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-white mb-1.5 md:mb-2">Đăng xuất?</h3>
                            <p className="text-[11px] md:text-xs text-white/50 mb-5 md:mb-6 px-2 md:px-4 leading-relaxed">
                                Bạn có chắc chắn muốn rời khỏi phiên làm việc này không?
                            </p>
                            <div className="flex w-full gap-2">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 px-3 md:px-4 cursor-pointer py-2 md:py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] md:text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 cursor-pointer px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-red-500 text-[11px] md:text-xs font-bold text-white hover:bg-red-600 transition-all active:scale-95"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    if (flatten) {
        return (
            <>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.05
                            }
                        }
                    }}
                    className="w-full flex flex-col gap-3"
                    style={{ willChange: "transform, opacity" }}
                >
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: { opacity: 1, y: 0 }
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex items-center gap-3 px-1 py-1 rounded-full bg-white/5 border border-white/10 w-max mx-auto shadow-sm"
                        style={{ willChange: "transform, opacity" }}
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm border border-white/20 overflow-hidden shrink-0">
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                displayName.charAt(0).toUpperCase()
                            )}
                        </div>
                        <span className="text-xs font-bold text-white/90 pr-3">{displayName}</span>
                    </motion.div>

                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: { opacity: 1, y: 0 }
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="grid grid-cols-2 gap-2 mt-2"
                        style={{ willChange: "transform, opacity" }}
                    >
                        <TransitionLink
                            href="/trang-ca-nhan"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 hover:bg-white/10 transition-all font-semibold"
                        >
                            <User size={14} className="text-amber-400" />
                            Cá nhân
                        </TransitionLink>
                        <TransitionLink
                            href="/trang-ca-nhan?tab=settings"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 hover:bg-white/10 transition-all font-semibold"
                        >
                            <Settings size={14} className="text-amber-400" />
                            Cài đặt
                        </TransitionLink>
                    </motion.div>

                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: { opacity: 1, y: 0 }
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{ willChange: "transform, opacity" }}
                    >
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 hover:bg-red-500/20 transition-all font-semibold mt-1 cursor-pointer"
                        >
                            <LogOut size={14} />
                            Đăng xuất
                        </button>
                    </motion.div>
                </motion.div>
                {renderLogoutModal()}
            </>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center cursor-pointer gap-2 pr-1 pl-1 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
            >
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm shadow-lg group-hover:scale-105 transition-transform overflow-hidden border border-white/20 shrink-0">
                    {user?.user_metadata?.avatar_url ? (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt={displayName}
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

            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-48 bg-[#0d1b2e] border border-white/10 rounded-2xl shadow-2xl p-2 z-[100] backdrop-blur-xl overflow-hidden"
                    >
                        <div className="px-3 py-2 border-b border-white/5 mb-1">
                            <p className="text-[10px] text-white/40 tracking-widest">Thành viên</p>
                            <p className="text-sm font-bold text-amber-400 truncate mt-1">{displayName}</p>
                        </div>

                        <TransitionLink
                            href="/trang-ca-nhan"
                            onClick={() => setShowMenu(false)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                        >
                            <User size={16} className="text-white/40" />
                            Trang cá nhân
                        </TransitionLink>

                        <TransitionLink
                            href="/trang-ca-nhan?tab=settings"
                            onClick={() => setShowMenu(false)}
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
                    </motion.div>
                )}
            </AnimatePresence>
            {renderLogoutModal()}
        </div>
    );
}
