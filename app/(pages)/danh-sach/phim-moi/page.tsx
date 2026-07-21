import { Metadata } from "next";
import { Suspense } from "react";
import NewMoviesClient from "./NewMoviesClient";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export const metadata: Metadata = {
    title: "Phim Mới Cập Nhật Liên Tục, Thể Loại Đa Dạng | LoFilm",
    description: "Khám phá danh sách phim mới nhất được cập nhật mỗi ngày. Phim chiếu rạp, phim bộ, phim lẻ vietsub chất lượng cao.",
    keywords: ["phim moi", "phim moi nhat", "phim moi cap nhat", "phim hay 2026", "phim chieu rap moi", "lofilm phim moi", "xem phim moi online"],
};

export default function NewMoviesPage() {
    return (
        <Suspense fallback={<CatalogSkeleton hideSidebar={true} />}>
            <NewMoviesData />
        </Suspense>
    );
}

async function NewMoviesData() {
    const initialData = await fetchCatalogData(
        "https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3",
        1,
        32
    );

    return <NewMoviesClient initialData={initialData} />;
}

