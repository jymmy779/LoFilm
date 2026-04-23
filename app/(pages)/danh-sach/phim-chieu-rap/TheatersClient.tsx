"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

export default function TheatersClient() {
    return (
        <MovieCatalogClient
            title="Danh sách Phim chiếu rạp"
            baseApiUrl="https://phimapi.com/v1/api/danh-sach/phim-chieu-rap"
        />
    );
}
