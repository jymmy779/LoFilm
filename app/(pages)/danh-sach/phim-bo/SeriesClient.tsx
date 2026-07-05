"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

import { CatalogInitialData } from "@/app/utils/serverFetch";

export default function SeriesClient({ initialData }: { initialData?: CatalogInitialData }) {
    return (
        <MovieCatalogClient
            title="Danh sách Phim bộ"
            baseApiUrl="https://phimapi.com/v1/api/danh-sach/phim-bo"
            itemsPerPage={32}
            hideSidebar={true}
            defaultType="series"
            initialData={initialData}
        />
    );
}
