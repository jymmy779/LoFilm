"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

export default function MovieListClient() {
    return (
        <MovieCatalogClient
            title="Danh sách Phim Lẻ"
            baseApiUrl="https://phimapi.com/v1/api/danh-sach/phim-le"
            itemsPerPage={32}
            hideSidebar={true}
            defaultType="single"
        />
    );
}
