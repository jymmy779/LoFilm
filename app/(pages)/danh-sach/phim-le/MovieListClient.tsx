"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

import { CatalogInitialData } from "@/app/utils/serverFetch";

export default function MovieListClient({ initialData }: { initialData?: CatalogInitialData }) {
    return (
        <MovieCatalogClient
            title="Danh sách Phim Lẻ"
            baseApiUrl="https://phimapi.com/v1/api/danh-sach/phim-le"
            itemsPerPage={32}
            hideSidebar={true}
            defaultType="single"
            initialData={initialData}
        />
    );
}
