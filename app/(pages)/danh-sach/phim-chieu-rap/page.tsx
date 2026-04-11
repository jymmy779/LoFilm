import { Metadata } from "next";
import { Suspense } from "react";
import TheaterMoviesClient from "./TheaterMoviesClient";

export const revalidate = 30;

export const metadata: Metadata = {
    title: "Danh sách Phim Chiếu Rạp Mới Nhất | LoFilm",
    description: "Khám phá danh sách các bộ phim chiếu rạp mới được cập nhật liên tục.",
};

export default function TheaterMoviesPage() {
    return (
        <Suspense>
            <TheaterMoviesClient />
        </Suspense>
    );
}
