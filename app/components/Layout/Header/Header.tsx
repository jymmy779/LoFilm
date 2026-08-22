"use client"

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Image from "next/image";
import { X } from "lucide-react";

import { MenuItem } from "./types";
import Logo from "@/app/components/UI/Brand/Logo";
import DropdownMenu from "./DropdownMenu";
import SearchBox from "./SearchBox";
import MemberButton from "./MemberButton";
import NotificationBell from "./NotificationBell";
import MobileBottomSheet from "./MobileBottomSheet";
import { useAuth } from "@/app/components/User/Auth/AuthContext";
import LoginPromptModal from "@/app/components/UI/Modals/LoginPromptModal";
import { getUserAvatarUrl } from "@/app/utils/avatar-helper";

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
                const list: MenuItem[] = Array.isArray(items) ? [...items] : [];
                if (!list.some(i => i.slug === "hoat-hinh")) {
                    list.push({ _id: "hoat-hinh", name: "Hoạt hình", slug: "hoat-hinh" });
                    list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
                }
                setCategories(list);
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
        { _id: "tv-shows", name: "TV Shows", slug: "tv-shows" },
        { _id: "phim-chieu-rap", name: "Phim chiếu rạp", slug: "phim-chieu-rap" },
    ];

    const showBackground = isScrolled || isMenuOpen;
    const [optimisticTab, setOptimisticTab] = useState<string | null>(null);

    useEffect(() => {
        setOptimisticTab(null);
    }, [pathname]);

    const activeRoute = optimisticTab ?? pathname;
    const isHomeActive = activeRoute === '/' && !hasSearchQuery && !isMenuOpen;
    const isKhamPhaActive = ((activeRoute.startsWith('/danh-sach/') && activeRoute !== '/danh-sach/phim-chieu-rap') || activeRoute.startsWith('/the-loai/') || activeRoute.startsWith('/quoc-gia/') || hasSearchQuery) && activeRoute !== '/';
    const isPlaylistActive = activeRoute === '/thu-vien';
    const isLichChieuActive = activeRoute === '/danh-sach/phim-chieu-rap';
    const isCaNhanActive = activeRoute === '/ca-nhan' && !isMenuOpen;

    return (
        <>
            <header className={`w-full fixed top-0 left-0 z-[100] py-2 xl:px-5 [@supports(-webkit-touch-callout:none)]:pt-[max(env(safe-area-inset-top),12px)] border-none ${isMenuOpen ? "" : "transition-all duration-300"} border-b ${showBackground ? "bg-[#0F1115]/95 border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.6)]" : "bg-transparent border-transparent"}`}>
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
                                    <Logo size="sm" />
                                </TransitionLink>
                            </div>
                            <div className={`flex-1 md:block md:ml-4 lg:ml-8 ${isSearchActive ? "block animate-reveal-left" : "hidden"}`}>
                                <SearchBox autoFocus={isSearchActive} />
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
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
                                <Logo size="md" />
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

            {/* Mobile Bottom Navigation (Dynamic Expanding Pill - Arc / Dynamic Island Style - 120fps Zero-Delay) */}
            <div className="xl:hidden fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[90] pointer-events-none">
                <nav
                    aria-label="Mobile Navigation"
                    className="relative h-[56px] md:h-[60px] bg-[#242528]/90 border border-white/15 rounded-full px-2.5 md:px-3 flex items-center gap-1.5 md:gap-2 pointer-events-auto"
                >
                    {/* Tab 1: Trang chủ */}
                    <TransitionLink
                        href="/"
                        onClick={(e) => {
                            if (isHomeActive) { e.preventDefault(); return; }
                            setOptimisticTab('/');
                        }}
                        className={`relative h-[42px] md:h-[46px] rounded-full flex items-center justify-center transition-all duration-200 ease-out active:scale-90 ${isHomeActive
                            ? "bg-[#D497FF]/15 text-[#D497FF] px-3.5 md:px-4 gap-2 md:gap-2.5"
                            : "w-[42px] md:w-[46px] text-white/50 hover:text-white/80"
                            }`}
                    >
                        <svg className="shrink-0 transition-transform duration-200 w-[21px] h-[21px] md:w-[23px] md:h-[23px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isHomeActive ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        <span className={`text-[12px] md:text-[13px] font-semibold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${isHomeActive ? "max-w-[80px] md:max-w-[90px] opacity-100" : "max-w-0 opacity-0"
                            }`}>
                            Trang chủ
                        </span>
                    </TransitionLink>

                    {/* Tab 2: Khám phá */}
                    <TransitionLink
                        href="/danh-sach/phim-moi"
                        onClick={(e) => {
                            if (isKhamPhaActive) { e.preventDefault(); return; }
                            setOptimisticTab('/danh-sach/phim-moi');
                        }}
                        className={`relative h-[42px] md:h-[46px] rounded-full flex items-center justify-center transition-all duration-200 ease-out active:scale-90 ${isKhamPhaActive
                            ? "bg-[#D497FF]/15 text-[#D497FF] px-3.5 md:px-4 gap-2 md:gap-2.5"
                            : "w-[42px] md:w-[46px] text-white/50 hover:text-white/80"
                            }`}
                    >
                        <svg className="shrink-0 transition-transform duration-200 w-[21px] h-[21px] md:w-[23px] md:h-[23px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isKhamPhaActive ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
                        <span className={`text-[12px] md:text-[13px] font-semibold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${isKhamPhaActive ? "max-w-[80px] md:max-w-[90px] opacity-100" : "max-w-0 opacity-0"
                            }`}>
                            Khám phá
                        </span>
                    </TransitionLink>

                    {/* Tab 3: Playlist */}
                    <button
                        onClick={(e) => {
                            if (isPlaylistActive) { e.preventDefault(); return; }
                            if (user) {
                                setOptimisticTab('/thu-vien');
                                router.push('/thu-vien');
                            } else {
                                setLoginPromptSource("playlist");
                                setShowLoginPrompt(true);
                            }
                        }}
                        className={`relative h-[42px] md:h-[46px] rounded-full flex items-center justify-center transition-all duration-200 ease-out active:scale-90 ${isPlaylistActive
                            ? "bg-[#D497FF]/15 text-[#D497FF] px-3.5 md:px-4 gap-2 md:gap-2.5"
                            : "w-[42px] md:w-[46px] text-white/50 hover:text-white/80"
                            }`}
                    >
                        <svg className="shrink-0 transition-transform duration-200 w-[21px] h-[21px] md:w-[23px] md:h-[23px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isPlaylistActive ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>
                        <span className={`text-[12px] md:text-[13px] font-semibold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${isPlaylistActive ? "max-w-[80px] md:max-w-[90px] opacity-100" : "max-w-0 opacity-0"
                            }`}>
                            Playlist
                        </span>
                    </button>

                    {/* Tab 4: Lịch chiếu */}
                    <TransitionLink
                        href="/danh-sach/phim-chieu-rap"
                        onClick={(e) => {
                            if (isLichChieuActive) { e.preventDefault(); return; }
                            setOptimisticTab('/danh-sach/phim-chieu-rap');
                        }}
                        className={`relative h-[42px] md:h-[46px] rounded-full flex items-center justify-center transition-all duration-200 ease-out active:scale-90 ${isLichChieuActive
                            ? "bg-[#D497FF]/15 text-[#D497FF] px-3.5 md:px-4 gap-2 md:gap-2.5"
                            : "w-[42px] md:w-[46px] text-white/50 hover:text-white/80"
                            }`}
                    >
                        <svg className="shrink-0 transition-transform duration-200 w-[21px] h-[21px] md:w-[23px] md:h-[23px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isLichChieuActive ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
                        <span className={`text-[12px] md:text-[13px] font-semibold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${isLichChieuActive ? "max-w-[80px] md:max-w-[90px] opacity-100" : "max-w-0 opacity-0"
                            }`}>
                            Lịch chiếu
                        </span>
                    </TransitionLink>

                    {/* Tab 5: Cá nhân */}
                    <button
                        onClick={(e) => {
                            if (isCaNhanActive) { e.preventDefault(); return; }
                            if (user) {
                                setOptimisticTab('/ca-nhan');
                                router.push('/ca-nhan');
                            } else {
                                setLoginPromptSource("account");
                                setShowLoginPrompt(true);
                            }
                        }}
                        className={`relative h-[42px] md:h-[46px] rounded-full flex items-center justify-center transition-all duration-200 ease-out active:scale-90 ${isCaNhanActive
                            ? "bg-[#D497FF]/15 text-[#D497FF] px-3.5 md:px-4 gap-2 md:gap-2.5"
                            : "w-[42px] md:w-[46px] text-white/50 hover:text-white/80"
                            }`}
                    >
                        {isMounted && user ? (
                            <div className={`shrink-0 w-[21px] h-[21px] md:w-[23px] md:h-[23px] rounded-full overflow-hidden border ${isCaNhanActive ? 'border-[#D497FF]' : 'border-white/40'}`}>
                                <Image src={getUserAvatarUrl(user)} alt="Avatar" width={23} height={23} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <svg className="shrink-0 transition-transform duration-200 w-[21px] h-[21px] md:w-[23px] md:h-[23px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isCaNhanActive ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        )}
                        <span className={`text-[12px] md:text-[13px] font-semibold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${isCaNhanActive ? "max-w-[80px] md:max-w-[90px] opacity-100" : "max-w-0 opacity-0"
                            }`}>
                            Cá nhân
                        </span>
                    </button>
                </nav>
            </div>
            <LoginPromptModal
                isOpen={showLoginPrompt}
                onClose={() => {
                    setOptimisticTab(null);
                    setShowLoginPrompt(false);
                }}
            />
        </>
    );
}

