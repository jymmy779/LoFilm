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
        title: "LoFilm - Xem Phim Online Chất Lượng Cao, Phim 4K, Vietsub",
        description: "Trải nghiệm xem phim online chất lượng cao 4K, Vietsub tại LoFilm. Kho phim lẻ, phim bộ, anime mới nhất 2026 cập nhật mỗi ngày với tốc độ cực nhanh và không quảng cáo!",
        alternates: {
            canonical: SITE_URL,
        },
        openGraph: {
            title: "LoFilm - Kho Phim Giải Trí Đỉnh Cao, Xem Phim Online 4K, Vietsub",
            description: "Trải nghiệm xem phim chất lượng cao 4K, Vietsub, thuyết minh hoàn toàn miễn phí tại LoFilm.",
            url: SITE_URL,
            siteName: "LoFilm",
            locale: "vi_VN",
            type: "website",
            images: [{
                url: ogImage,
                width: 1200,
                height: 630,
                alt: "LoFilm - Xem Phim Online Chất Lượng Cao",
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: 'LoFilm - Xem Phim Online Chất Lượng Cao',
            description: 'Xem phim LoFilm miễn phí, chất lượng 4K, Vietsub.',
            images: [ogImage],
        },
    };
}

import HomeSkeleton from "./HomeSkeleton";

export default async function Home() {
    return (
        <Suspense fallback={<HomeSkeleton />}>
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
