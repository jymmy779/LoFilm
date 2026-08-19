"use client";

import MovieCatalogClient from "@/app/components/Movies/MovieCatalog/MovieCatalogClient";

import { CatalogInitialData } from "@/app/utils/serverFetch";

import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export default function TVShowsClient({ initialData }: { initialData?: CatalogInitialData }) {
    return (
        <MovieCatalogClient
            title="TV Shows Truyền Hình"
            baseApiUrl={`${INTERNAL_API_URL}/danh-sach/tv-shows`}
            defaultType="tvshows"
            initialData={initialData}
        />
    );
}
