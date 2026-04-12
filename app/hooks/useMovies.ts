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

export function useMovies({
    apiUrl,
    initialMovies = [],
    shouldEnrich = false,
    filterDuplicates = true,
    limit,
    sortByYear = false,
    revalidate
}: UseMoviesOptions) {
    const seeded = initialMovies.length > 0;
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

    const [movies, setMovies] = useState<Movie[]>(() => processMovies(initialMovies));

    const updateMovies = useCallback((newMovies: Movie[]) => {
        if (!isMounted.current) return;
        setMovies(processMovies(newMovies));
    }, [processMovies]);

    const fetchMovies = useCallback(async (retryCount = 0) => {
        if (!isMounted.current) return;
        
        try {
            setIsLoading(true);
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
                    void enrichMoviesMetadata({
                        items,
                        setItems: updateMovies,
                        isMounted: () => isMounted.current,
                        chunkSize: 4,
                        delay: 100
                    });
                }
            } else {
                throw new Error("Dữ liệu không hợp lệ");
            }
        } catch (err) {
            console.error(`Lỗi khi fetch movies từ ${apiUrl}:`, err);
            if (isMounted.current) {
                if (retryCount < 2) {
                    setTimeout(() => fetchMovies(retryCount + 1), 2000);
                } else {
                    setError("Không thể tải danh sách phim");
                    setIsLoading(false);
                }
            }
        }
    }, [apiUrl, filterDuplicates, limit, shouldEnrich, updateMovies, revalidate]);

    useEffect(() => {
        isMounted.current = true;
        
        if (seeded) {
            // No need to re-sort unless it's explicitly required
            // if (sortByYear) updateMovies(initialMovies);
            
            if (shouldEnrich) {
                void enrichMoviesMetadata({
                    items: initialMovies,
                    setItems: updateMovies,
                    isMounted: () => isMounted.current,
                    chunkSize: 4,
                    delay: 100
                });
            }
        } else {
            fetchMovies();
        }

        return () => {
            isMounted.current = false;
        };
    }, [apiUrl, seeded, shouldEnrich, sortByYear]); // eslint-disable-line react-hooks/exhaustive-deps

    return { movies, isLoading, error, refetch: fetchMovies };
}
