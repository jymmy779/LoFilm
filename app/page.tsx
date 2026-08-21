import { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/app/utils/supabase/server";
import HomeClient from "./HomeClient";
import Loading from "./loading";
import { prefetchHomePageData } from "./lib/prefetch-home";

export const revalidate = 60; // ISR: rebuild trang chủ mỗi 60s, Redis giữ data fresh

import { SITE_URL, getAbsoluteUrl } from "@/app/config/site";

export async function generateMetadata(): Promise<Metadata> {
    let ogImage = getAbsoluteUrl('/images/lofilm_logo.webp'); // Default
    
    try {
        const homeData = await prefetchHomePageData();
        const firstHero = homeData?.hero?.[0];
        if (firstHero && firstHero.thumb_url) {
            ogImage = firstHero.thumb_url;
        } else if (firstHero && firstHero.poster_url) {
            ogImage = firstHero.poster_url;
        }
    } catch (e) {
        console.error("Error fetching hero for OG image", e);
    }

    return {
        title: "CineStream - Modern Movie Streaming & Discovery Platform",
        description: "Khám phá thế giới điện ảnh đỉnh cao với hiệu năng vượt trội, xây dựng trên Next.js 16, React 19 và kiến trúc Multi-Layer Caching hiện đại.",
        alternates: {
            canonical: SITE_URL,
        },
        openGraph: {
            title: "CineStream - Modern Movie Streaming Platform",
            description: "Trải nghiệm điện ảnh đỉnh cao với hiệu năng vượt trội tại CineStream.",
            url: SITE_URL,
            siteName: "CineStream",
            locale: "vi_VN",
            type: "website",
            images: [{
                url: ogImage,
                width: 1200,
                height: 630,
                alt: "CineStream - Movie Streaming Platform",
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: 'CineStream - Modern Movie Streaming Platform',
            description: 'Khám phá thế giới điện ảnh đỉnh cao tại CineStream.',
            images: [ogImage],
        },
    };
}

export default async function Home() {
    return (
        <Suspense fallback={<Loading />}>
            <HomeData />
        </Suspense>
    );
}



async function HomeData() {
    const supabase = await createClient();
    const [homePrefetch, { data: { session } }] = await Promise.all([
        prefetchHomePageData(),
        supabase.auth.getSession()
    ]);

    // Nếu có session, nạp lịch sử xem phim
    if (session?.user) {
        const { data: history } = await supabase
            .from('watch_history')
            .select('*')
            .eq('user_id', session.user.id)
            .order('updated_at', { ascending: false })
            .limit(20);

        if (history) {
            const filteredHistory = history.filter(item => {
                if (!item.duration) return true;
                const progress = (item.watched_seconds / item.duration) * 100;
                const isFinished = progress >= 85;
                return !isFinished;
            });
            // Group by movie_slug: chỉ giữ 1 item/phim (item mới nhất), tránh spam tập phim bộ
            const groupedMap = new Map<string, any>();
            filteredHistory.forEach(item => {
                const key = item.movie_slug;
                const existing = groupedMap.get(key);
                if (!existing || new Date(item.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
                    groupedMap.set(key, item);
                }
            });
            homePrefetch.initialHistory = Array.from(groupedMap.values());
        }
    }

    const { getSiteSettings } = await import("./actions/adminSettings");
    const settings = await getSiteSettings();

    return <HomeClient prefetched={homePrefetch} activeEvent={settings.active_event} initialTopics={settings.home_topics} />;
}
