import { Metadata } from "next";
import { Suspense } from "react";
import SeriesClient from "./SeriesClient";
import CatalogSkeleton from "@/app/components/Movies/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";
import { getAbsoluteUrl } from "@/app/config/site";
import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export const metadata: Metadata = {
    title: "Phim Bộ Mới Nhất 2026 | LoFilm - Xem Phim Bộ Vietsub Chất Lượng Cao",
    description: "Tổng hợp các bộ phim dài tập, phim bộ hot nhất từ Trung Quốc, Hàn Quốc, Âu Mỹ mới nhất được cập nhật liên tục mỗi ngày trên LoFilm. Xem phim bộ vietsub, thuyết minh 4K miễn phí.",
    keywords: [
        "phim bo", "phim bo moi", "phim bo hay", "phim bo vietsub",
        "phim bo trung quoc", "phim bo han quoc", "phim bo au my",
        "xem phim bo online", "lofilm phim bo", "phim bo 2026", "phim bo 4k"
    ],
    alternates: {
        canonical: getAbsoluteUrl('/danh-sach/phim-bo'),
    },
};

export default function SeriesPage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <SeriesData />
        </Suspense>
    );
}

async function SeriesData() {
    const initialData = await fetchCatalogData(
        `${INTERNAL_API_URL}/danh-sach/phim-bo`,
        1,
        32
    );

    return <SeriesClient initialData={initialData} />;
}
