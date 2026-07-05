import { Metadata } from "next";
import { Suspense } from "react";
import AnimeClient from "./AnimeClient";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
    const params = await searchParams;
    const isAnime = params.country === 'nhat-ban';
    
    return {
        title: isAnime 
            ? "Phim Anime Nhật Bản | LoFilm - Xem anime mới nhất" 
            : "Phim Hoạt Hình Hay | LoFilm - Xem phim hoạt hình mới nhất",
        description: isAnime
            ? "Tổng hợp các bộ phim anime Nhật Bản hay nhất, thuyết minh vietsub cực chất, cập nhật liên tục mỗi ngày trên LoFilm."
            : "Tổng hợp các bộ phim hoạt hình hay nhất, thuyết minh vietsub cực chất, cập nhật liên tục mỗi ngày trên LoFilm.",
    };
}

export default async function AnimePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;
    const isAnime = params.country === 'nhat-ban';
    
    const initialData = await fetchCatalogData(
        "https://phimapi.com/v1/api/danh-sach/hoat-hinh",
        1,
        32,
        {
            country: isAnime ? 'nhat-ban' : undefined
        }
    );

    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <AnimeClient initialData={initialData} />
        </Suspense>
    );
}
