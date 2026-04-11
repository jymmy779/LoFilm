import { Metadata } from "next";
import { Suspense } from "react";
import NewMoviesClient from "./NewMoviesClient";

export const revalidate = 30;

export const metadata: Metadata = {
    title: "Phim Mới Cập Nhật Liên Tục, Thể Loại Đa Dạng | LoFilm",
    description: "Khám phá danh sách phim mới nhất được cập nhật mỗi ngày.",
};

export default function NewMoviesPage() {
    return (
        <Suspense>
            <NewMoviesClient />
        </Suspense>
    );
}
