import { Metadata } from "next";
import { Suspense } from "react";
import SeriesClient from "./SeriesClient";

export const revalidate = 30;

export const metadata: Metadata = {
    title: "Danh sách Phim Bộ | LoFilm - Xem phim bộ online hay nhất",
    description: "Tổng hợp các bộ phim dài tập, phim bộ hot nhất, được cập nhật liên tục mỗi ngày trên LoFilm.",
};

export default function SeriesPage() {
    return (
        <Suspense>
            <SeriesClient />
        </Suspense>
    );
}
