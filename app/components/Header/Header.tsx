"use client"

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import TransitionLink from "@/app/components/Transition/TransitionLink";
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
import { useAuth } from "@/app/components/Auth/AuthContext";
import LoginPromptModal from "@/app/components/Modals/LoginPromptModal";
import UtilitySettingsModal from "@/app/components/Modals/UtilitySettingsModal";

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
    const [loginPromptSource, setLoginPromptSource] = useState<"history" | "account" | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
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

        axios.get<MenuItem[]>(`/api/proxy?url=${encodeURIComponent("https://phimapi.com/the-loai")}&revalidate=86400`)
            .then((res) => {
                // Proxy returns data directly, but we need to handle the format
                const items = (res.data as any).data?.items || res.data;
                setCategories(Array.isArray(items) ? items : []);
            })
            .catch((err) => console.error("Lỗi fetch thể loại:", err));

        axios.get<MenuItem[]>(`/api/proxy?url=${encodeURIComponent("https://phimapi.com/quoc-gia")}&revalidate=86400`)
            .then((res) => {
                const items = (res.data as any).data?.items || res.data;
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

    return (
        <>
            <header className={`w-full fixed top-0 left-0 z-[100] py-2 xl:px-5 [@supports(-webkit-touch-callout:none)]:pt-[max(env(safe-area-inset-top),12px)] border-none ${isMenuOpen ? "" : "transition-all duration-300"} border-b ${showBackground ? "bg-[#0F1115]/90 backdrop-blur-md" : "bg-transparent border-transparent"}`}>
                <div className="flex items-center justify-between h-[54px] md:h-[64px] w-full max-w-[1900px] mx-auto px-4 xl:px-0 gap-4 md:gap-8">
                    <div className="flex xl:hidden items-center justify-between w-full h-full gap-3">
                        <div className="relative flex-1 h-full flex items-center">
                            <div className={`items-center gap-2 shrink-0 ${isSearchActive ? "hidden" : "flex animate-fade-in"}`}>
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
                                        src="/images/lofilm_logo.webp"
                                        alt="LoFilm - Xem Phim Online Chất Lượng Cao | Phim 4K Vietsub Miễn Phí"
                                        priority
                                        unoptimized
                                        sizes="(max-width: 768px) 140px, 140px"
                                    />
                                </TransitionLink>
                            </div>
                            <div className={`flex-1 ${isSearchActive ? "block animate-reveal-left" : "hidden"}`}>
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
                                className="p-2 cursor-pointer text-white/60 hover:text-white transition-colors shrink-0 flex items-center justify-center w-10 h-10"
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
                                    <TransitionLink key={item.href} href={item.href} className=" font-medium text-white/80 hover:text-amber-400 transition-colors duration-150 whitespace-nowrap">
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
            <div className="xl:hidden fixed bottom-5 md:bottom-8 left-1/2 -translate-x-1/2 z-[90] w-[92%] sm:w-[85%] max-w-[300px] h-[60px] bg-[#0F1115] border border-white/10 rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex items-center justify-between px-2">
                <TransitionLink href="/" className={`relative w-[64px] h-[48px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors z-10 ${pathname === '/' && !hasSearchQuery && !isMenuOpen ? 'text-amber-400' : 'text-white/50 hover:text-amber-400'}`}>
                    {pathname === '/' && !hasSearchQuery && !isMenuOpen && (
                        <div className="absolute inset-0 bg-amber-400/10 rounded-full z-[-1]" />
                    )}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    <span className="text-[9px] font-bold tracking-wide">Trang chủ</span>
                </TransitionLink>

                <TransitionLink href="/danh-sach/phim-moi" className={`relative w-[64px] h-[48px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer z-10 ${pathname.startsWith('/danh-sach/') || pathname.startsWith('/the-loai/') || pathname.startsWith('/quoc-gia/') || hasSearchQuery ? 'text-amber-400' : 'text-white/50 hover:text-amber-400'}`}>
                    {(pathname.startsWith('/danh-sach/') || pathname.startsWith('/the-loai/') || pathname.startsWith('/quoc-gia/') || hasSearchQuery) && (
                        <div className="absolute inset-0 bg-amber-400/10 rounded-full z-[-1]" />
                    )}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
                    <span className="text-[9px] font-bold tracking-wide">Khám phá</span>
                </TransitionLink>

                <button
                    onClick={() => {
                        if (user) {
                            router.push("/trang-ca-nhan?tab=history");
                        } else {
                            setLoginPromptSource("history");
                            setShowLoginPrompt(true);
                        }
                    }}
                    className={`relative w-[64px] h-[48px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer z-10 ${pathname === '/trang-ca-nhan' && searchParams.get('tab') === 'history' ? 'text-amber-400' : 'text-white/50 hover:text-amber-400'}`}
                >
                    {pathname === '/trang-ca-nhan' && searchParams.get('tab') === 'history' && (
                        <div className="absolute inset-0 bg-amber-400/10 rounded-full z-[-1]" />
                    )}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
                    <span className="text-[9px] font-bold tracking-wide">Lịch sử</span>
                </button>

                <button
                    onClick={() => {
                        if (user) {
                            router.push("/trang-ca-nhan");
                        } else {
                            setLoginPromptSource("account");
                            setShowLoginPrompt(true);
                        }
                    }}
                    className={`relative w-[64px] h-[48px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer z-10 ${pathname === '/trang-ca-nhan' && searchParams.get('tab') !== 'history' && !isMenuOpen ? 'text-amber-400' : 'text-white/50 hover:text-amber-400'}`}
                >
                    {pathname === '/trang-ca-nhan' && searchParams.get('tab') !== 'history' && !isMenuOpen && (
                        <div className="absolute inset-0 bg-amber-400/10 rounded-full z-[-1]" />
                    )}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <span className="text-[9px] font-bold tracking-wide">Tài khoản</span>
                </button>
            </div>
            <LoginPromptModal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                source={loginPromptSource}
            />

            <UtilitySettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </>
    );
}
