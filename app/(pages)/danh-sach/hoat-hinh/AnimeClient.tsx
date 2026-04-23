"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

export default function AnimeClient() {
    return (
        <MovieCatalogClient
            title="Phim Hoạt Hình - Anime"
            baseApiUrl="https://phimapi.com/v1/api/danh-sach/hoat-hinh"
            defaultType="hoathinh"
        />
    );
}
