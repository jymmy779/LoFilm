import { Metadata } from "next";
import { Suspense } from "react";
import MovieListClient from "./MovieListClient";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export const metadata: Metadata = {
    title: "Danh sách Phim Lẻ mới nhất | LoFilm - Kho phim lẻ Việt Nam, Quốc Tế",
    description: "Tổng hợp các phim lẻ, phim một tập mới nhất từ khắp nơi trên thế giới, cập nhật liên tục mỗi ngày trên LoFilm. Xem phim lẻ 4K, Vietsub cực nhanh.",
    keywords: ["phim le", "phim le moi", "phim le hay", "phim le vietsub", "phim le chieu rap", "xem phim le online", "phim le 4k", "lofilm phim le"],
};

export default function MovieListPage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <MovieListData />
        </Suspense>
    );
}

async function MovieListData() {
    const initialData = await fetchCatalogData(
        "https://phimapi.com/v1/api/danh-sach/phim-le",
        1,
        32
    );

    return <MovieListClient initialData={initialData} />;
}

