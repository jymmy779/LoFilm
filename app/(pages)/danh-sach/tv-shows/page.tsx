import { Metadata } from "next";
import { Suspense } from "react";
import TVShowsClient from "./TVShowsClient";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export const metadata: Metadata = {
    title: "Danh sách TV Shows mới nhất | LoFilm - Gameshow hot cập nhật 24/7",
    description: "Khám phá các chương trình truyền hình, TV shows hot nhất, cập nhật liên tục mỗi ngày trên LoFilm.",
};

export default async function TVShowsPage() {
    const initialData = await fetchCatalogData(
        "https://phimapi.com/v1/api/danh-sach/tv-shows",
        1,
        32
    );

    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <TVShowsClient initialData={initialData} />
        </Suspense>
    );
}
