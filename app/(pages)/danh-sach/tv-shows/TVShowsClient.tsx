"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

export default function TVShowsClient() {
    return (
        <MovieCatalogClient
            title="TV Shows Truyền Hình"
            baseApiUrl="https://phimapi.com/v1/api/danh-sach/tv-shows"
            defaultType="tvshows"
        />
    );
}
