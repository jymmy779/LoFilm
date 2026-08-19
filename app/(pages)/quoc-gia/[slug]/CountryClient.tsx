"use client";

import MovieCatalogClient from "@/app/components/Movies/MovieCatalog/MovieCatalogClient";

import { CatalogInitialData } from "@/app/utils/serverFetch";

interface CountryClientProps {
    slug: string;
    title?: string;
    initialData?: CatalogInitialData;
}

import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export default function CountryClient({ slug, title, initialData }: CountryClientProps) {
    return (
        <MovieCatalogClient
            baseApiUrl={`${INTERNAL_API_URL}/quoc-gia/${slug}`}
            slug={slug}
            title={title}
            itemsPerPage={48}
            emptyMessage="Chưa có phim nào đến từ quốc gia này."
            initialData={initialData}
        />
    );
}
