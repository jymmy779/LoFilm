"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

import { CatalogInitialData } from "@/app/utils/serverFetch";

export default function TheatersClient({ initialData }: { initialData?: CatalogInitialData }) {
    return (
        <MovieCatalogClient
            title="Danh sách Phim chiếu rạp"
            baseApiUrl="https://phimapi.com/v1/api/danh-sach/phim-chieu-rap"
            defaultType="cinema"
            hideSidebar={true}
            itemsPerPage={32}
            initialData={initialData}
        />
    );
}
