import { useState, useEffect, Suspense, useRef, memo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { Movie } from "@/app/types/movie";
import { usePageTransition } from "@/app/components/Transition/PageTransitionContext";
import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import SmartImage from "@/app/components/Common/SmartImage";
import TransitionLink from "@/app/components/Transition/TransitionLink";

interface SearchBoxProps {
    autoFocus?: boolean;
}

function SearchBox(props: SearchBoxProps) {
    return (
        <Suspense fallback={
            <div className="flex items-center gap-2 2xl:gap-3 px-4 2xl:px-5 py-2 2xl:py-2.5 rounded-full border border-white/10 bg-white/5 w-full md:w-[220px] xl:w-[240px] 2xl:w-[270px] h-[40px] 2xl:h-[46px]" />
        }>
            <SearchBoxInner {...props} />
        </Suspense>
    );
}

function SearchBoxInner({ autoFocus }: SearchBoxProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { navigateWithTransition } = usePageTransition();
    const searchFromUrl = searchParams.get("search") || "";
    const [searchQuery, setSearchQuery] = useState(searchFromUrl);
    const [results, setResults] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchCache = useRef<Record<string, Movie[]>>({});

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Click/touch outside handler to close the dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false);
                setIsFocused(false);
                setActiveIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside, true);
        document.addEventListener("touchstart", handleClickOutside, { capture: true, passive: true });
        return () => {
            document.removeEventListener("mousedown", handleClickOutside, true);
            document.removeEventListener("touchstart", handleClickOutside, true);
        };
    }, []);

    // Close dropdown on navigation
    useEffect(() => {
        setIsFocused(false);
        setShowResults(false);
        inputRef.current?.blur();
        setActiveIndex(-1);
    }, [pathname, searchParams]);

    // Handle debounced search with caching and request cancellation
    useEffect(() => {
        if (autoFocus) {
            setIsFocused(true);
            inputRef.current?.focus();
        }
    }, [autoFocus]);

    useEffect(() => {
        const controller = new AbortController();
        const query = searchQuery.trim();
        const normalizedCacheKey = query.toLowerCase(); // Chống phân biệt hoa/thường cho cache

        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                // 1. Kiểm tra cache trước (phản hồi tức thì)
                if (searchCache.current[normalizedCacheKey]) {
                    setResults(searchCache.current[normalizedCacheKey]);
                    setIsSearching(false);
                    if (isFocused) setShowResults(true);
                    setActiveIndex(-1);
                    return;
                }

                setIsSearching(true);
                if (isFocused) setShowResults(true);
                try {
                    const apiUrl = `/api/search?keyword=${encodeURIComponent(query)}&limit=10`; // API nội bộ trộn cả phim độc quyền và phim thường
                    const res = await axios.get(apiUrl, {
                        signal: controller.signal
                    });

                    if (res.data?.status === "success" || res.data?.status === true) {
                        const items = res.data.data?.items || [];

                        // Lấy trực tiếp từ API và hiện 8 phim tốt nhất ở dropdown
                        const finalItems = items.slice(0, 8);

                        setResults(finalItems);
                        // 2. Lưu vào cache
                        searchCache.current[normalizedCacheKey] = finalItems;
                        setActiveIndex(-1);
                    }
                } catch (error) {
                    if (axios.isCancel(error)) return;
                    console.error("Link search error:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
                setShowResults(false);
                setActiveIndex(-1);
            }
        }, 150);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchQuery, isFocused]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            const query = searchQuery.trim();
            setIsFocused(false);
            setShowResults(false);
            inputRef.current?.blur();
            navigateWithTransition(`/?search=${encodeURIComponent(query)}`);
        }
    };

    // Keyboard Navigation Logic
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showResults || results.length === 0) {
            if (e.key === "Enter") handleSearch();
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
                break;
            case "ArrowUp":
                e.preventDefault();
                setActiveIndex(prev => (prev > -1 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (activeIndex >= 0) {
                    // Navigate to the selected movie
                    const selectedMovie = results[activeIndex];
                    navigateWithTransition(`/phim/${selectedMovie.slug}`);
                    setShowResults(false);
                    setIsFocused(false);
                } else {
                    handleSearch();
                }
                break;
            case "Escape":
                setShowResults(false);
                setIsFocused(false);
                inputRef.current?.blur();
                break;
        }
    };

    return (
        <div ref={containerRef} className="relative w-full md:w-auto">
            <div className={`flex items-center gap-2 2xl:gap-3 px-4 2xl:px-5 py-2 2xl:py-2.5 rounded-full border border-white/10 bg-white/5 w-full md:w-[220px] xl:w-[240px] 2xl:w-[270px] focus-within:md:w-[260px] focus-within:xl:w-[280px] focus-within:2xl:w-[320px] focus-within:border-[#f5a623]/50 focus-within:bg-white/10 transition-all duration-500 ease-out ${showResults ? 'md:w-[260px] xl:w-[280px] 2xl:w-[320px] border-[#f5a623]/50 bg-white/10' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16" fill="currentColor" className="shrink-0 text-white/30">
                    <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Tìm kiếm phim..."
                    autoFocus={autoFocus}
                    aria-label="Tìm kiếm phim"
                    className="bg-transparent outline-none text-[13px] lg:text-base text-white w-full placeholder:text-white/30"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsFocused(true);
                        if (e.target.value.trim().length >= 2) setShowResults(true);
                    }}
                    onFocus={() => {
                        setIsFocused(true);
                        if (searchQuery.trim().length >= 2) setShowResults(true);
                    }}
                    onKeyDown={handleKeyDown}
                />
                {(searchQuery || isSearching) && (
                    <div className="flex items-center gap-2">
                        {isSearching && (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin shrink-0" />
                        )}
                        {searchQuery && (
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Ngăn việc focus làm nhảy layout
                                    e.stopPropagation();
                                    setSearchQuery("");
                                    setResults([]);
                                    setShowResults(false);
                                }}
                                className="shrink-0 text-white/40 cursor-pointer hover:text-white transition-colors flex items-center"
                                aria-label="Xóa tìm kiếm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="16" height="16" fill="currentColor">
                                    <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Live Search Results Dropdown */}
            <div
                className={`absolute top-full left-0 right-0 mt-2 md:mt-3 bg-[#0F1115] border border-white/10 rounded-xl md:rounded-2xl overflow-hidden z-[100] md:min-w-[400px] transition-all duration-200 origin-top ${showResults && isFocused && searchQuery.trim().length >= 2 && results.length > 0
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-2 scale-[0.98] pointer-events-none"
                    }`}
            >
                <div className="p-3 md:p-4">
                    <div className="text-[9.5px] md:text-[10px] font-bold uppercase tracking-widest text-[#f5a623] mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2">
                        <span className="w-1 h-2.5 md:h-3 bg-[#f5a623] rounded-full" />
                        Kết quả tìm kiếm
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[60vh] md:max-h-[70vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1">
                        {results.length > 0 ? (
                            results.map((movie: Movie, index: number) => (
                                <div key={movie._id}>
                                    <TransitionLink
                                        href={`/phim/${movie.slug}`}
                                        className={`group flex gap-2.5 md:gap-3 p-1.5 md:p-2 rounded-xl transition-all duration-300 ${activeIndex === index ? 'bg-white/10 ring-1 ring-[#f5a623]/30' : 'hover:bg-white/5'}`}
                                        onMouseEnter={() => setActiveIndex(index)}
                                    >
                                        <div className="w-10 h-14 md:w-12 md:h-16 shrink-0 rounded-lg overflow-hidden relative border border-white/5 bg-white/5">
                                            <SmartImage
                                                src={getImageUrl(movie.poster_url || movie.thumb_url || "", { width: 100, quality: 75 })}
                                                rawSrc={getRawImageUrl(movie.poster_url || movie.thumb_url || "")}
                                                alt={movie.name}
                                                fill
                                                sizes="48px"
                                                priority={results.indexOf(movie) < 3}
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <h4 className={`text-[12px] md:text-[13px] font-bold transition-colors truncate leading-tight ${activeIndex === index ? 'text-[#f5a623]' : 'text-white/90 group-hover:text-[#f5a623]'}`}>
                                                {movie.name}
                                            </h4>
                                            <p className="text-[10px] md:text-[11px] text-white/40 truncate mt-0.5">
                                                {movie.origin_name}
                                            </p>
                                            <div className="flex gap-1.5 md:gap-2 mt-1 md:mt-1.5 items-center">
                                                <span className="text-[8px] md:text-[9px] px-1 md:px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-medium tracking-wide">
                                                    {movie.year || '2025'}
                                                </span>
                                                <span className="text-[8px] md:text-[9px] px-1 md:px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500/80 font-bold uppercase">
                                                    {movie.quality || 'FHD'}
                                                </span>
                                                <span className="text-[8px] md:text-[9px] px-1 md:px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-medium">
                                                    {movie.episode_current || 'Full'}
                                                </span>
                                            </div>
                                        </div>
                                    </TransitionLink>
                                </div>
                            ))
                        ) : null}
                    </div>
                </div>

                {results.length > 0 && (
                    <TransitionLink
                        href={`/?search=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => {
                            setIsFocused(false);
                            setShowResults(false);
                        }}
                        className="w-full py-2.5 md:py-3 bg-white/5 hover:bg-amber-500 hover:text-black transition-all duration-300 cursor-pointer text-[13px] md:text-[14px] font-medium text-[#f5a623] border-t border-white/5 block text-center"
                    >
                        Xem tất cả kết quả
                    </TransitionLink>
                )}
            </div>
        </div>
    );
}

export default memo(SearchBox);
