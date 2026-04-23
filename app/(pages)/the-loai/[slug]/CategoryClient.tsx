"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

interface CategoryClientProps {
    slug: string;
}

export default function CategoryClient({ slug }: CategoryClientProps) {
    return (
        <MovieCatalogClient
            baseApiUrl={`https://phimapi.com/v1/api/the-loai/${slug}`}
            slug={slug}
            itemsPerPage={48}
            emptyMessage="Chưa có phim nào trong thể loại này."
        />
    );
}
