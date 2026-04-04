import { Metadata } from "next";
import MoviesClient from "./MoviesClient";

export const metadata: Metadata = {
    title: "Danh sách Phim Lẻ | LoFilm - Xem phim lẻ online hay nhất",
    description: "Tổng hợp các bộ phim lẻ mới nhất, phim hành động, tình cảm, kinh dị cực hay, cập nhật liên tục mỗi ngày trên LoFilm.",
};

export default function MoviesPage() {
    return (
        <>
            <MoviesClient />
        </>
    );
}
