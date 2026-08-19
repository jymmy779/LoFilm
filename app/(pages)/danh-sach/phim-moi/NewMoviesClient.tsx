"use client";

import MovieCatalogClient from "@/app/components/Movies/MovieCatalog/MovieCatalogClient";

import { CatalogInitialData } from "@/app/utils/serverFetch";

import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export default function NewMoviesClient({ initialData }: { initialData?: CatalogInitialData }) {
    return (
        <MovieCatalogClient
            title="Danh sách Phim mới"
            baseApiUrl={`${INTERNAL_API_URL}/danh-sach/phim-moi-cap-nhat`}
            itemsPerPage={32}
            hideSidebar={true}
            initialData={initialData}
        />
    );
}
