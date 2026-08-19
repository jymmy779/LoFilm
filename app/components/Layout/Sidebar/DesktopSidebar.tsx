"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/User/Auth/AuthContext";
import LoginPromptModal from "@/app/components/UI/Modals/LoginPromptModal";

export default function DesktopSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [optimisticTab, setOptimisticTab] = useState<string | null>(null);

    useEffect(() => {
        setOptimisticTab(null);
    }, [pathname]);

    const activeRoute = optimisticTab ?? pathname;

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
        <aside className="hidden xl:flex flex-col items-center justify-center fixed top-0 left-0 w-[100px] h-screen bg-transparent z-[90] overflow-y-auto custom-scrollbar py-4 pointer-events-none">
            {/* Menu Items */}
            <nav className="flex flex-col items-center w-full gap-2 relative pointer-events-auto">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = item.href 
                        ? (item.href === "/" ? activeRoute === "/" : activeRoute.startsWith(item.href))
                        : false;

                    const content = (
                        <div className={`relative w-[88px] py-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors duration-250 ${
                            isActive
                                ? "text-[#D497FF] font-semibold"
                                : "text-white/70 group-hover:text-white font-medium"
                        }`}>
                            {/* Pure CSS Hardware-Accelerated Smooth Bubble Pop */}
                            {isActive && (
                                <div className="absolute inset-0 bg-[#D497FF]/15 rounded-2xl animate-bubble-pop" />
                            )}
                            <Icon size={25} strokeWidth={isActive ? 2.3 : 1.8} className="relative z-10 transition-colors duration-250" />
                            <span className="relative z-10 text-[13.5px] tracking-normal text-center leading-tight whitespace-nowrap">
                                {item.label}
                            </span>
                        </div>
                    );

                    const className = `group flex items-center justify-center transition-colors duration-250 ${
                        !isActive && "hover:bg-white/5 rounded-2xl"
                    }`;

                    // Protected items (yêu cầu đăng nhập)
                    if (item.protected && !user) {
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    if (isActive) return;
                                    setOptimisticTab(item.href);
                                    setShowLoginPrompt(true);
                                }}
                                className={className}
                            >
                                {content}
                            </button>
                        );
                    }

                    return (
                        <TransitionLink
                            key={index}
                            href={item.href!}
                            onClick={(e) => {
                                if (isActive) { e.preventDefault(); return; }
                                setOptimisticTab(item.href);
                            }}
                            className={className}
                        >
                            {content}
                        </TransitionLink>
                    );
                })}
            </nav>
            <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
        </aside>
    );
}

