"use client";

import MovieCatalogClient from "@/app/components/Movies/MovieCatalog/MovieCatalogClient";

import { CatalogInitialData } from "@/app/utils/serverFetch";

import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export default function TheatersClient({ initialData }: { initialData?: CatalogInitialData }) {
    return (
        <MovieCatalogClient
            title="Danh sách Phim chiếu rạp"
            baseApiUrl={`${INTERNAL_API_URL}/danh-sach/phim-chieu-rap`}
            defaultType="cinema"
            hideSidebar={true}
            itemsPerPage={32}
            initialData={initialData}
        />
    );
}
