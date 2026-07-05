"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

import { CatalogInitialData } from "@/app/utils/serverFetch";

export default function NewMoviesClient({ initialData }: { initialData?: CatalogInitialData }) {
    return (
        <MovieCatalogClient
            title="Danh sách Phim mới"
            baseApiUrl="https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3"
            itemsPerPage={32}
            hideSidebar={true}
            initialData={initialData}
        />
    );
}
