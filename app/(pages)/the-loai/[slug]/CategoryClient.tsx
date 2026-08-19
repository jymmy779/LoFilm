"use client";

import MovieCatalogClient from "@/app/components/Movies/MovieCatalog/MovieCatalogClient";

import { CatalogInitialData } from "@/app/utils/serverFetch";

interface CategoryClientProps {
    slug: string;
    title?: string;
    initialData?: CatalogInitialData;
}

import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export default function CategoryClient({ slug, title, initialData }: CategoryClientProps) {
    return (
        <MovieCatalogClient
            baseApiUrl={`${INTERNAL_API_URL}/the-loai/${slug}`}
            slug={slug}
            title={title}
            itemsPerPage={48}
            emptyMessage="Chưa có phim nào trong thể loại này."
            initialData={initialData}
        />
    );
}
