import { Metadata } from "next";
import { createClient } from "@/app/utils/supabase/server";
import HomeClient from "./HomeClient";
import SearchClient from "./SearchClient";
import { prefetchHomePageData } from "./lib/prefetch-home";

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
    return <SearchClient />;
  }

  const [homePrefetch, supabase] = await Promise.all([
      prefetchHomePageData(),
      createClient()
  ]);

  // Thử lấy lịch sử xem ngay từ server nạp xuống
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
      const { data: history } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false })
          .limit(20);
      
      if (history) {
          // Chỉ hiện những phim chưa xem hết (dưới 90%)
          homePrefetch.initialHistory = history.filter(item => {
              if (!item.duration) return true;
              return (item.watched_seconds / item.duration) < 0.9;
          });
      }
  }

  return <HomeClient prefetched={homePrefetch} />;
}
