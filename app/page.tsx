import { Metadata } from "next";
import HomeClient from "./HomeClient";
import SearchClient from "./SearchClient";
import { prefetchHomePageData } from "./lib/prefetch-home";

export async function generateMetadata({ searchParams }: { searchParams: Promise<any> }): Promise<Metadata> {
    const params = await searchParams;
    const query = params.search;
    
    if (query) {
        return {
            title: `Tìm kiếm: ${query} | LoFilm`,
            description: `Kết quả tìm kiếm cho từ khóa "${query}" trên LoFilm. Khám phá kho phim đa dạng, chất lượng cao ngay tại đây.`
        };
    }

    return {
        title: "LoFilm - Xem Phim Online Chất Lượng Cao, Tốc Độ Mượt Mà",
        description: "Trải nghiệm xem phim online đỉnh cao tại LoFilm. Kho phim HD khổng lồ, vietsub chuẩn, tốc độ load cực nhanh và hoàn toàn miễn phí. Truy cập ngay!",
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

  const homePrefetch = await prefetchHomePageData();
  return <HomeClient prefetched={homePrefetch} />;
}
