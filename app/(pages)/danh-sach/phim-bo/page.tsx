import { Metadata } from "next";
import { Suspense } from "react";
import SeriesClient from "./SeriesClient";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export const metadata: Metadata = {
    title: "Danh sách Phim Bộ | LoFilm - Xem phim bộ online hay nhất",
    description: "Tổng hợp các bộ phim dài tập, phim bộ hot nhất, được cập nhật liên tục mỗi ngày trên LoFilm. Phim bộ Trung Quốc, Hàn Quốc, Âu Mỹ vietsub.",
    keywords: ["phim bo", "phim bo moi", "phim bo hay", "phim bo vietsub", "phim bo trung quoc", "phim bo han quoc", "phim bo au my", "xem phim bo online", "lofilm phim bo"],
};

export default async function SeriesPage() {
    const initialData = await fetchCatalogData(
        "https://phimapi.com/v1/api/danh-sach/phim-bo",
        1,
        32
    );

    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <SeriesClient initialData={initialData} />
        </Suspense>
    );
}
