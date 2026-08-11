"use client";

import { createContext, useContext, ReactNode } from "react";
import axios from "axios";
import useSWR from "swr";

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

const SocialContext = createContext<SocialContextValue>({ data: null, loading: true });

const fetcher = (url: string) => axios.get(url).then(res => res.data);

// -------------------------------------------------------------------------
// Provider – makes ONE request, feeds all 4 widgets
// -------------------------------------------------------------------------
export function SocialDataProvider({ children }: { children: ReactNode }) {
    const { data, isLoading } = useSWR<SocialData>("/api/social/combined", fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
    });

    const loading = isLoading;

    return (
        <SocialContext.Provider value={{ data: data ?? null, loading }}>
            {children}
        </SocialContext.Provider>
    );
}

export function useSocialData() {
    return useContext(SocialContext);
}
