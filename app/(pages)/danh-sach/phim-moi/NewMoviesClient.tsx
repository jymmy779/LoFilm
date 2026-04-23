"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

export default function NewMoviesClient() {
    return (
        <MovieCatalogClient
            title="Danh sách Phim mới"
            baseApiUrl="https://phimapi.com/danh-sach/phim-moi-cap-nhat-v2"
            itemsPerPage={32}
            hideSidebar={true}
        />
    );
}
