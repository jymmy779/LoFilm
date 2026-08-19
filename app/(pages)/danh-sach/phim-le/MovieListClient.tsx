"use client";

import MovieCatalogClient from "@/app/components/Movies/MovieCatalog/MovieCatalogClient";

import { CatalogInitialData } from "@/app/utils/serverFetch";

import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export default function MovieListClient({ initialData }: { initialData?: CatalogInitialData }) {
    return (
        <MovieCatalogClient
            title="Danh sách Phim Lẻ"
            baseApiUrl={`${INTERNAL_API_URL}/danh-sach/phim-le`}
            itemsPerPage={32}
            hideSidebar={true}
            defaultType="single"
            initialData={initialData}
        />
    );
}
