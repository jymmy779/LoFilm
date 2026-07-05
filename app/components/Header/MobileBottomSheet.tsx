"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import TransitionLink from "../Transition/TransitionLink";
import { X, Home, SlidersHorizontal, CalendarDays, User, Shuffle, MessageSquare, List, Grid, Globe, ChevronRight, ChevronLeft } from "lucide-react";
import { MenuItem } from "./types";
import toast from "react-hot-toast";
import { useAuth } from "@/app/components/Auth/AuthContext";
import LoginPromptModal from "@/app/components/Modals/LoginPromptModal";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    categories: MenuItem[];
    countries: MenuItem[];
}

type ViewType = 'main' | 'types' | 'categories' | 'countries';

export default function MobileBottomSheet({ isOpen, onClose, categories, countries }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<ViewType>('main');
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const handleRandomMovie = async () => {
        try {
            toast.loading("Đang tìm phim ngẫu nhiên...", { id: "random-movie" });
            const randomPage = Math.floor(Math.random() * 50) + 1;
            const res = await fetch(`https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=${randomPage}&limit=10`);
            const data = await res.json();
            const items = data.items || data.data?.items || [];
            if (items.length > 0) {
                const randomMovie = items[Math.floor(Math.random() * items.length)];
                toast.dismiss("random-movie");
                onClose();
                router.push(`/phim/${randomMovie.slug}`);
            } else {
                throw new Error("No movies found");
            }
        } catch (error) {
            toast.dismiss("random-movie");
            toast.error("Không thể tải phim ngẫu nhiên lúc này!");
        }
    };

    useEffect(() => {
        if (!isOpen) {
            // Reset view when closing sheet
            const timer = setTimeout(() => setActiveView('main'), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleLinkClick = (href: string) => {
        if (pathname !== href) onClose();
    };

    const quickLinks = [
        { icon: Home, label: "Trang chủ", href: "/" },
        { icon: SlidersHorizontal, label: "Lọc phim", href: "/danh-sach/phim-moi" },
        { icon: CalendarDays, label: "Lịch chiếu", href: "/danh-sach/phim-chieu-rap" },
        {
            icon: User, label: "Tài khoản", action: () => {
                if (user) {
                    onClose();
                    router.push("/trang-ca-nhan");
                } else {
                    setShowLoginPrompt(true);
                }
            }
        },
    ];

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 z-[110] bg-black/80 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            {/* Bottom Sheet */}
            <div
                className={`fixed bottom-0 left-0 w-full z-[120] bg-[#111e31] rounded-t-3xl overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ease-out max-h-[85vh] ${isOpen ? "translate-y-0" : "translate-y-full"
                    }`}
            >
                {/* Drag Handle & Header */}
                <div className="flex flex-col items-center pt-3 pb-2 px-5 border-b border-white/5 relative shrink-0">
                    <div className="w-12 h-1 bg-white/20 rounded-full mb-4" />
                    <div className="w-full flex items-center justify-between">
                        {activeView === 'main' ? (
                            <h3 className="text-amber-400 font-semibold text-lg animate-fade-in">Khám phá nhanh</h3>
                        ) : (
                            <button onClick={() => setActiveView('main')} className="flex items-center gap-1 text-amber-400 font-semibold text-lg hover:text-amber-300 transition-colors animate-reveal-left">
                                <ChevronLeft size={22} className="-ml-1" />
                                <h3>
                                    {activeView === 'types' && "Loại Phim"}
                                    {activeView === 'categories' && "Thể Loại"}
                                    {activeView === 'countries' && "Quốc Gia"}
                                </h3>
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-5 flex-1 pb-10 overflow-auto relative">

                    {/* --- MAIN VIEW --- */}
                    {activeView === 'main' && (
                        <div className="animate-reveal-left">
                            {/* Quick Explore Grid */}
                            <div className="grid grid-cols-4 gap-2 mb-8">
                                {quickLinks.map((item, index) => {
                                    const Icon = item.icon;
                                    const content = (
                                        <div className="flex flex-col items-center justify-center gap-1.5 bg-white/5 rounded-xl p-2 aspect-square hover:bg-white/10 transition-colors">
                                            <Icon size={20} className="text-white/80" strokeWidth={1.5} />
                                            <span className="text-[10px] text-white/60 text-center leading-tight">{item.label}</span>
                                        </div>
                                    );

                                    if (item.action) {
                                        return (
                                            <button key={index} onClick={item.action} className="w-full">
                                                {content}
                                            </button>
                                        );
                                    }

                                    return (
                                        <TransitionLink key={index} href={item.href!} onClick={() => handleLinkClick(item.href!)} className="w-full">
                                            {content}
                                        </TransitionLink>
                                    );
                                })}
                            </div>

                            {/* Navigation List */}
                            <div className="flex flex-col gap-1">
                                {/* Random Movie */}
                                <button onClick={handleRandomMovie} className="flex items-center justify-between py-3.5 px-2 hover:bg-white/5 rounded-xl transition-colors w-full">
                                    <div className="flex items-center gap-3 text-white/90">
                                        <Shuffle size={18} className="text-amber-400" />
                                        <span className="font-medium text-[15px]">Xem phim ngẫu nhiên</span>
                                    </div>
                                    <ChevronRight size={16} className="text-amber-400" />
                                </button>

                                {/* Request Movie */}
                                <TransitionLink href="/lien-he" onClick={() => handleLinkClick("/lien-he")} className="flex items-center justify-between py-3.5 px-2 hover:bg-white/5 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3 text-white/90">
                                        <MessageSquare size={18} className="text-amber-400" />
                                        <span className="font-medium text-[15px]">Yêu cầu phim</span>
                                    </div>
                                    <ChevronRight size={16} className="text-amber-400" />
                                </TransitionLink>

                                {/* Loại Phim Button */}
                                <button onClick={() => setActiveView('types')} className="flex items-center justify-between py-3.5 px-2 hover:bg-white/5 rounded-xl transition-colors w-full">
                                    <div className="flex items-center gap-3 text-white/90">
                                        <List size={18} className="text-amber-400" />
                                        <span className="font-medium text-[15px]">Loại Phim</span>
                                    </div>
                                    <ChevronRight size={16} className="text-amber-400" />
                                </button>

                                {/* Thể Loại Button */}
                                <button onClick={() => setActiveView('categories')} className="flex items-center justify-between py-3.5 px-2 hover:bg-white/5 rounded-xl transition-colors w-full">
                                    <div className="flex items-center gap-3 text-white/90">
                                        <Grid size={18} className="text-amber-400" />
                                        <span className="font-medium text-[15px]">Thể Loại</span>
                                    </div>
                                    <ChevronRight size={16} className="text-amber-400" />
                                </button>

                                {/* Quốc Gia Button */}
                                <button onClick={() => setActiveView('countries')} className="flex items-center justify-between py-3.5 px-2 hover:bg-white/5 rounded-xl transition-colors w-full">
                                    <div className="flex items-center gap-3 text-white/90">
                                        <Globe size={18} className="text-amber-400" />
                                        <span className="font-medium text-[15px]">Quốc Gia</span>
                                    </div>
                                    <ChevronRight size={16} className="text-amber-400" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- TYPES VIEW --- */}
                    {activeView === 'types' && (
                        <div className="animate-reveal-right flex flex-col gap-2">
                            <TransitionLink href="/danh-sach/phim-le" onClick={() => handleLinkClick("/danh-sach/phim-le")} className="flex items-center p-3 hover:bg-white/5 rounded-xl text-white/80 hover:text-amber-400 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50 mr-3" />
                                <span className="text-[15px]">Phim Lẻ</span>
                            </TransitionLink>
                            <TransitionLink href="/danh-sach/phim-bo" onClick={() => handleLinkClick("/danh-sach/phim-bo")} className="flex items-center p-3 hover:bg-white/5 rounded-xl text-white/80 hover:text-amber-400 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50 mr-3" />
                                <span className="text-[15px]">Phim Bộ</span>
                            </TransitionLink>
                            <TransitionLink href="/danh-sach/phim-chieu-rap" onClick={() => handleLinkClick("/danh-sach/phim-chieu-rap")} className="flex items-center p-3 hover:bg-white/5 rounded-xl text-white/80 hover:text-amber-400 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50 mr-3" />
                                <span className="text-[15px]">Phim Chiếu Rạp</span>
                            </TransitionLink>
                            <TransitionLink href="/danh-sach/hoat-hinh" onClick={() => handleLinkClick("/danh-sach/hoat-hinh")} className="flex items-center p-3 hover:bg-white/5 rounded-xl text-white/80 hover:text-amber-400 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50 mr-3" />
                                <span className="text-[15px]">Hoạt Hình</span>
                            </TransitionLink>
                            <TransitionLink href="/danh-sach/tv-shows" onClick={() => handleLinkClick("/danh-sach/tv-shows")} className="flex items-center p-3 hover:bg-white/5 rounded-xl text-white/80 hover:text-amber-400 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50 mr-3" />
                                <span className="text-[15px]">TV Shows</span>
                            </TransitionLink>
                        </div>
                    )}

                    {/* --- CATEGORIES VIEW --- */}
                    {activeView === 'categories' && (
                        <div className="animate-reveal-right grid grid-cols-2 gap-2">
                            {categories.map(cat => (
                                <TransitionLink key={cat._id} href={`/the-loai/${cat.slug}`} onClick={() => handleLinkClick(`/the-loai/${cat.slug}`)} className="flex items-center p-3 hover:bg-white/5 rounded-xl text-white/80 hover:text-amber-400 transition-colors">
                                    <span className="text-[14px] truncate">{cat.name}</span>
                                </TransitionLink>
                            ))}
                        </div>
                    )}

                    {/* --- COUNTRIES VIEW --- */}
                    {activeView === 'countries' && (
                        <div className="animate-reveal-right grid grid-cols-2 gap-2">
                            {countries.map(country => (
                                <TransitionLink key={country._id} href={`/quoc-gia/${country.slug}`} onClick={() => handleLinkClick(`/quoc-gia/${country.slug}`)} className="flex items-center p-3 hover:bg-white/5 rounded-xl text-white/80 hover:text-amber-400 transition-colors">
                                    <span className="text-[14px] truncate">{country.name}</span>
                                </TransitionLink>
                            ))}
                        </div>
                    )}

                </div>
            </div>
            <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
        </>
    );
}
