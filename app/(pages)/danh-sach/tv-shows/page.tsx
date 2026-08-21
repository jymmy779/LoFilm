import { Metadata } from "next";
import { Suspense } from "react";
import TVShowsClient from "./TVShowsClient";
import CatalogSkeleton from "@/app/components/Movies/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";
import { getAbsoluteUrl } from "@/app/config/site";
import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export const metadata: Metadata = {
    title: "TV Shows & Gameshow Hot Nhất | LoFilm - Xem Online Miễn Phí",
    description: "Khám phá các chương trình truyền hình, TV shows, gameshow nổi tiếng nhất, cập nhật liên tục mỗi ngày trên LoFilm. Xem vietsub, thuyết minh 4K hoàn toàn miễn phí.",
    keywords: [
        "tv shows", "gameshow", "chuong trinh truyen hinh", "tv show han quoc",
        "running man", "variety show", "reality show", "xem tv show online",
        "lofilm tv shows", "tv shows vietsub", "gameshow vietsub"
    ],
    alternates: {
        canonical: getAbsoluteUrl('/danh-sach/tv-shows'),
    },
};

export default function TVShowsPage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <TvShowsData />
        </Suspense>
    );
}

async function TvShowsData() {
    const initialData = await fetchCatalogData(
        `${INTERNAL_API_URL}/danh-sach/tv-shows`,
        1,
        32
    );

    return <TVShowsClient initialData={initialData} />;
}
