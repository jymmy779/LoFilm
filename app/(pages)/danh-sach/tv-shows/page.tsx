import { Metadata } from "next";
import { Suspense } from "react";
import TVShowsClient from "./TVShowsClient";

export const revalidate = 30;

export const metadata: Metadata = {
    title: "Danh sách TV Shows mới nhất | LoFilm - Gameshow hot cập nhật 24/7",
    description: "Khám phá các chương trình truyền hình, TV shows hot nhất, cập nhật liên tục mỗi ngày trên LoFilm.",
};

export default function TVShowsPage() {
    return (
        <Suspense>
            <TVShowsClient />
        </Suspense>
    );
}
