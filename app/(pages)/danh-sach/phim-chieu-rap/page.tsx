import { Metadata } from "next";
import { Suspense } from "react";
import TheatersClient from "./TheatersClient";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export const metadata: Metadata = {
    title: "Danh sách Phim Chiếu Rạp Mới Nhất | LoFilm",
    description: "Khám phá danh sách các bộ phim chiếu rạp mới được cập nhật liên tục.",
};

export default async function TheaterMoviesPage() {
    const initialData = await fetchCatalogData(
        "https://phimapi.com/v1/api/danh-sach/phim-chieu-rap",
        1,
        32
    );

    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <TheatersClient initialData={initialData} />
        </Suspense>
    );
}
