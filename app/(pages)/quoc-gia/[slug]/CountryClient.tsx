"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

interface CountryClientProps {
    slug: string;
}

export default function CountryClient({ slug }: CountryClientProps) {
    return (
        <MovieCatalogClient
            baseApiUrl={`https://phimapi.com/v1/api/quoc-gia/${slug}`}
            slug={slug}
            itemsPerPage={48}
            emptyMessage="Chưa có phim nào đến từ quốc gia này."
        />
    );
}
