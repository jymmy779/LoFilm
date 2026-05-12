"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Movie } from "@/app/types/movie";
import { filterDuplicateMovies } from "@/app/utils/movieUtils";

interface UseMoviesOptions {
    apiUrl: string;
    initialMovies?: Movie[];
    filterDuplicates?: boolean;
    limit?: number;
    sortByYear?: boolean;
    revalidate?: number;
}

/**
 * Global cache to store movies across component mounts.
 * Key: apiUrl, Value: Movie[]
 */
const movieCache: Record<string, { data: Movie[], timestamp: number }> = {};
const STALE_TIME = 5 * 60 * 1000; // 5 phút

export function useMovies({
    apiUrl,
    initialMovies = [],
    filterDuplicates = true,
    limit,
    sortByYear = false,
    revalidate
}: UseMoviesOptions) {
    // Check if we have cached movies for this URL
    const cacheEntry = movieCache[apiUrl];
    const cachedMovies = cacheEntry?.data || [];
    const hasInitial = initialMovies.length > 0;
    const hasCache = cachedMovies.length > 0;
    
    const seeded = hasInitial || hasCache;
    const [isLoading, setIsLoading] = useState(!seeded);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const processMovies = useCallback((items: Movie[]) => {
        let processed = [...items];
        if (sortByYear) {
            processed.sort((a, b) => {
                const yearA = a.year || 0;
                const yearB = b.year || 0;
                if (yearB !== yearA) return yearB - yearA;
                const timeA = a.modified?.time ? new Date(a.modified.time).getTime() : 0;
                const timeB = b.modified?.time ? new Date(b.modified.time).getTime() : 0;
                return timeB - timeA;
            });
        }
        return processed;
    }, [sortByYear]);

    const [movies, setMovies] = useState<Movie[]>(() => {
        if (hasCache) return processMovies(cachedMovies);
        return processMovies(initialMovies);
    });

    const updateMovies = useCallback((newMovies: Movie[]) => {
        if (!isMounted.current) return;
        
        const processed = processMovies(newMovies);
        movieCache[apiUrl] = { 
            data: processed, 
            timestamp: Date.now() 
        };
        setMovies(processed);
    }, [processMovies, apiUrl]);

    const fetchMovies = useCallback(async (retryCount = 0, backgroundFetch = false) => {
        if (!isMounted.current) return;
        
        // Kiểm tra xem có cần fetch thực sự không (nếu là background fetch)
        if (backgroundFetch && movieCache[apiUrl]) {
            const now = Date.now();
            const lastFetched = movieCache[apiUrl].timestamp;
            if (now - lastFetched < STALE_TIME) {
                // Dữ liệu vẫn còn mới, không cần gọi server nữa
                return;
            }
        }
        
        try {
            if (!backgroundFetch) {
                setIsLoading(true);
            }
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(apiUrl)}${revalidate ? `&revalidate=${revalidate}` : ""}`;
            const response = await axios.get(proxyUrl);
            
            if (isMounted.current && (response.data?.status === "success" || response.data?.status === true) && response.data?.data?.items) {
                let items: Movie[] = response.data.data.items;
                
                if (filterDuplicates) {
                    items = filterDuplicateMovies(items);
                }
                
                if (limit) {
                    items = items.slice(0, limit);
                }

                updateMovies(items);
                setIsLoading(false);
            } else {
                throw new Error("Dữ liệu không hợp lệ");
            }
        } catch (err) {
            console.error(`Lỗi khi fetch movies từ ${apiUrl}:`, err);
            if (isMounted.current) {
                if (retryCount < 2) {
                    setTimeout(() => fetchMovies(retryCount + 1, backgroundFetch), 2000);
                } else {
                    if (!backgroundFetch) {
                        setError("Không thể tải danh sách phim");
                        setIsLoading(false);
                    }
                }
            }
        }
    }, [apiUrl, filterDuplicates, limit, updateMovies, revalidate]);

    useEffect(() => {
        isMounted.current = true;
        
        // 1. Cập nhật cache từ Server Props nếu có nhưng CHƯA có trong cache trình duyệt
        if (hasInitial && !movieCache[apiUrl]) {
            movieCache[apiUrl] = {
                data: processMovies(initialMovies),
                timestamp: Date.now() // Đánh dấu thời điểm Server nạp xuống là "vừa mới"
            };
        }

        // 2. Chỉ fetch nếu dữ liệu chưa có HOẶC đã quá cũ (STALE_TIME)
        // fetchMovies đã có logic kiểm tra timestamp bên trong
        void fetchMovies(0, seeded);

        return () => {
            isMounted.current = false;
        };
    }, [apiUrl, seeded, sortByYear, fetchMovies, hasInitial, initialMovies, processMovies]);

    return { movies, isLoading, error, refetch: fetchMovies };
}
