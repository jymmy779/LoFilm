"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
    Home,
    Tv,
    MonitorPlay,
    Search,
    Hash,
    Library,
    History
} from "lucide-react";
import TransitionLink from "../../UI/Transition/TransitionLink";
import toast from "react-hot-toast";
import { useState } from "react";
import { useAuth } from "@/app/components/User/Auth/AuthContext";
import LoginPromptModal from "@/app/components/UI/Modals/LoginPromptModal";

export default function DesktopSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const menuItems = [
        { icon: Home, label: "Trang chủ", href: "/" },
        { icon: Tv, label: "Phim Hàn", href: "/quoc-gia/han-quoc" },
        { icon: MonitorPlay, label: "Phim Trung", href: "/quoc-gia/trung-quoc" },
        { icon: Search, label: "Duyệt Tìm", href: "/danh-sach/phim-moi" },
        { icon: Hash, label: "Chủ đề", href: "/chu-de" },
        { icon: Library, label: "Playlist", href: "/thu-vien", protected: true },
        { icon: History, label: "Lịch sử", href: "/lich-su", protected: true },
    ];

    return (
        <aside className="hidden xl:flex flex-col items-center justify-center fixed top-0 left-0 w-[100px] h-screen bg-transparent z-[90] overflow-y-auto custom-scrollbar py-4">
            {/* Menu Items */}
            <nav className="flex flex-col items-center w-full gap-2 relative">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = item.href ? pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) : false;

                    const content = (
                        <div className="relative w-[84px] py-4 flex items-center justify-center z-10 cursor-pointer">
                            <div className={`absolute inset-0 bg-amber-400/10 rounded-2xl z-[-1] transition-all duration-300 ease-out ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />
                            <div className={`flex flex-col items-center gap-1.5 transition-colors ${isActive ? "text-amber-400" : "text-white/50 group-hover:text-white"}`}>
                                <Icon size={26} strokeWidth={isActive ? 2.5 : 1.5} className={`mb-0.5 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'scale-100'}`} />
                                <span className={`text-[11px] font-medium tracking-wide text-center leading-tight transition-all duration-300 ${isActive ? 'translate-y-0.5' : ''}`}>
                                    {item.label}
                                </span>
                            </div>
                        </div>
                    );

                    const className = `group flex items-center justify-center transition-all ${!isActive && "hover:bg-white/5 rounded-2xl"
                        }`;



                    // Protected items (yêu cầu đăng nhập)
                    if (item.protected && !user) {
                        return (
                            <button key={index} onClick={() => setShowLoginPrompt(true)} className={className}>
                                {content}
                            </button>
                        );
                    }

                    return (
                        <TransitionLink key={index} href={item.href!} className={className}>
                            {content}
                        </TransitionLink>
                    );
                })}
            </nav>
            <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
        </aside>
    );
}
