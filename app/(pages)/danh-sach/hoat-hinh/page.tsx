import Loading from "@/app/loading";
import { Metadata } from "next";
import { Suspense } from "react";
import AnimeClient from "./AnimeClient";
import CatalogSkeleton from "@/app/components/Movies/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";

import { getAbsoluteUrl } from "@/app/config/site";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
    const params = await searchParams;
    const isAnime = params.country === 'nhat-ban';
    
    return {
        title: isAnime 
            ? "Phim Anime Nhật Bản Hay Nhất | LoFilm - Xem Anime Vietsub Mới" 
            : "Phim Hoạt Hình Hay Nhất | LoFilm - Xem Hoạt Hình Vietsub 4K",
        description: isAnime
            ? "Tổng hợp các bộ phim anime Nhật Bản hay nhất, thuyết minh vietsub cực chất, cập nhật liên tục mỗi ngày trên LoFilm. Xem anime Naruto, One Piece, Dragon Ball miễn phí."
            : "Tổng hợp các bộ phim hoạt hình hay nhất, thuyết minh vietsub cực chất, cập nhật liên tục mỗi ngày trên LoFilm. Xem hoạt hình Disney, Pixar, DreamWorks miễn phí 4K.",
        keywords: isAnime
            ? ["anime", "anime vietsub", "anime nhat ban", "anime moi nhat", "xem anime online", "lofilm anime"]
            : ["phim hoat hinh", "hoat hinh hay", "phim hoat hinh disney", "hoat hinh pixar", "xem phim hoat hinh online", "lofilm hoat hinh"],
        alternates: {
            canonical: getAbsoluteUrl(isAnime ? '/danh-sach/hoat-hinh?country=nhat-ban' : '/danh-sach/hoat-hinh'),
        },
    };
}

export default async function AnimePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;
    const isAnime = params.country === 'nhat-ban';
    
    return (
        <Suspense fallback={<Loading />}>
            <AnimeData isAnime={isAnime} />
        </Suspense>
    );
}

async function AnimeData({ isAnime }: { isAnime: boolean }) {
    const initialData = await fetchCatalogData(
        "https://phimapi.com/v1/api/danh-sach/hoat-hinh",
        1,
        32,
        {
            country: isAnime ? 'nhat-ban' : undefined
        }
    );

    return <AnimeClient initialData={initialData} />;
}

