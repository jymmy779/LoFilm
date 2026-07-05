"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

import { CatalogInitialData } from "@/app/utils/serverFetch";

export default function TVShowsClient({ initialData }: { initialData?: CatalogInitialData }) {
    return (
        <MovieCatalogClient
            title="TV Shows Truyền Hình"
            baseApiUrl="https://phimapi.com/v1/api/danh-sach/tv-shows"
            defaultType="tvshows"
            initialData={initialData}
        />
    );
}
