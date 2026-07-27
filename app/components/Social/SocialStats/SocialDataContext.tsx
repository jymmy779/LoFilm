"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import { globalCache } from "@/app/utils/globalCache";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------
interface DisplayComment {
    id: string | number;
    user: { name: string; avatar: string | null; isOwner?: boolean };
    movie: { slug: string; title: string; poster: string; backdrop: string };
    content: string;
    upvotes: number;
    downvotes: number;
    replies: number;
}

interface TickerComment {
    id: string;
    user: string;
    avatar: string | null;
    content: string;
    movie: string;
    slug: string;
    isOwner?: boolean;
}

interface TrendingMovie {
    slug: string;
    title: string;
    poster: string;
}

interface FavoriteMovie {
    slug: string;
    title: string;
    avatar: string;
}

export interface SocialData {
    topComments: DisplayComment[];
    newComments: TickerComment[];
    trending: TrendingMovie[];
    favorites: FavoriteMovie[];
}

interface SocialContextValue {
    data: SocialData | null;
    loading: boolean;
}

const CACHE_KEY = "social-combined";

const SocialContext = createContext<SocialContextValue>({ data: null, loading: true });

// -------------------------------------------------------------------------
// Provider – makes ONE request, feeds all 4 widgets
// -------------------------------------------------------------------------
export function SocialDataProvider({ children }: { children: ReactNode }) {
    const cached = globalCache.getRaw<SocialData>(CACHE_KEY);
    const [data, setData] = useState<SocialData | null>(cached || null);
    const [loading, setLoading] = useState(!cached);

    useEffect(() => {
        // If we already have cached data in memory, skip the network call
        if (data) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        axios
            .get<SocialData>("/api/social/combined", { signal: controller.signal })
            .then((res) => {
                if (res.data) {
                    setData(res.data);
                    globalCache.set(CACHE_KEY, res.data);
                }
            })
            .catch((err) => {
                if (!axios.isCancel(err)) {
                    console.error("[SocialDataProvider] fetch error:", err);
                }
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <SocialContext.Provider value={{ data, loading }}>
            {children}
        </SocialContext.Provider>
    );
}

export function useSocialData() {
    return useContext(SocialContext);
}
