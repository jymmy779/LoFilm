import Loading from "@/app/loading";
import { Metadata } from "next";
import { Suspense } from "react";
import TheatersClient from "./TheatersClient";
import CatalogSkeleton from "@/app/components/Movies/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";

import { getAbsoluteUrl } from "@/app/config/site";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export const metadata: Metadata = {
    title: "Phim Chiếu Rạp Mới Nhất 2026 | LoFilm - Xem Online Chất Lượng Cao",
    description: "Danh sách phim chiếu rạp mới nhất 2025-2026, phầm bom tấn Hollywood, Marvel, DC, hoạt hình Pixar, phim châu Á. Cập nhật liên tục mỗi ngày trên LoFilm. Xem vietsub, thuyết minh 4K miễn phí.",
    keywords: [
        "phim chieu rap", "phim chieu rap moi nhat", "phim bom tan 2026",
        "phim marvel moi", "phim dc moi", "phim hollywood", "phim hoat hinh pixar",
        "phim chieu rap vietsub", "phim chieu rap thuyet minh", "xem phim chieu rap online",
        "lofilm phim chieu rap", "phim rap 4k"
    ],
    alternates: {
        canonical: getAbsoluteUrl('/danh-sach/phim-chieu-rap'),
    },
};

export default function TheaterMoviesPage() {
    return (
        <Suspense fallback={<Loading />}>
            <TheaterMoviesData />
        </Suspense>
    );
}

import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

async function TheaterMoviesData() {
    const initialData = await fetchCatalogData(
        `${INTERNAL_API_URL}/danh-sach/phim-chieu-rap`,
        1,
        32
    );

    return <TheatersClient initialData={initialData} />;
}
