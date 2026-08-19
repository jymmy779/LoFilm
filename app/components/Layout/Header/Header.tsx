"use client"

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Image from "next/image";
import { X, Settings } from "lucide-react";

import { MenuItem } from "./types";
import DropdownMenu from "./DropdownMenu";
import SearchBox from "./SearchBox";
import MemberButton from "./MemberButton";
import NotificationBell from "./NotificationBell";
import MobileBottomSheet from "./MobileBottomSheet";
import { useAuth } from "@/app/components/User/Auth/AuthContext";
import LoginPromptModal from "@/app/components/UI/Modals/LoginPromptModal";
import UtilitySettingsModal from "@/app/components/UI/Modals/UtilitySettingsModal";

import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export default function Header() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const hasSearchQuery = !!searchParams.get("search");
    const [categories, setCategories] = useState<MenuItem[]>([]);
    const [countries, setCountries] = useState<MenuItem[]>([]);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [loginPromptSource, setLoginPromptSource] = useState<"history" | "account" | "watchlist" | "playlist" | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        setIsMounted(true);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        const handleResize = () => {
            if (window.innerWidth >= 1280) { // xl breakpoint matches DesktopSidebar
                setIsSearchActive(false);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize, { passive: true });

        axios.get<MenuItem[]>(`/api/proxy?url=${encodeURIComponent(`${INTERNAL_API_URL}/the-loai`)}&revalidate=86400`)
            .then((res) => {
                const items = (res.data as any).data?.items || (res.data as any).items || res.data;
                setCategories(Array.isArray(items) ? items : []);
            })
            .catch((err) => console.error("Lỗi fetch thể loại:", err));

        axios.get<MenuItem[]>(`/api/proxy?url=${encodeURIComponent(`${INTERNAL_API_URL}/quoc-gia`)}&revalidate=86400`)
            .then((res) => {
                const items = (res.data as any).data?.items || (res.data as any).items || res.data;
                setCountries(Array.isArray(items) ? items : []);
            })
            .catch((err) => console.error("Lỗi fetch quốc gia:", err));

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        if (isMenuOpen) {
            html.classList.add("no-scroll");
            body.classList.add("no-scroll");
        } else {
            html.classList.remove("no-scroll");
            body.classList.remove("no-scroll");
        }
        return () => {
            html.classList.remove("no-scroll");
            body.classList.remove("no-scroll");
        };
    }, [isMenuOpen]);


    const dropdownProps = { activeMenu, setActiveMenu, closeTimeout };

    const navLinks = [
        { href: "/danh-sach/phim-bo", label: "Phim bộ" },
        { href: "/danh-sach/phim-le", label: "Phim lẻ" },
    ];

    const extraCategories: MenuItem[] = [
        { _id: "hoat-hinh", name: "Hoạt hình", slug: "hoat-hinh" },
        { _id: "tv-shows", name: "TV Shows", slug: "tv-shows" },
        { _id: "phim-chieu-rap", name: "Phim chiếu rạp", slug: "phim-chieu-rap" },
    ];

    const showBackground = isScrolled || isMenuOpen;
    const isKhamPhaActive = (pathname.startsWith('/danh-sach/') && pathname !== '/danh-sach/phim-chieu-rap') || pathname.startsWith('/the-loai/') || pathname.startsWith('/quoc-gia/') || hasSearchQuery;

    return (
        <>
            <header className={`w-full fixed top-0 left-0 z-[100] py-2 xl:px-5 [@supports(-webkit-touch-callout:none)]:pt-[max(env(safe-area-inset-top),12px)] border-none ${isMenuOpen ? "" : "transition-all duration-300"} border-b ${showBackground ? "bg-[#0F1115]/90 backdrop-blur-md" : "bg-transparent border-transparent"}`}>
                <div className="flex items-center justify-between h-[54px] md:h-[64px] w-full max-w-[1900px] mx-auto px-4 xl:px-0 gap-4 md:gap-8">
                    <div className="flex xl:hidden items-center justify-between w-full h-full gap-3">
                        <div className="relative flex-1 h-full flex items-center">
                            <div className={`items-center gap-2 md:gap-4 shrink-0 ${isSearchActive ? "hidden md:flex" : "flex animate-fade-in"}`}>
                                <button
                                    onClick={() => setIsMenuOpen(true)}
                                    className="p-1.5 -ml-1.5 text-white/80 hover:text-white transition-colors"
                                    aria-label="Mở menu"
                                >
                                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                    </svg>
                                </button>
                                <TransitionLink href="/" className="shrink-0">
                                    <Image
                                        width={140}
                                        height={70}
                                        className="h-[50px] md:h-[65px] w-auto object-contain"
                                        style={{ maxWidth: '140px', maxHeight: '65px' }}
                                        src="/images/lofilm_logo.webp"
                                        alt="LoFilm - Xem Phim Online Chất Lượng Cao | Phim 4K Vietsub Miễn Phí"
                                        priority
                                        unoptimized
                                        sizes="(max-width: 768px) 140px, 140px"
                                    />
                                </TransitionLink>
                            </div>
                            <div className={`flex-1 md:block md:ml-4 lg:ml-8 ${isSearchActive ? "block animate-reveal-left" : "hidden"}`}>
                                <SearchBox autoFocus={isSearchActive} />
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="p-2 cursor-pointer text-white/60 hover:text-white transition-colors shrink-0 flex items-center justify-center w-10 h-10"
                                aria-label="Cài đặt tiện ích"
                            >
                                <Settings size={22} />
                            </button>
                            <NotificationBell />
                            <button
                                onClick={() => {
                                    setIsSearchActive(!isSearchActive);
                                    setIsMenuOpen(false);
                                }}
                                className="p-2 cursor-pointer text-white/60 hover:text-white transition-colors shrink-0 flex items-center justify-center w-10 h-10 md:hidden"
                                aria-label={isSearchActive ? "Đóng tìm kiếm" : "Mở tìm kiếm"}
                            >
                                <div className="relative w-10 h-10 flex items-center justify-center">
                                    {/* Search Icon */}
                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isSearchActive ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`}>
                                        <svg viewBox="0 0 512 512" width="20" height="20" fill="currentColor">
                                            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                                        </svg>
                                    </div>
                                    {/* Close Icon */}
                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isSearchActive ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`}>
                                        <X size={22} strokeWidth={2.5} />
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="hidden xl:flex items-center justify-between w-full h-full">
                        <div className="flex items-center gap-2 flex-1">
                            <TransitionLink href="/" className="shrink-0">
                                <Image
                                    width={150}
                                    height={80}
                                    className="h-[50px] xl:h-[55px] 2xl:h-[65px] w-auto object-contain transition-all duration-300"
                                    style={{ maxWidth: '150px', maxHeight: '65px' }}
                                    src="/images/lofilm_logo.webp"
                                    alt="LoFilm - Xem Phim Online Chất Lượng Cao"
                                    priority
                                    unoptimized
                                />
                            </TransitionLink>

                            <div className="md:ml-4 w-full max-w-[320px]">
                                <SearchBox />
                            </div>

                            <nav className="flex items-center gap-8">
                                {navLinks.map((item) => (
                                    <TransitionLink key={item.href} href={item.href} className=" font-medium text-white hover:text-[#D497FF] transition-colors duration-150 whitespace-nowrap">
                                        {item.label}
                                    </TransitionLink>
                                ))}

                                <DropdownMenu
                                    id="categories"
                                    label="Thể loại"
                                    items={categories}
                                    hrefPrefix="/the-loai"
                                    {...dropdownProps}
                                />
                                <DropdownMenu
                                    id="countries"
                                    label="Quốc gia"
                                    items={countries}
                                    hrefPrefix="/quoc-gia"
                                    {...dropdownProps}
                                />
                                <DropdownMenu
                                    id="extra"
                                    label="Thêm"
                                    items={extraCategories}
                                    hrefPrefix="/danh-sach"
                                    columns={1}
                                    {...dropdownProps}
                                />

                            </nav>
                        </div>

                        <div className="flex items-center gap-2 xl:gap-4 shrink-0">
                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="p-2 cursor-pointer text-white/60 hover:text-white transition-colors shrink-0 flex items-center justify-center w-10 h-10 hidden xl:flex"
                                aria-label="Cài đặt tiện ích"
                            >
                                <Settings size={22} />
                            </button>
                            <NotificationBell />
                            <MemberButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Sheet Menu */}
            <MobileBottomSheet
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                categories={categories}
                countries={countries}
            />

            {/* Mobile Bottom Navigation Pill (Chỉ hiện trên màn hình < xl) */}
            <div className="xl:hidden fixed bottom-5 md:bottom-8 left-1/2 -translate-x-1/2 z-[90] w-full px-4 max-w-[440px] pointer-events-none">
                {/* Solid Pill with Transparent Cutout (No Blur for Performance) */}
                <div
                    className="relative w-full h-[66px] bg-[#1e2129] border border-[#2a2e39] shadow-[0_16px_40px_rgba(0,0,0,0.9)] flex items-center justify-between px-3 pointer-events-auto"
                    style={{
                        maskImage: 'radial-gradient(circle at 50% 8px, transparent 34px, black 34.5px)',
                        WebkitMaskImage: 'radial-gradient(circle at 50% 8px, transparent 34px, black 34.5px)',
                        borderRadius: '33px'
                    }}
                >
                    {/* Left Items */}
                    <div className="flex items-center w-[42%] justify-between pr-2">
                        <TransitionLink href="/danh-sach/phim-moi" className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl group">
                            {/* Inactive State */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-[opacity,transform] duration-300 ease-out text-white/60 group-hover:text-white ${isKhamPhaActive ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                                <svg className="transition-transform duration-300 ease-out scale-100" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
                                <span className="text-[9px] font-medium tracking-wide opacity-80">Khám phá</span>
                            </div>
                            {/* Active State */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-[opacity,transform] duration-300 ease-out text-[#D497FF] will-change-transform ${isKhamPhaActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                                <svg className="transition-transform duration-300 ease-out scale-110 -translate-y-0.5" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
                                <span className="text-[9px] font-bold tracking-wide">Khám phá</span>
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#D497FF] shadow-[0_0_8px_#D497FF]" />
                            </div>
                        </TransitionLink>

                        <button onClick={() => { if (user) router.push('/thu-vien'); else { setLoginPromptSource("playlist"); setShowLoginPrompt(true); } }} className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl group">
                            {/* Inactive State */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-[opacity,transform] duration-300 ease-out text-white/60 group-hover:text-white ${pathname === '/thu-vien' ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                                <svg className="transition-transform duration-300 ease-out scale-100" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>
                                <span className="text-[9px] font-medium tracking-wide opacity-80">Playlist</span>
                            </div>
                            {/* Active State */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-[opacity,transform] duration-300 ease-out text-[#D497FF] will-change-transform ${pathname === '/thu-vien' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                                <svg className="transition-transform duration-300 ease-out scale-110 -translate-y-0.5" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>
                                <span className="text-[9px] font-bold tracking-wide">Playlist</span>
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#D497FF] shadow-[0_0_8px_#D497FF]" />
                            </div>
                        </button>
                    </div>

                    {/* Right Items */}
                    <div className="flex items-center w-[42%] justify-between pl-2">
                        <TransitionLink href="/danh-sach/phim-chieu-rap" className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl group">
                            {/* Inactive State */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-[opacity,transform] duration-300 ease-out text-white/60 group-hover:text-white ${pathname === '/danh-sach/phim-chieu-rap' ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                                <svg className="transition-transform duration-300 ease-out scale-100" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
                                <span className="text-[9px] font-medium tracking-wide opacity-80">Lịch chiếu</span>
                            </div>
                            {/* Active State */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-[opacity,transform] duration-300 ease-out text-[#D497FF] will-change-transform ${pathname === '/danh-sach/phim-chieu-rap' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                                <svg className="transition-transform duration-300 ease-out scale-110 -translate-y-0.5" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
                                <span className="text-[9px] font-bold tracking-wide">Lịch chiếu</span>
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#D497FF] shadow-[0_0_8px_#D497FF]" />
                            </div>
                        </TransitionLink>

                        <button onClick={() => { if (user) router.push('/ca-nhan'); else { setLoginPromptSource("account"); setShowLoginPrompt(true); } }} className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl group">
                            {/* Inactive State */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-[opacity,transform] duration-300 ease-out text-white/60 group-hover:text-white ${pathname === '/ca-nhan' && !isMenuOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                                {isMounted && user ? (
                                    user?.user_metadata?.avatar_url ? (
                                        <div className="w-[22px] h-[22px] rounded-full overflow-hidden border border-white/40 scale-100">
                                            <Image src={user.user_metadata.avatar_url} alt="Avatar" width={22} height={22} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-[22px] h-[22px] rounded-full overflow-hidden border border-white/40 scale-100 bg-gradient-to-br from-[#D497FF] to-[#8B5CF6] flex items-center justify-center text-black text-[11px] font-bold">
                                            {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                                        </div>
                                    )
                                ) : (
                                    <svg className="scale-100" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                )}
                                <span className="text-[9px] font-medium tracking-wide opacity-80">Cá nhân</span>
                            </div>

                            {/* Active State */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-[opacity,transform] duration-300 ease-out text-[#D497FF] will-change-transform ${pathname === '/ca-nhan' && !isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                                {isMounted && user ? (
                                    user?.user_metadata?.avatar_url ? (
                                        <div className="w-[22px] h-[22px] rounded-full overflow-hidden border border-[#D497FF] scale-110 -translate-y-0.5">
                                            <Image src={user.user_metadata.avatar_url} alt="Avatar" width={22} height={22} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-[22px] h-[22px] rounded-full overflow-hidden border border-[#D497FF] scale-110 -translate-y-0.5 bg-gradient-to-br from-[#D497FF] to-[#8B5CF6] flex items-center justify-center text-black text-[11px] font-bold">
                                            {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                                        </div>
                                    )
                                ) : (
                                    <svg className="scale-110 -translate-y-0.5" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                )}
                                <span className="text-[9px] font-bold tracking-wide">Cá nhân</span>
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#D497FF] shadow-[0_0_8px_#D497FF]" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Center Floating Home Button (Outside the masked pill) */}
                <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-auto" style={{ top: '-20px' }}>
                    <TransitionLink href="/" className={`group relative flex items-center justify-center w-[56px] h-[56px] rounded-full transition-transform duration-300 ease-out will-change-transform ${pathname === '/' && !hasSearchQuery && !isMenuOpen ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}>
                        {/* Inactive Background */}
                        <div className={`absolute inset-0 rounded-full bg-[#2a2e39] border border-white/5 shadow-[0_8px_20px_rgba(0,0,0,0.6)] transition-[opacity,transform] duration-300 ease-out ${pathname === '/' && !hasSearchQuery && !isMenuOpen ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} />

                        {/* Active Gradient Background */}
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-[#C084FC] to-[#D497FF] shadow-[0_8px_24px_rgba(212,151,255,0.5)] transition-[opacity,transform] duration-300 ease-out ${pathname === '/' && !hasSearchQuery && !isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />

                        {/* Inactive Icon */}
                        <svg className={`absolute z-10 transition-all duration-300 ease-out text-white/90 group-hover:text-[#D497FF] ${pathname === '/' && !hasSearchQuery && !isMenuOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>

                        {/* Active Icon */}
                        <svg className={`absolute z-10 transition-all duration-300 ease-out text-black ${pathname === '/' && !hasSearchQuery && !isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </TransitionLink>
                </div>
            </div>
            <LoginPromptModal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
            />

            <UtilitySettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </>
    );
}

