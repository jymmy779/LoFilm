import { Metadata } from "next";
import { createClient } from "@/app/utils/supabase/server";
import HomeClient from "./HomeClient";
import SearchClient from "./SearchClient";
import { prefetchHomePageData } from "./lib/prefetch-home";

export const dynamic = "force-dynamic"; // Tắt Next.js ISR để luôn lấy data mới nhất từ Redis

export async function generateMetadata({ searchParams }: { searchParams: Promise<any> }): Promise<Metadata> {
    const params = await searchParams;
    const query = params.search;

    if (query) {
        return {
            title: `Tìm kiếm: ${query} | LoFilm`,
            description: `Kết quả tìm kiếm cho từ khóa "${query}" trên LoFilm. Khám phá kho phim đa dạng, chất lượng cao ngay tại đây.`,
            alternates: {
                canonical: `https://www.munos.store/?search=${query}`,
            },
        };
    }

    return {
        title: "LoFilm - Xem Phim Online Chất Lượng Cao, Phim 4K, Vietsub",
        description: "Trải nghiệm xem phim online chất lượng cao 4K, Vietsub tại LoFilm. Kho phim lẻ, phim bộ, anime mới nhất 2026 cập nhật mỗi ngày với tốc độ cực nhanh và không quảng cáo!",
        alternates: {
            canonical: 'https://www.munos.store',
        },
    };
}

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const isSearch = !!resolvedParams.search;

    if (isSearch) {
        const { fetchSearchData } = await import("@/app/utils/serverFetch");
        const initialData = await fetchSearchData(
            resolvedParams.search as string,
            Number(resolvedParams.page) || 1,
            48,
            {
                category: resolvedParams.cat as string,
                country: resolvedParams.country as string,
                year: resolvedParams.year as string,
                sort: resolvedParams.sort as string
            }
        );
        return <SearchClient initialData={initialData} />;
    } const supabase = await createClient();
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
            let filteredHistory = history.filter(item => {
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

    return <HomeClient prefetched={homePrefetch} activeEvent={settings.active_event} />;
}
