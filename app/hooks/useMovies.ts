"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Movie } from "@/app/types/movie";
import { filterDuplicateMovies } from "@/app/utils/movieUtils";
import { enrichMoviesMetadata } from "@/app/utils/enrichmentUtils";

interface UseMoviesOptions {
    apiUrl: string;
    initialMovies?: Movie[];
    shouldEnrich?: boolean;
    filterDuplicates?: boolean;
    limit?: number;
    sortByYear?: boolean;
    revalidate?: number;
}

/**
 * Global cache to store movies across component mounts.
 * Key: apiUrl, Value: Movie[]
 */
const movieCache: Record<string, Movie[]> = {};

export function useMovies({
    apiUrl,
    initialMovies = [],
    shouldEnrich = false,
    filterDuplicates = true,
    limit,
    sortByYear = false,
    revalidate
}: UseMoviesOptions) {
    // Check if we have cached movies for this URL
    const cachedMovies = movieCache[apiUrl] || [];
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
        movieCache[apiUrl] = processed;
        setMovies(processed);
    }, [processMovies, apiUrl]);

    const fetchMovies = useCallback(async (retryCount = 0, backgroundFetch = false) => {
        if (!isMounted.current) return;
        
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

                if (shouldEnrich) {
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                    void enrichMoviesMetadata({
                        items,
                        setItems: updateMovies,
                        isMounted: () => isMounted.current,
                        chunkSize: isMobile ? 2 : 4,
                        delay: isMobile ? 300 : 100
                    });
                }
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
    }, [apiUrl, filterDuplicates, limit, shouldEnrich, updateMovies, revalidate]);

    useEffect(() => {
        isMounted.current = true;
        
        // 1. Cập nhật cache từ Server Props nếu có
        if (hasInitial) {
            movieCache[apiUrl] = processMovies(initialMovies);
        }

        // 2. Nếu đã có dữ liệu (từ cache hoặc server), chúng ta vẫn fetch ngầm để cập nhật tập mới/phim mới
        // nhưng KHÔNG set isLoading = true để tránh hiện skeleton.
        if (seeded) {
            // Fetch ngầm để cập nhật dữ liệu mới nhất từ API
            void fetchMovies(0, true); // Thêm flag backgroundFetch

            if (shouldEnrich) {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                void enrichMoviesMetadata({
                    items: movies,
                    setItems: updateMovies,
                    isMounted: () => isMounted.current,
                    chunkSize: isMobile ? 2 : 4,
                    delay: isMobile ? 300 : 100
                });
            }
        } else {
            // Nếu chưa có gì cả, bắt buộc phải fetch và hiện loading
            void fetchMovies();
        }

        return () => {
            isMounted.current = false;
        };
    }, [apiUrl, seeded, shouldEnrich, sortByYear]);

    return { movies, isLoading, error, refetch: fetchMovies };
}
