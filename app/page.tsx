import { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/app/utils/supabase/server";
import HomeClient from "./HomeClient";
import Loading from "./loading";
import { prefetchHomePageData } from "./lib/prefetch-home";

export const dynamic = "force-dynamic"; // Tắt Next.js ISR để luôn lấy data mới nhất từ Redis

import { SITE_URL } from "@/app/config/site";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "LoFilm - Xem Phim Online Chất Lượng Cao, Phim 4K, Vietsub",
        description: "Trải nghiệm xem phim online chất lượng cao 4K, Vietsub tại LoFilm. Kho phim lẻ, phim bộ, anime mới nhất 2026 cập nhật mỗi ngày với tốc độ cực nhanh và không quảng cáo!",
        alternates: {
            canonical: SITE_URL,
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
