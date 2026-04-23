"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

export default function SeriesClient() {
    return (
        <MovieCatalogClient
            title="Danh sách Phim bộ"
            baseApiUrl="https://phimapi.com/v1/api/danh-sach/phim-bo"
            itemsPerPage={32}
            hideSidebar={true}
        />
    );
}
