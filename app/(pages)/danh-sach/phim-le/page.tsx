import { Metadata } from "next";
import { Suspense } from "react";
import MovieListClient from "./MovieListClient";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";

export const revalidate = 30;

export const metadata: Metadata = {
    title: "Danh sách Phim Lẻ mới nhất | LoFilm - Kho phim lẻ Việt Nam, Quốc Tế",
    description: "Tổng hợp các phim lẻ, phim một tập mới nhất từ khắp nơi trên thế giới, cập nhật liên tục.",
};

export default function MovieListPage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <MovieListClient />
        </Suspense>
    );
}
