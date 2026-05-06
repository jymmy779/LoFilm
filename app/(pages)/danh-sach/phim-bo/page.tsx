import { Metadata } from "next";
import { Suspense } from "react";
import SeriesClient from "./SeriesClient";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";

export const revalidate = 30;

export const metadata: Metadata = {
    title: "Danh sách Phim Bộ | LoFilm - Xem phim bộ online hay nhất",
    description: "Tổng hợp các bộ phim dài tập, phim bộ hot nhất, được cập nhật liên tục mỗi ngày trên LoFilm. Phim bộ Trung Quốc, Hàn Quốc, Âu Mỹ vietsub.",
    keywords: ["phim bo", "phim bo moi", "phim bo hay", "phim bo vietsub", "phim bo trung quoc", "phim bo han quoc", "phim bo au my", "xem phim bo online", "lofilm phim bo"],
};

export default function SeriesPage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <SeriesClient />
        </Suspense>
    );
}
