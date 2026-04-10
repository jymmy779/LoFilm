"use client"

import { usePathname } from "next/navigation";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import { MenuItem } from "./types";
import DropdownMenu from "./DropdownMenu";
import SearchBox from "./SearchBox";
import MemberButton from "./MemberButton";
import { useAdTrigger } from "@/app/hooks/useAdTrigger";

export default function Header() {
    const { openAdOnly } = useAdTrigger();
    const pathname = usePathname();
    const [categories, setCategories] = useState<MenuItem[]>([]);
    const [countries, setCountries] = useState<MenuItem[]>([]);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [expandedSections, setExpandedSections] = useState<string[]>([]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };

        const handleResize = () => {
            if (window.innerWidth >= 1024) { // Assuming 1024px (lg) is where desktop layout stays firm
                setIsSearchActive(false);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize, { passive: true });

        axios.get<MenuItem[]>("https://phimapi.com/the-loai")
            .then((res) => setCategories(res.data))
            .catch((err) => console.error("Lỗi fetch thể loại:", err));

        axios.get<MenuItem[]>("https://phimapi.com/quoc-gia")
            .then((res) => setCountries(res.data))
            .catch((err) => console.error("Lỗi fetch quốc gia:", err));

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const dropdownProps = { activeMenu, setActiveMenu, closeTimeout };

    const navLinks = [
        { href: "/danh-sach/phim-moi", label: "Phim mới" },
        { href: "/danh-sach/phim-bo", label: "Phim bộ" },
        { href: "/danh-sach/phim-le", label: "Phim lẻ" },
        { href: "/danh-sach/phim-chieu-rap", label: "Phim chiếu rạp" },
    ];

    const segments = pathname.split('/').filter(Boolean);
    const isMovieDetail = segments.length === 2 && segments[0] === "phim";
    const isTransparentPage = pathname === "/" || isMovieDetail;
    const isSolid = !isTransparentPage;
    const showBackground = isSolid || isScrolled || isMenuOpen;

    return (
        <header className={`w-full fixed top-0 left-0 z-50 ${isMenuOpen ? "" : "transition-all duration-300"} border-b ${showBackground ? "bg-[#0d1b2e] border-white/10 py-3 lg:px-5 shadow-lg" : "bg-transparent border-transparent py-2 lg:px-5"}`}>
            <div className="flex items-center justify-between h-[54px] md:h-[64px] w-full max-w-[1900px] mx-auto px-4 lg:px-0 gap-4 md:gap-8">
                <div className="flex xl:hidden items-center justify-between w-full h-full gap-3">
                    <AnimatePresence mode="wait">
                        {!isSearchActive ? (
                            <motion.div
                                key="logo-row"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2"
                            >
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(!isMenuOpen);
                                        setIsSearchActive(false);
                                    }}
                                    className="p-2 cursor-pointer text-white/70 hover:text-white transition-colors flex items-center justify-center w-10 h-10 shrink-0 relative"
                                    aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <motion.line
                                            x1="3" y1="6" x2="21" y2="6"
                                            animate={{
                                                rotate: isMenuOpen ? 45 : 0,
                                                y: isMenuOpen ? 6 : 0,
                                                x1: isMenuOpen ? 4.5 : 3,
                                                x2: isMenuOpen ? 19.5 : 21
                                            }}
                                            transition={{ duration: 0.2 }}
                                        />
                                        <motion.line
                                            x1="3" y1="12" x2="21" y2="12"
                                            animate={{ opacity: isMenuOpen ? 0 : 1 }}
                                            transition={{ duration: 0.1 }}
                                        />
                                        <motion.line
                                            x1="3" y1="18" x2="21" y2="18"
                                            animate={{
                                                rotate: isMenuOpen ? -45 : 0,
                                                y: isMenuOpen ? -6 : 0,
                                                x1: isMenuOpen ? 4.5 : 3,
                                                x2: isMenuOpen ? 19.5 : 21
                                            }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    </svg>
                                </button>

                                <TransitionLink href="/" className="shrink-0">
                                    <Image
                                        width={140}
                                        height={70}
                                        className="h-[50px] md:h-[65px] w-auto object-contain"
                                        src="/lofilm_logo.webp"
                                        alt="LoFilm"
                                        priority
                                        unoptimized
                                        sizes="(max-width: 768px) 140px, 140px"
                                    />
                                </TransitionLink>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="search-row"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="flex-1"
                            >
                                <SearchBox autoFocus={true} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                setIsSearchActive(!isSearchActive);
                                setIsMenuOpen(false);
                            }}
                            className="p-2 cursor-pointer text-white/60 hover:text-white transition-colors shrink-0 flex items-center justify-center w-10 h-10"
                            aria-label={isSearchActive ? "Đóng tìm kiếm" : "Mở tìm kiếm"}
                        >
                            <AnimatePresence mode="wait">
                                {isSearchActive ? (
                                    <motion.svg
                                        key="close-svg"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                                    </motion.svg>
                                ) : (
                                    <motion.svg
                                        key="search-svg"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        viewBox="0 0 512 512" width="20" height="20" fill="currentColor"
                                    >
                                        <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                                    </motion.svg>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>

                <div className="hidden xl:flex items-center justify-between w-full h-full">
                    <div className="flex items-center gap-8 flex-1">
                        <TransitionLink href="/" className="shrink-0">
                            <Image
                                width={150}
                                height={80}
                                className="h-[65px] w-auto object-contain"
                                src="/lofilm_logo.webp"
                                alt="LoFilm"
                                priority
                                unoptimized
                            />
                        </TransitionLink>

                        <div className="md:ml-4">
                            <SearchBox />
                        </div>

                        <nav className="flex items-center gap-4 2xl:gap-6">
                            <TransitionLink href="/" className="text-[13px] 2xl:text-sm font-medium text-white/80 hover:text-[#f5a623] transition-colors duration-150 whitespace-nowrap">
                                Trang chủ
                            </TransitionLink>

                            <DropdownMenu
                                id="the-loai"
                                label="Thể loại"
                                items={categories}
                                hrefPrefix="/the-loai"
                                columns={4}
                                {...dropdownProps}
                            />

                            <DropdownMenu
                                id="quoc-gia"
                                label="Quốc gia"
                                items={countries}
                                hrefPrefix="/quoc-gia"
                                columns={4}
                                {...dropdownProps}
                            />

                            {navLinks.map((item) => (
                                <TransitionLink
                                    key={item.label}
                                    href={item.href}
                                    className="text-[13px] 2xl:text-sm font-medium text-white/80 hover:text-[#f5a623] transition-colors duration-150 whitespace-nowrap"
                                >
                                    {item.label}
                                </TransitionLink>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <MemberButton />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="xl:hidden fixed inset-0 z-[80] bg-black/60"
                            onClick={() => setIsMenuOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="xl:hidden fixed left-4 right-4 top-[64px] md:top-[74px] z-[100] bg-[#111e31] border border-white/10 rounded-xl overflow-hidden origin-top overflow-y-auto max-h-[80vh]"
                            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
                        >
                            <div className="p-5 custom-scrollbar">
                                <div className="flex flex-col">
                                    <div>
                                        <TransitionLink
                                            href="/"
                                            onClick={() => { if (pathname !== "/") setIsMenuOpen(false); }}
                                            className="text-base cursor-pointer font-medium text-white/80 py-3 border-b border-white/5 flex items-center justify-between hover:text-[#f5a623] transition-colors"
                                        >
                                            Trang chủ
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                        </TransitionLink>
                                    </div>

                                    <div className="border-b border-white/5">
                                        <button
                                            onClick={() => setExpandedSections(prev => prev.includes('categories') ? prev.filter(s => s !== 'categories') : [...prev, 'categories'])}
                                            className="w-full flex cursor-pointer items-center justify-between py-3 text-base font-medium text-white/80 hover:text-[#f5a623] transition-colors"
                                        >
                                            <span>Thể loại</span>
                                            <motion.svg
                                                animate={{ rotate: expandedSections.includes('categories') ? 180 : 0 }}
                                                xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                            >
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </motion.svg>
                                        </button>

                                        <motion.div
                                            initial={false}
                                            animate={{
                                                height: expandedSections.includes('categories') ? "auto" : 0,
                                                opacity: expandedSections.includes('categories') ? 1 : 0,
                                                marginTop: expandedSections.includes('categories') ? 6 : 0,
                                                marginBottom: expandedSections.includes('categories') ? 6 : 0
                                            }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="overflow-hidden"
                                            style={{ transform: "translateZ(0)" }}
                                        >
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                                                {categories.map((cat) => (
                                                    <TransitionLink
                                                        key={cat._id}
                                                        href={`/the-loai/${cat.slug}`}
                                                        onClick={() => { 
                                                            if (pathname !== `/the-loai/${cat.slug}`) setIsMenuOpen(false); 
                                                            openAdOnly("category_tab");
                                                        }}
                                                        className="text-sm text-white/60 hover:text-[#f5a623] py-1 transition-colors"
                                                    >
                                                        • {cat.name}
                                                    </TransitionLink>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </div>

                                    <div className="border-b border-white/5">
                                        <button
                                            onClick={() => setExpandedSections(prev => prev.includes('countries') ? prev.filter(s => s !== 'countries') : [...prev, 'countries'])}
                                            className="w-full flex cursor-pointer items-center justify-between py-3 text-base font-medium text-white/80 hover:text-[#f5a623] transition-colors"
                                        >
                                            <span>Quốc gia</span>
                                            <motion.svg
                                                animate={{ rotate: expandedSections.includes('countries') ? 180 : 0 }}
                                                xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                            >
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </motion.svg>
                                        </button>

                                        <motion.div
                                            initial={false}
                                            animate={{
                                                height: expandedSections.includes('countries') ? "auto" : 0,
                                                opacity: expandedSections.includes('countries') ? 1 : 0,
                                                marginTop: expandedSections.includes('countries') ? 6 : 0,
                                                marginBottom: expandedSections.includes('countries') ? 6 : 0
                                            }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="overflow-hidden"
                                            style={{ transform: "translateZ(0)" }}
                                        >
                                            <div className="grid grid-cols-3 gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                                                {countries.map((country) => (
                                                    <TransitionLink
                                                        key={country._id}
                                                        href={`/quoc-gia/${country.slug}`}
                                                        onClick={() => { 
                                                            if (pathname !== `/quoc-gia/${country.slug}`) setIsMenuOpen(false); 
                                                            openAdOnly("country_tab");
                                                        }}
                                                        className="text-sm text-white/60 hover:text-[#f5a623] py-1 transition-colors"
                                                    >
                                                        {country.name}
                                                    </TransitionLink>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </div>

                                    {navLinks.map((item) => (
                                        <div key={item.href}>
                                            <TransitionLink
                                                href={item.href}
                                                onClick={() => { if (pathname !== item.href) setIsMenuOpen(false); }}
                                                className="text-base text-white/80 py-3 border-b border-white/5 hover:text-[#f5a623] transition-colors font-medium block"
                                            >
                                                {item.label}
                                            </TransitionLink>
                                        </div>
                                    ))}

                                    <div className="pt-4 pb-2 flex justify-center border-t border-white/5 mt-4">
                                        <MemberButton flatten={true} onClick={() => setIsMenuOpen(false)} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}