import { Metadata } from "next";
import { Suspense } from "react";
import TheatersClient from "./TheatersClient";

export const metadata: Metadata = {
    title: "Danh sách Phim Chiếu Rạp | LoFilm - Xem phim chiếu rạp mới nhất",
    description: "Tổng hợp các bộ phim vừa chiếu rạp, phim bom tấn mới nhất được cập nhật liên tục trên LoFilm.",
};

export default function TheatersPage() {
    return (
        <Suspense>
            <TheatersClient />
        </Suspense>
    );
}
