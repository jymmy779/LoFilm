import { Metadata } from "next";
import { Suspense } from "react";
import TheatersClient from "./TheatersClient";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export const metadata: Metadata = {
    title: "Danh sách Phim Chiếu Rạp Mới Nhất | LoFilm",
    description: "Khám phá danh sách các bộ phim chiếu rạp mới được cập nhật liên tục.",
};

export default function TheaterMoviesPage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <TheatersClient />
        </Suspense>
    );
}
