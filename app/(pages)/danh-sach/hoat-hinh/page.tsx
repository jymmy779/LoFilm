import { Metadata } from "next";
import { Suspense } from "react";
import AnimeClient from "./AnimeClient";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";

export const revalidate = 30;

export const metadata: Metadata = {
    title: "Phim Hoạt Hình Anime | LoFilm - Xem phim hoạt hình mới nhất",
    description: "Tổng hợp các bộ phim hoạt hình, anime hay nhất, thuyết minh vietsub cực chất, cập nhật liên tục mỗi ngày trên LoFilm.",
};

export default function AnimePage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <AnimeClient />
        </Suspense>
    );
}
