import { Metadata } from "next";
import { Suspense } from "react";
import NewMoviesClient from "./NewMoviesClient";
import CatalogSkeleton from "@/app/components/Movies/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";
import { getAbsoluteUrl } from "@/app/config/site";
import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export const metadata: Metadata = {
    title: "Phim Mới Cập Nhật Hôm Nay | LoFilm - Phim Mới Nhất 2026 Vietsub",
    description: "Khám phá danh sách phim mới nhất được cập nhật mỗi ngày trên LoFilm. Phim chiếu rạp, phim bộ, phim lẻ, anime vietsub chất lượng cao 4K. Luôn có phim mới nhất 2025-2026 mà bạn không muốn bỏ lỡ.",
    keywords: [
        "phim moi", "phim moi nhat", "phim moi cap nhat", "phim hay 2026",
        "phim moi hom nay", "phim chieu rap moi", "anime moi", "phim bo moi",
        "lofilm phim moi", "xem phim moi online", "phim 2026 moi nhat"
    ],
    alternates: {
        canonical: getAbsoluteUrl('/danh-sach/phim-moi'),
    },
};

export default function NewMoviesPage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <NewMoviesData />
        </Suspense>
    );
}

async function NewMoviesData() {
    const initialData = await fetchCatalogData(
        `${INTERNAL_API_URL}/danh-sach/phim-moi-cap-nhat`,
        1,
        32
    );

    return <NewMoviesClient initialData={initialData} />;
}
